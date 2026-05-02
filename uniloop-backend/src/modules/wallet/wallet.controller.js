const pool     = require('../../config/db');
const AppError = require('../../utils/AppError');

// ── GET /api/wallet/me ─────────────────────────────────────
const getMyWallet = async (req, res, next) => {
  try {
    // Bakiye
    const walletResult = await pool.query(
      'SELECT id, balance, total_topup_tl, created_at FROM wallets WHERE user_id = $1',
      [req.user.id]
    );

    if (walletResult.rows.length === 0) {
      return next(new AppError('Cüzdan bulunamadı.', 404));
    }

    // Son 20 işlem
    const txResult = await pool.query(
      `SELECT id, amount, type, description, related_task_id, created_at
       FROM transactions
       WHERE wallet_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [walletResult.rows[0].id]
    );

    res.json({
      success: true,
      wallet:       walletResult.rows[0],
      transactions: txResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/wallet/topup ─────────────────────────────────
// Mock ödeme: Gerçek ödeme sağlayıcısı entegrasyonu için bu fonksiyonu genişlet
const topup = async (req, res, next) => {
  const { amount_tl } = req.body;

  if (!amount_tl || amount_tl <= 0 || !Number.isInteger(Number(amount_tl))) {
    return next(new AppError('Geçerli bir TL miktarı girin (tam sayı, > 0).', 400));
  }

  const amount = parseInt(amount_tl, 10); // 1 TL = 1 K-Kredi
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const walletResult = await client.query(
      'SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE',
      [req.user.id]
    );

    if (walletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Cüzdan bulunamadı.', 404));
    }

    const walletId = walletResult.rows[0].id;

    // Bakiyeyi artır
    const updated = await client.query(
      `UPDATE wallets
       SET balance = balance + $1, total_topup_tl = total_topup_tl + $1
       WHERE id = $2
       RETURNING balance, total_topup_tl`,
      [amount, walletId]
    );

    // İşlem kaydı
    await client.query(
      `INSERT INTO transactions (wallet_id, amount, type, description)
       VALUES ($1, $2, 'topup', $3)`,
      [walletId, amount, `${amount} TL yükleme → ${amount} K-Kredi`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${amount} K-Kredi başarıyla yüklendi.`,
      wallet:  updated.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getMyWallet, topup };
