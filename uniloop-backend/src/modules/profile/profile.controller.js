const pool     = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── Credibility Score hesaplama yardımcısı ─────────────────
// Formül (toplam 100 puan):
//   ⭐ Yıldız ortalaması (0-5)  → 0-60 puan
//   👥 Puan veren kişi sayısı  → 0-30 puan  (her kişi +3, maks 10 kişi)
//   🎓 GPA (0.0-4.0)           → 0-10 puan
const calculateCredibilityScore = ({ gpa, rating_average, rating_count }) => {
  const ratingScore = Math.round((parseFloat(rating_average) || 0) / 5 * 60);
  const countScore  = Math.min((parseInt(rating_count, 10) || 0) * 3, 30);
  const gpaScore    = gpa ? Math.round((parseFloat(gpa) / 4.0) * 10) : 0;
  return Math.min(ratingScore + countScore + gpaScore, 100);
};

// ── GET /api/profile/:userId ───────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.rating_average, u.rating_count, u.created_at,
         p.bio, p.gpa, p.department, p.year_of_study,
         p.certifications, p.achievements, p.credibility_score
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Kullanıcı bulunamadı.', 404));
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/profile/me ────────────────────────────────────
const updateMyProfile = async (req, res, next) => {
  const { bio, gpa, department, year_of_study } = req.body;
  const userId = req.user.id;

  try {
    // Mevcut profili al (score hesabı için)
    const current = await pool.query(
      `SELECT p.certifications, p.achievements,
              u.rating_average, u.rating_count
       FROM user_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );

    const row = current.rows[0] || {};
    const newScore = calculateCredibilityScore({
      gpa:            gpa ?? row.gpa,
      rating_average: row.rating_average || 0,
      rating_count:   row.rating_count   || 0,
    });

    const result = await pool.query(
      `UPDATE user_profiles
       SET bio = COALESCE($1, bio),
           gpa = COALESCE($2, gpa),
           department = COALESCE($3, department),
           year_of_study = COALESCE($4, year_of_study),
           credibility_score = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING *`,
      [bio, gpa, department, year_of_study, newScore, userId]
    );

    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/me/achievements ─────────────────────
const addAchievement = async (req, res, next) => {
  const { title, year } = req.body;
  if (!title) {
    return next(new AppError('Başarı başlığı zorunludur.', 400));
  }

  const userId = req.user.id;

  try {
    const current = await pool.query(
      `SELECT p.certifications, p.achievements,
              u.rating_average, u.rating_count, p.gpa
       FROM user_profiles p JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );

    const row   = current.rows[0];
    const achvs = [...(row.achievements || []), { title, year }];
    const newScore = calculateCredibilityScore({
      gpa:            row.gpa,
      rating_average: row.rating_average || 0,
      rating_count:   row.rating_count   || 0,
    });

    const result = await pool.query(
      `UPDATE user_profiles
       SET achievements = $1::jsonb, credibility_score = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING achievements, credibility_score`,
      [JSON.stringify(achvs), newScore, userId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/profile/:userId/reviews ───────────────────────
// Kullanıcıya yapılan değerlendirmeleri döndürür.
// Güvenlik: değerlendiren kişinin adının ilk 3 harfi görünür, kalanı *** ile sansülenir.
const getUserReviews = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         r.rating,
         r.comment,
         r.created_at,
         u.full_name AS reviewer_full_name
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );

    // İlk 3 harf + sansür
    const reviews = result.rows.map(row => ({
      rating:     row.rating,
      comment:    row.comment,
      created_at: row.created_at,
      reviewer_name: row.reviewer_full_name.length > 3
        ? row.reviewer_full_name.slice(0, 3) + '*'.repeat(row.reviewer_full_name.length - 3)
        : row.reviewer_full_name,
    }));

    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/profile/:userId/tasks ─────────────────────────
// Kullanıcının açık (open) ilanlarını döndürür.
const getUserTasks = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         t.id, t.title, t.description, t.task_type, t.status,
         t.reward_kredi, t.location, t.from_location, t.to_location,
         t.created_at,
         u.full_name AS creator_name,
         u.rating_average, u.rating_count
       FROM tasks t
       JOIN users u ON u.id = t.creator_id
       WHERE t.creator_id = $1 AND t.status = 'open'
       ORDER BY t.created_at DESC`,
      [req.params.userId]
    );

    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateMyProfile, addAchievement, getUserReviews, getUserTasks };
