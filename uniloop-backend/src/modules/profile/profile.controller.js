const pool     = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── Credibility Score hesaplama yardımcısı ─────────────────
const calculateCredibilityScore = ({ gpa, certifications, achievements, rating_average, rating_count }) => {
  let score = 0;

  // GPA puanı (maks 30)
  if (gpa !== null && gpa !== undefined) {
    if (gpa >= 3.0)       score += 30;
    else if (gpa >= 2.5)  score += 15;
  }

  // Sertifika puanı (her biri +10, maks 30)
  const certCount = Array.isArray(certifications) ? certifications.length : 0;
  score += Math.min(certCount * 10, 30);

  // Başarı puanı (her biri +5, maks 20)
  const achvCount = Array.isArray(achievements) ? achievements.length : 0;
  score += Math.min(achvCount * 5, 20);

  // Rating puanı (maks 20)
  if (rating_count > 0) {
    if (rating_average >= 4.5)      score += 20;
    else if (rating_average >= 4.0) score += 10;
  }

  return Math.min(score, 100);
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
      certifications: row.certifications || [],
      achievements:   row.achievements   || [],
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

// ── POST /api/profile/me/certifications ───────────────────
const addCertification = async (req, res, next) => {
  const { title, issuer, year } = req.body;
  if (!title || !issuer) {
    return next(new AppError('Sertifika başlığı ve veren kurum zorunludur.', 400));
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

    const row  = current.rows[0];
    const certs = [...(row.certifications || []), { title, issuer, year }];
    const newScore = calculateCredibilityScore({
      gpa:            row.gpa,
      certifications: certs,
      achievements:   row.achievements || [],
      rating_average: row.rating_average || 0,
      rating_count:   row.rating_count   || 0,
    });

    const result = await pool.query(
      `UPDATE user_profiles
       SET certifications = $1::jsonb, credibility_score = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING certifications, credibility_score`,
      [JSON.stringify(certs), newScore, userId]
    );

    res.json({ success: true, data: result.rows[0] });
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
      certifications: row.certifications || [],
      achievements:   achvs,
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

module.exports = { getProfile, updateMyProfile, addCertification, addAchievement };
