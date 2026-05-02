const pool = require('../../config/db');
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
        t.creator_id,
        t.is_auto_generated, t.created_at, t.expires_at,
        u.full_name AS creator_name,
        u.rating_average, u.rating_count,
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
// Görevi üstlenme + Escrow oluşturma (ACID)
//
// Bu aşamada PARA HAREKETI OLMAZ — sadece escrow kaydı oluşturulur.
// Gerçek KP transferi her iki taraf onayladığında (approveEscrow) yapılır.
//
// Para akışı (task_type'a göre):
//  skill_exchange : taker öder (buyer), creator kazanır (seller)
//  courier_offer  : taker öder (buyer), creator kazanır (seller)
//  courier_request: creator öder (buyer), taker kazanır (seller)
const assignTask = async (req, res, next) => {
  const taskId = parseInt(req.params.id, 10);
  const takerId = parseInt(req.user.id, 10); // İlanı kabul eden kişi
  const client = await pool.connect();

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
    // DB'den gelen ID'ler string olabilir — tip güvenli karşılaştırma
    const creatorId = parseInt(task.creator_id, 10);

    if (task.status !== 'open') {
      await client.query('ROLLBACK');
      return next(new AppError('Bu görev artık müsait değil.', 400));
    }

    if (creatorId === takerId) {
      await client.query('ROLLBACK');
      return next(new AppError('Kendi ilanınıza katılamazsınız.', 400));
    }

    // ── Para akışı: görev türüne göre roller belirlenir ────────
    // buyer  = parayı ödeyen (escrow'a kilitlenen)
    // seller = parayı alacak olan (escrow serbest kalınca kazanan)
    //
    //  skill_exchange : İlanı açan yeteneğini sunar → taker öder, creator kazanır
    //  courier_offer  : Kurye hizmetini sunar        → taker öder, creator kazanır
    //  courier_request: Taşıma talep eder            → creator öder, taker kazanır
    let buyerId, sellerId;
    if (task.task_type === 'courier_request') {
      buyerId = creatorId;  // hizmeti talep eden ilan sahibi öder
      sellerId = takerId;    // kurye/hizmeti veren kazanır
    } else {
      // skill_exchange ve courier_offer: ilan sahibi hizmeti sunar, kabul eden öder
      buyerId = takerId;    // hizmeti satın alan öder
      sellerId = creatorId;  // hizmeti sunan ilan sahibi kazanır
    }

    // ── OTOMATİK KURYE İLANI — Anlık Ödeme ─────────────────────
    // Trigger'dan gelen ilanlar için SYSTEM zaten parayı kilitledi ve
    // buyer_approved = TRUE. Ön-escrow yoksa (eski ilanlar) SYSTEM
    // cüzdanından anlık olarak oluşturulur ve direkt ödenir.
    if (task.is_auto_generated) {
      const SYSTEM_ID = parseInt(process.env.SYSTEM_USER_ID || '1', 10);
      const amount    = parseInt(task.reward_kredi, 10);

      // Mevcut escrow'u kontrol et (trigger tarafından oluşturulmuş olabilir)
      const existingEscrow = await client.query(
        'SELECT * FROM escrows WHERE task_id = $1 FOR UPDATE',
        [taskId]
      );

      if (existingEscrow.rows.length === 0) {
        // Ön-escrow yok (eski ilan veya seed) → SYSTEM cüzdanından anlık oluştur
        const sysWallet = await client.query(
          'SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE',
          [SYSTEM_ID]
        );

        if (sysWallet.rows.length === 0 || sysWallet.rows[0].balance < amount) {
          await client.query('ROLLBACK');
          return next(new AppError(
            `SYSTEM bakiyesi yetersiz. Gerekli: ${amount} KP, Mevcut: ${sysWallet.rows[0]?.balance ?? 0} KP`,
            400
          ));
        }

        // SYSTEM cüzdanından düş
        await client.query(
          'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
          [amount, sysWallet.rows[0].id]
        );

        // Anlık tamamlanmış escrow oluştur
        await client.query(
          `INSERT INTO escrows
             (task_id, buyer_id, seller_id, amount, status,
              buyer_approved, seller_approved, released_at)
           VALUES ($1, $2, $3, $4, 'released', TRUE, TRUE, NOW())`,
          [taskId, SYSTEM_ID, takerId, amount]
        );
      } else {
        // Mevcut escrow'u tamamlandı olarak güncelle
        await client.query(
          `UPDATE escrows
           SET seller_id       = $1,
               seller_approved = TRUE,
               status          = 'released',
               released_at     = NOW()
           WHERE task_id = $2`,
          [takerId, taskId]
        );
      }

      // Kuryenin cüzdanına KP ekle
      const courierWallet = await client.query(
        'SELECT id FROM wallets WHERE user_id = $1',
        [takerId]
      );

      if (courierWallet.rows.length === 0) {
        await client.query('ROLLBACK');
        return next(new AppError('Kurye cüzdanı bulunamadı.', 404));
      }

      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [amount, courierWallet.rows[0].id]
      );

      // İşlem kaydı
      await client.query(
        `INSERT INTO transactions (wallet_id, amount, type, description, related_task_id)
         VALUES ($1, $2, 'escrow_release', 'Ortak sepet kurye görevi tamamlandı — ödeme anında yapıldı! 🚚', $3)`,
        [courierWallet.rows[0].id, amount, taskId]
      );

      // Görevi tamamlandı olarak işaretle
      await client.query(
        `UPDATE tasks SET status = 'completed', assignee_id = $1 WHERE id = $2`,
        [takerId, taskId]
      );

      await client.query('COMMIT');

      return res.json({
        success:     true,
        auto_paid:   true,
        message:     `Kurye görevi kabul edildi! ${amount} KP anında cüzdanınıza yatırıldı. 🚚`,
        paid_amount: amount,
      });
    }

    // ── NORMAL İLAN: Ön bakiye kontrolü ────────────────────────
    const walletResult = await client.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [buyerId]
    );

    if (walletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Ödeme yapacak kişinin cüzdanı bulunamadı.', 404));
    }

    const wallet = walletResult.rows[0];

    if (wallet.balance < task.reward_kredi) {
      await client.query('ROLLBACK');
      const who = task.task_type === 'courier_request' ? 'İlan sahibinin bakiyesi' : 'Bakiyeniz';
      return next(new AppError(
        `${who} yetersiz. Gerekli: ${task.reward_kredi} KP, Mevcut: ${wallet.balance} KP`,
        400
      ));
    }

    // Yeni escrow oluştur (para onayda düşülecek)
    const escrowResult = await client.query(
      `INSERT INTO escrows (task_id, buyer_id, seller_id, amount, status)
       VALUES ($1, $2, $3, $4, 'locked')
       RETURNING *`,
      [taskId, buyerId, sellerId, task.reward_kredi]
    );

    // Görevi güncelle
    await client.query(
      `UPDATE tasks SET status = 'in_escrow', assignee_id = $1 WHERE id = $2`,
      [takerId, taskId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'İlan başarıyla kabul edildi. Ödeme emanete alındı.',
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

    // Credibility score'u yeni formüle göre güncelle
    // Formül: (rating_avg/5)*60 + min(rating_count*3,30) + (gpa/4)*10
    await client.query(
      `UPDATE user_profiles p
       SET credibility_score = LEAST(
         ROUND((u.rating_average / 5.0) * 60)
         + LEAST(u.rating_count * 3, 30)
         + COALESCE(ROUND((p.gpa / 4.0) * 10), 0),
         100
       ),
       updated_at = CURRENT_TIMESTAMP
       FROM users u
       WHERE p.user_id = $1 AND u.id = $1`,
      [reviewee_id]
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
