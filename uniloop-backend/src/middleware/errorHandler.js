const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';

  // PostgreSQL hata kodları
  if (err.code === '23505') {
    statusCode = 409;
    message    = 'Bu kayıt zaten mevcut. (Benzersiz kısıt ihlali)';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message    = 'Geçersiz referans. İlgili kayıt bulunamadı.';
  }

  if (err.code === '23514') {
    statusCode = 400;
    message    = 'Geçersiz değer. Veri kısıtı ihlali (CHECK constraint).';
  }

  // Geliştirme ortamında tam stack trace
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
