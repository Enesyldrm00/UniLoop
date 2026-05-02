const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── GET /api/escrow/pending ─────────────────────────────────
// Giriş yapan kullanıcının dahil olduğu, henüz tamamlanmamış escrow'ları getirir.
const getPendingEscrows = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT
         e.id, e.task_id, e.amount, e.status,
         e.buyer_id, e.seller_id,
         e.buyer_approved, e.seller_approved,
         e.locked_at,
         t.title    AS task_title,
         t.task_type,
         bu.full_name AS buyer_name,
         su.full_name AS seller_name
       FROM escrows e
       JOIN tasks t  ON t.id  = e.task_id
       JOIN users bu ON bu.id = e.buyer_id
       JOIN users su ON su.id = e.seller_id
       WHERE (e.buyer_id = $1 OR e.seller_id = $1)
         AND e.status NOT IN ('released', 'refunded')
       ORDER BY e.locked_at DESC`,
      [userId]
    );
    res.json({ success: true, escrows: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/escrow/:id/approve ───────────────────────────
// Alıcı veya satıcı token'ına göre ilgili onayı verir.
// Her iki taraf da onayladığında para otomatik serbest bırakılır.
const approveEscrow = async (req, res, next) => {
  const escrowId = parseInt(req.params.id, 10);
  const userId = parseInt(req.user.id, 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Escrow'u kilitle
    const escrowResult = await client.query(
      'SELECT * FROM escrows WHERE id = $1 FOR UPDATE',
      [escrowId]
    );

    if (escrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Escrow kaydı bulunamadı.', 404));
    }

    const escrow = escrowResult.rows[0];
    // DB'den gelen ID'ler string olabilir — tip güvenli karşılaştırma
    const buyerId = parseInt(escrow.buyer_id, 10);
    const sellerId = parseInt(escrow.seller_id, 10);

    if (!['locked', 'buyer_approved', 'seller_approved'].includes(escrow.status)) {
      await client.query('ROLLBACK');
      return next(new AppError(`Bu escrow zaten ${escrow.status} durumunda.`, 400));
    }

    // Kim onaylıyor?
    let updateField;
    let newStatus;

    if (userId === buyerId) {
      if (escrow.buyer_approved) {
        await client.query('ROLLBACK');
        return next(new AppError('Siz zaten onayladınız.', 400));
      }
      updateField = 'buyer_approved = TRUE';
      newStatus = escrow.seller_approved ? 'released' : 'buyer_approved';
    } else if (userId === sellerId) {
      if (escrow.seller_approved) {
        await client.query('ROLLBACK');
        return next(new AppError('Siz zaten onayladınız.', 400));
      }
      updateField = 'seller_approved = TRUE';
      newStatus = escrow.buyer_approved ? 'released' : 'seller_approved';
    } else {
      await client.query('ROLLBACK');
      return next(new AppError('Bu işlem için yetkiniz yok.', 403));
    }

    // Escrow güncelle — $1'i açıkça cast ediyoruz (ENUM tip uyuşmazlığını önlemek için)
    const releasedAt = newStatus === 'released' ? 'NOW()' : 'NULL';
    await client.query(
      `UPDATE escrows
       SET ${updateField}, status = $1::escrow_status, released_at = ${releasedAt}
       WHERE id = $2`,
      [newStatus, escrowId]
    );

    // Her iki taraf da onayladıysa: buyer'dan KP düş → seller'a aktar
    if (newStatus === 'released') {
      // ── Buyer cüzdanı (KP bu an düşülüyor) ──
      const buyerWallet = await client.query(
        'SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [escrow.buyer_id]
      );

      if (buyerWallet.rows.length === 0) {
        await client.query('ROLLBACK');
        return next(new AppError('Ödeme yapacak kişinin cüzdanı bulunamadı.', 404));
      }

      const bWallet = buyerWallet.rows[0];
      if (bWallet.balance < escrow.amount) {
        await client.query('ROLLBACK');
        return next(new AppError(
          `Ödeme yapacak kişinin bakiyesi yetersiz. Gerekli: ${escrow.amount} KP, Mevcut: ${bWallet.balance} KP`,
          400
        ));
      }

      // Buyer'dan düş
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
        [escrow.amount, bWallet.id]
      );

      // Buyer işlem kaydı
      await client.query(
        `INSERT INTO transactions (wallet_id, amount, type, description, related_task_id)
         VALUES ($1, $2, 'escrow_release', 'Görev onaylandı — ödeme yapıldı.', $3)`,
        [bWallet.id, -escrow.amount, escrow.task_id]
      );

      // ── Seller cüzdanı (KP ekleniyor) ──
      const sellerWallet = await client.query(
        'SELECT id FROM wallets WHERE user_id = $1',
        [escrow.seller_id]
      );

      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [escrow.amount, sellerWallet.rows[0].id]
      );

      // Seller işlem kaydı
      await client.query(
        `INSERT INTO transactions (wallet_id, amount, type, description, related_task_id)
         VALUES ($1, $2, 'escrow_release', 'Görev onaylandı — ödeme alındı.', $3)`,
        [sellerWallet.rows[0].id, escrow.amount, escrow.task_id]
      );

      // Görev tamamlandı
      await client.query(
        "UPDATE tasks SET status = 'completed' WHERE id = $1",
        [escrow.task_id]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: `Her iki taraf onayladı. ${escrow.amount} KP satıcıya aktarıldı.`,
        status: 'released',
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Onayınız alındı. Diğer tarafın onayı bekleniyor.',
      status: newStatus,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── POST /api/escrow/:id/dispute ───────────────────────────
const disputeEscrow = async (req, res, next) => {
  const escrowId = parseInt(req.params.id, 10);
  const userId = parseInt(req.user.id, 10);

  try {
    const escrowResult = await pool.query(
      'SELECT * FROM escrows WHERE id = $1',
      [escrowId]
    );

    if (escrowResult.rows.length === 0) {
      return next(new AppError('Escrow kaydı bulunamadı.', 404));
    }

    const escrow = escrowResult.rows[0];

    if (userId !== parseInt(escrow.buyer_id, 10) && userId !== parseInt(escrow.seller_id, 10)) {
      return next(new AppError('Bu işlem için yetkiniz yok.', 403));
    }

    if (escrow.status === 'released' || escrow.status === 'refunded') {
      return next(new AppError('Tamamlanmış bir işlem için anlaşmazlık bildirilemez.', 400));
    }

    // Görev ve escrow'u disputed durumuna al
    await pool.query(
      "UPDATE tasks SET status = 'disputed' WHERE id = $1",
      [escrow.task_id]
    );

    res.json({
      success: true,
      message: 'Anlaşmazlık bildirildi. Moderatör incelemesi başlatıldı.',
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/escrow/review-pending ────────────────────────────
// Giriş yapan kullanıcının puan vermesi gereken tamamlanmış işlemleri döndürür.
// Kural:
//   skill_exchange  → reviewer = buyer (taker, ödeyen)
//   courier_request → reviewer = buyer (creator, talep eden)
//   courier_offer   → reviewer = seller (creator, kurye)
const getReviewPending = async (req, res, next) => {
  const userId = parseInt(req.user.id, 10);
  try {
    const result = await pool.query(
      `SELECT
         e.id          AS escrow_id,
         e.task_id,
         e.amount,
         e.buyer_id,
         e.seller_id,
         t.task_type,
         t.title       AS task_title,
         CASE
           WHEN t.task_type = 'courier_offer' THEN e.buyer_id
           ELSE e.seller_id
         END           AS reviewee_id,
         CASE
           WHEN t.task_type = 'courier_offer' THEN bu.full_name
           ELSE su.full_name
         END           AS reviewee_name
       FROM escrows e
       JOIN tasks t  ON t.id  = e.task_id
       JOIN users bu ON bu.id = e.buyer_id
       JOIN users su ON su.id = e.seller_id
       WHERE e.status = 'released'
         AND (
           (t.task_type != 'courier_offer' AND e.buyer_id  = $1) OR
           (t.task_type = 'courier_offer'  AND e.seller_id = $1)
         )
         AND NOT EXISTS (
           SELECT 1 FROM reviews r
           WHERE r.task_id = e.task_id AND r.reviewer_id = $1
         )
       ORDER BY e.released_at DESC`,
      [userId]
    );
    res.json({ success: true, reviews: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPendingEscrows, approveEscrow, disputeEscrow, getReviewPending };
