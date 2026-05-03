const pool = require('../../config/db');
const AppError = require('../../utils/appError');

// Etkinlikleri getir
const getEvents = async (req, res, next) => {
  try {
    const query = `
      SELECT e.*, u.full_name as creator_name,
      (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as current_participants,
      EXISTS(SELECT 1 FROM event_participants WHERE event_id = e.id AND user_id = $1) as is_joined
      FROM events e
      JOIN users u ON u.id = e.creator_id
      WHERE e.status IN ('open', 'full')
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json({ success: true, events: result.rows });
  } catch (err) {
    next(err);
  }
};

// Etkinlik oluştur (Bütçe baştan kilitlenir)
const createEvent = async (req, res, next) => {
  const { title, description, max_participants, reward_per_participant } = req.body;
  const creatorId = req.user.id;

  if (!title || !max_participants || !reward_per_participant) {
    return next(new AppError('Başlık, maksimum katılımcı ve kişi başı ödül zorunludur.', 400));
  }

  const budget = parseInt(max_participants, 10) * parseInt(reward_per_participant, 10);
  if (budget <= 0) return next(new AppError('Geçersiz bütçe.', 400));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cüzdan kontrolü
    const walletRes = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE', [creatorId]);
    if (walletRes.rows.length === 0) throw new AppError('Cüzdan bulunamadı', 404);
    
    const wallet = walletRes.rows[0];
    if (wallet.balance < budget) {
      throw new AppError(`Yetersiz bakiye. Bu etkinlik için ${budget} KP gerekiyor. (Mevcut: ${wallet.balance} KP)`, 400);
    }

    // Bütçeyi düş
    await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [budget, wallet.id]);

    // Etkinliği oluştur
    const eventRes = await client.query(
      `INSERT INTO events (creator_id, title, description, max_participants, reward_per_participant, total_locked_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open') RETURNING *`,
      [creatorId, title, description, max_participants, reward_per_participant, budget]
    );

    // İşlem kaydı
    await client.query(
      `INSERT INTO transactions (wallet_id, amount, type, description)
       VALUES ($1, $2, 'escrow_lock', $3)`,
      [wallet.id, budget, `Etkinlik bütçesi kilitlendi: ${title}`]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, event: eventRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// Etkinliğe katıl
const joinEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
    if (eventRes.rows.length === 0) throw new AppError('Etkinlik bulunamadı', 404);
    const event = eventRes.rows[0];

    if (event.creator_id === userId) throw new AppError('Kendi etkinliğinize katılamazsınız.', 400);
    if (event.status !== 'open') throw new AppError('Bu etkinlik şu an katılıma kapalı veya dolmuş.', 400);

    // Mükerrer katılım kontrolü
    const checkJoin = await client.query('SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
    if (checkJoin.rows.length > 0) throw new AppError('Bu etkinliğe zaten katıldınız.', 400);

    // Kapasite kontrolü
    const countRes = await client.query('SELECT COUNT(*) as c FROM event_participants WHERE event_id = $1', [eventId]);
    const currentCount = parseInt(countRes.rows[0].c, 10);

    if (currentCount >= event.max_participants) {
      // Zaten doluysa statüyü güncelle ve reddet
      await client.query("UPDATE events SET status = 'full' WHERE id = $1", [eventId]);
      throw new AppError('Bu etkinlik maalesef dolmuş.', 400);
    }

    // Katılımcı ekle
    await client.query('INSERT INTO event_participants (event_id, user_id) VALUES ($1, $2)', [eventId, userId]);

    if (currentCount + 1 >= event.max_participants) {
      await client.query("UPDATE events SET status = 'full' WHERE id = $1", [eventId]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Etkinliğe başarıyla katıldınız!' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// Etkinliği onayla ve KP dağıt
const approveEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id, 10);
  const creatorId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
    if (eventRes.rows.length === 0) throw new AppError('Etkinlik bulunamadı', 404);
    const event = eventRes.rows[0];

    if (event.creator_id !== creatorId) throw new AppError('Bu işlemi sadece etkinlik sahibi yapabilir.', 403);
    if (event.status === 'completed' || event.status === 'cancelled') throw new AppError('Bu etkinlik zaten sonlandırılmış.', 400);

    // Katılımcıları al
    const partsRes = await client.query('SELECT user_id FROM event_participants WHERE event_id = $1', [eventId]);
    const participants = partsRes.rows;

    const reward = event.reward_per_participant;
    let distributedAmount = 0;

    for (const p of participants) {
      const wRes = await client.query('SELECT id FROM wallets WHERE user_id = $1', [p.user_id]);
      if (wRes.rows.length > 0) {
        const wId = wRes.rows[0].id;
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [reward, wId]);
        await client.query(
          "INSERT INTO transactions (wallet_id, amount, type, description) VALUES ($1, $2, 'earn', $3)",
          [wId, reward, `Etkinlik ödülü: ${event.title}`]
        );
        distributedAmount += reward;
      }
    }

    // İade (Refund) işlemi
    const remaining = event.total_locked_amount - distributedAmount;
    if (remaining > 0) {
      const cWRes = await client.query('SELECT id FROM wallets WHERE user_id = $1', [creatorId]);
      if (cWRes.rows.length > 0) {
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [remaining, cWRes.rows[0].id]);
        await client.query(
          "INSERT INTO transactions (wallet_id, amount, type, description) VALUES ($1, $2, 'refund', $3)",
          [cWRes.rows[0].id, remaining, `Etkinlik iadesi (kalan bütçe): ${event.title}`]
        );
      }
    }

    await client.query("UPDATE events SET status = 'completed' WHERE id = $1", [eventId]);

    await client.query('COMMIT');
    res.json({ success: true, message: `Etkinlik tamamlandı! ${participants.length} kişiye toplam ${distributedAmount} KP dağıtıldı.` });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const getMyPendingEvents = async (req, res, next) => {
  try {
    const query = `
      SELECT e.*, 
      (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as current_participants
      FROM events e
      WHERE e.creator_id = $1 AND e.status IN ('open', 'full')
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json({ success: true, events: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEvents,
  createEvent,
  joinEvent,
  approveEvent,
  getMyPendingEvents
};
