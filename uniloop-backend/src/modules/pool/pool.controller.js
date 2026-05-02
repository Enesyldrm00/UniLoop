const pool            = require('../../config/db');
const AppError        = require('../../utils/AppError');
const triggerService  = require('../trigger/trigger.service');

// ── GET /api/pools ─────────────────────────────────────────
const getPools = async (req, res, next) => {
  const { location, status = 'open' } = req.query;

  try {
    let query = `
      SELECT
        p.*, u.full_name AS creator_name,
        (p.total_cost / p.max_capacity) AS cost_per_person,
        ROUND((p.current_capacity::NUMERIC / p.max_capacity) * 100) AS fill_percentage
      FROM pools p
      JOIN users u ON u.id = p.creator_id
      WHERE p.status = $1
    `;
    const params = [status];

    if (location) {
      params.push(location);
      query += ` AND p.location = $${params.length}`;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, pools: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/pools ────────────────────────────────────────
const createPool = async (req, res, next) => {
  const { title, description, location, max_capacity, total_cost } = req.body;

  if (!title || !max_capacity || !total_cost) {
    return next(new AppError('Başlık, maksimum kapasite ve toplam maliyet zorunludur.', 400));
  }

  if (total_cost % max_capacity !== 0) {
    return next(new AppError('Toplam maliyet, kapasiteye tam bölünebilmeli (eşit paylaşım).', 400));
  }

  try {
    const result = await pool.query(
      `INSERT INTO pools (creator_id, title, description, location, max_capacity, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title, description || null, location || null,
       parseInt(max_capacity, 10), parseInt(total_cost, 10)]
    );

    res.status(201).json({ success: true, pool: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/pools/:id/join ───────────────────────────────
// ACID Transaction: Race-condition korumalı havuza katılım
const joinPool = async (req, res, next) => {
  const poolId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Havuzu kilitle (FOR UPDATE — race condition engeli)
    const poolResult = await client.query(
      'SELECT * FROM pools WHERE id = $1 FOR UPDATE',
      [poolId]
    );

    if (poolResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Havuz bulunamadı.', 404));
    }

    const currentPool = poolResult.rows[0];

    if (currentPool.status !== 'open') {
      await client.query('ROLLBACK');
      return next(new AppError('Bu havuz artık açık değil.', 400));
    }

    if (currentPool.current_capacity >= currentPool.max_capacity) {
      await client.query('ROLLBACK');
      return next(new AppError('Havuz kapasitesi dolmuş.', 400));
    }

    // Zaten üye mi?
    const memberCheck = await client.query(
      'SELECT 1 FROM pool_members WHERE pool_id = $1 AND user_id = $2',
      [poolId, userId]
    );

    if (memberCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Bu havuza zaten katıldınız.', 409));
    }

    // Kişi başı ücret
    const paidAmount = Math.floor(currentPool.total_cost / currentPool.max_capacity);

    // Kullanıcının cüzdanını kilitle
    const walletResult = await client.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    if (walletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Cüzdan bulunamadı.', 404));
    }

    const wallet = walletResult.rows[0];

    if (wallet.balance < paidAmount) {
      await client.query('ROLLBACK');
      return next(new AppError(
        `Yetersiz bakiye. Gerekli: ${paidAmount} K-Kredi, Mevcut: ${wallet.balance} K-Kredi.`,
        400
      ));
    }

    // Cüzdandan düş
    await client.query(
      'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
      [paidAmount, wallet.id]
    );

    // Havuz üyesi ekle
    await client.query(
      'INSERT INTO pool_members (pool_id, user_id, paid_amount) VALUES ($1, $2, $3)',
      [poolId, userId, paidAmount]
    );

    // Havuz kapasitesini artır
    const updatedPool = await client.query(
      `UPDATE pools
       SET current_capacity = current_capacity + 1
       WHERE id = $1
       RETURNING *`,
      [poolId]
    );

    // İşlem kaydı
    await client.query(
      `INSERT INTO transactions (wallet_id, amount, type, description)
       VALUES ($1, $2, 'spend', $3)`,
      [wallet.id, -paidAmount, `"${currentPool.title}" havuzuna katılım`]
    );

    const poolAfter = updatedPool.rows[0];

    // ── HAVUZ DOLDU MU? → Otomatik kurye ilanı aç ──────────
    if (poolAfter.current_capacity === poolAfter.max_capacity) {
      await triggerService.createCourierTask(client, poolAfter);
      await client.query(
        "UPDATE pools SET status = 'full' WHERE id = $1",
        [poolId]
      );
    }

    await client.query('COMMIT');

    res.json({
      success:     true,
      message:     `Havuza katıldınız. ${paidAmount} K-Kredi ödendi.`,
      pool:        poolAfter,
      paid_amount: paidAmount,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getPools, createPool, joinPool };
