const jwt      = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const pool     = require('../config/db');

const protect = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.', 401));
    }

    const token = authHeader.split(' ')[1];

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcının hâlâ var olup olmadığını kontrol et
    const result = await pool.query(
      'SELECT id, email, full_name, is_edu_verified FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Bu token\'a ait kullanıcı artık mevcut değil.', 401));
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Geçersiz token.', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token süresi dolmuş. Lütfen tekrar giriş yapın.', 401));
    }
    next(err);
  }
};

module.exports = { protect };
