const pool     = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── POST /api/escrow/:id/approve ───────────────────────────
// Alıcı veya satıcı token'ına göre ilgili onayı verir.
// Her iki taraf da onayladığında para otomatik serbest bırakılır.
const approveEscrow = async (req, res, next) => {
  const escrowId = parseInt(req.params.id, 10);
  const userId   = req.user.id;
  const client   = await pool.connect();

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

    if (!['locked', 'buyer_approved', 'seller_approved'].includes(escrow.status)) {
      await client.query('ROLLBACK');
      return next(new AppError(`Bu escrow zaten ${escrow.status} durumunda.`, 400));
    }

    // Kim onaylıyor?
    let updateField;
    let newStatus;

    if (userId === escrow.buyer_id) {
      if (escrow.buyer_approved) {
        await client.query('ROLLBACK');
        return next(new AppError('Siz zaten onayladınız.', 400));
      }
      updateField = 'buyer_approved = TRUE';
      newStatus   = escrow.seller_approved ? 'released' : 'buyer_approved';
    } else if (userId === escrow.seller_id) {
      if (escrow.seller_approved) {
        await client.query('ROLLBACK');
        return next(new AppError('Siz zaten onayladınız.', 400));
      }
      updateField = 'seller_approved = TRUE';
      newStatus   = escrow.buyer_approved ? 'released' : 'seller_approved';
    } else {
      await client.query('ROLLBACK');
      return next(new AppError('Bu işlem için yetkiniz yok.', 403));
    }

    // Escrow güncelle
    await client.query(
      `UPDATE escrows
       SET ${updateField}, status = $1, released_at = CASE WHEN $1 = 'released' THEN NOW() ELSE NULL END
       WHERE id = $2`,
      [newStatus, escrowId]
    );

    // Her iki taraf da onayladıysa parayı satıcıya aktar
    if (newStatus === 'released') {
      // Satıcının cüzdanını bul
      const sellerWallet = await client.query(
        'SELECT id FROM wallets WHERE user_id = $1',
        [escrow.seller_id]
      );

      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
        [escrow.amount, sellerWallet.rows[0].id]
      );

      // Satıcı için işlem kaydı
      await client.query(
        `INSERT INTO transactions (wallet_id, amount, type, description, related_task_id)
         VALUES ($1, $2, 'escrow_release', 'Escrow''dan serbest bırakıldı.', $3)`,
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
        message: `Her iki taraf onayladı. ${escrow.amount} K-Kredi satıcıya aktarıldı.`,
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
  const userId   = req.user.id;

  try {
    const escrowResult = await pool.query(
      'SELECT * FROM escrows WHERE id = $1',
      [escrowId]
    );

    if (escrowResult.rows.length === 0) {
      return next(new AppError('Escrow kaydı bulunamadı.', 404));
    }

    const escrow = escrowResult.rows[0];

    if (userId !== escrow.buyer_id && userId !== escrow.seller_id) {
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

module.exports = { approveEscrow, disputeEscrow };
