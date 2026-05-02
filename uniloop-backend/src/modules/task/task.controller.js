const pool     = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── Credibility çarpanı ────────────────────────────────────
const getMultiplier = (score) => {
  if (score >= 81) return 2.0;
  if (score >= 61) return 1.5;
  if (score >= 31) return 1.2;
  return 1.0;
};

// ── GET /api/tasks ─────────────────────────────────────────
// Filtreler: ?location=kutuphane&type=skill_exchange&status=open
const getTasks = async (req, res, next) => {
  const { location, type, status = 'open' } = req.query;

  try {
    let query = `
      SELECT
        t.id, t.title, t.description, t.task_type, t.status,
        t.reward_kredi, t.location, t.from_location, t.to_location,
        t.is_auto_generated, t.created_at, t.expires_at,
        u.full_name AS creator_name,
        p.credibility_score,
        ROUND(t.reward_kredi * (
          CASE
            WHEN p.credibility_score >= 81 THEN 2.0
            WHEN p.credibility_score >= 61 THEN 1.5
            WHEN p.credibility_score >= 31 THEN 1.2
            ELSE 1.0
          END
        )) AS effective_reward
      FROM tasks t
      JOIN users u ON u.id = t.creator_id
      LEFT JOIN user_profiles p ON p.user_id = t.creator_id
      WHERE t.status = $1
    `;

    const params = [status];

    if (location) {
      params.push(location);
      query += ` AND t.location = $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND t.task_type = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ success: true, count: result.rows.length, tasks: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tasks ────────────────────────────────────────
const createTask = async (req, res, next) => {
  const {
    title, description, task_type = 'skill_exchange',
    reward_kredi, location, from_location, to_location, expires_at,
  } = req.body;

  if (!title || !reward_kredi) {
    return next(new AppError('Başlık ve ödül miktarı zorunludur.', 400));
  }

  if (reward_kredi <= 0 || !Number.isInteger(Number(reward_kredi))) {
    return next(new AppError('Ödül miktarı pozitif tam sayı olmalıdır.', 400));
  }

  // courier_offer için from/to_location zorunlu
  if (task_type === 'courier_offer' && (!from_location || !to_location)) {
    return next(new AppError('Tersine kurye ilanı için kalkış ve varış noktası zorunludur.', 400));
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks
         (creator_id, title, description, task_type, reward_kredi,
          location, from_location, to_location, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.id, title, description, task_type,
        parseInt(reward_kredi, 10),
        location || null, from_location || null, to_location || null,
        expires_at || null,
      ]
    );

    res.status(201).json({ success: true, task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/tasks/:id/assign ────────────────────────────
// Görevi üstlenme + Escrow kilitleme (ACID)
const assignTask = async (req, res, next) => {
  const taskId   = parseInt(req.params.id, 10);
  const sellerId = req.user.id; // Görevi yapacak kişi
  const client   = await pool.connect();

  try {
    await client.query('BEGIN');

    // Görev bilgisini kilitle
    const taskResult = await client.query(
      'SELECT * FROM tasks WHERE id = $1 FOR UPDATE',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Görev bulunamadı.', 404));
    }

    const task = taskResult.rows[0];

    if (task.status !== 'open') {
      await client.query('ROLLBACK');
      return next(new AppError('Bu görev artık müsait değil.', 400));
    }

    if (task.creator_id === sellerId) {
      await client.query('ROLLBACK');
      return next(new AppError('Kendi ilanınıza görev üstlenemezsiniz.', 400));
    }

    const buyerId = task.creator_id;

    // Alıcının cüzdanını kilitle
    const walletResult = await client.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [buyerId]
    );

    if (walletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('İlan sahibinin cüzdanı bulunamadı.', 404));
    }

    const wallet = walletResult.rows[0];

    if (wallet.balance < task.reward_kredi) {
      await client.query('ROLLBACK');
      return next(new AppError('İlan sahibinin bakiyesi yetersiz.', 400));
    }

    // Alıcıdan parayı düş (escrow'a kilitlendi)
    await client.query(
      'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
      [task.reward_kredi, wallet.id]
    );

    // Escrow kaydı oluştur
    const escrowResult = await client.query(
      `INSERT INTO escrows (task_id, buyer_id, seller_id, amount, status)
       VALUES ($1, $2, $3, $4, 'locked')
       RETURNING *`,
      [taskId, buyerId, sellerId, task.reward_kredi]
    );

    // İşlem kaydı (alıcı için)
    await client.query(
      `INSERT INTO transactions (wallet_id, amount, type, description, related_task_id)
       VALUES ($1, $2, 'escrow_lock', $3, $4)`,
      [wallet.id, -task.reward_kredi, `"${task.title}" görevi için emanete kilitlendi`, taskId]
    );

    // Görevi güncelle
    await client.query(
      `UPDATE tasks SET status = 'in_escrow', assignee_id = $1 WHERE id = $2`,
      [sellerId, taskId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Görev başarıyla üstlenildi. Ödeme emanete alındı.',
      escrow:  escrowResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── POST /api/tasks/reviews ────────────────────────────────
const createReview = async (req, res, next) => {
  const { task_id, reviewee_id, rating, comment } = req.body;

  if (!task_id || !reviewee_id || !rating) {
    return next(new AppError('Görev ID, değerlendirilen kullanıcı ve puan zorunludur.', 400));
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
    return next(new AppError('Puan 1 ile 5 arasında tam sayı olmalıdır.', 400));
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Review ekle
    await client.query(
      `INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [task_id, req.user.id, reviewee_id, rating, comment || null]
    );

    // Kullanıcı rating ortalamasını güncelle
    await client.query(
      `UPDATE users
       SET
         rating_count   = rating_count + 1,
         rating_average = ROUND(
           ((rating_average * rating_count) + $1) / (rating_count + 1),
           2
         )
       WHERE id = $2`,
      [rating, reviewee_id]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Değerlendirme başarıyla eklendi.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getTasks, createTask, assignTask, createReview };
