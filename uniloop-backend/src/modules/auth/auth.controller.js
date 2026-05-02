const bcrypt            = require('bcryptjs');
const jwt               = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool              = require('../../config/db');
const AppError          = require('../../utils/AppError');

// ── Yardımcı: JWT üret ─────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/register ────────────────────────────────
const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, full_name } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // E-posta benzersizlik kontrolü
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Bu e-posta adresi zaten kayıtlı.', 409));
    }

    // Şifre hash
    const password_hash = await bcrypt.hash(password, 10);

    // Kullanıcı oluştur
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, is_edu_verified)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, email, full_name, is_edu_verified, created_at`,
      [email.toLowerCase(), password_hash, full_name]
    );
    const user = userResult.rows[0];

    // Cüzdan oluştur (otomatik)
    await client.query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, 0)',
      [user.id]
    );

    // Boş profil oluştur
    await client.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)',
      [user.id]
    );

    // Boş iletişim kaydı oluştur
    await client.query(
      'INSERT INTO user_contacts (user_id) VALUES ($1)',
      [user.id]
    );

    await client.query('COMMIT');

    const token = signToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı. Hoş geldiniz!',
      token,
      user,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── POST /api/auth/login ───────────────────────────────────
const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, email, full_name, password_hash, is_edu_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return next(new AppError('E-posta veya şifre hatalı.', 401));
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return next(new AppError('E-posta veya şifre hatalı.', 401));
    }

    const token = signToken(user.id);

    res.json({
      success: true,
      message: 'Giriş başarılı.',
      token,
      user: {
        id:               user.id,
        email:            user.email,
        full_name:        user.full_name,
        is_edu_verified:  user.is_edu_verified,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
