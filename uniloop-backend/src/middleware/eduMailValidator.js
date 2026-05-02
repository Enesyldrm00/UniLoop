const AppError = require('../utils/AppError');

/**
 * Kayıt ve giriş sırasında e-postanın .edu.tr ile bittiğini doğrular.
 * Hem middleware olarak hem de doğrudan fonksiyon olarak kullanılabilir.
 */
const validateEduMail = (req, res, next) => {
  const email = req.body.email;

  if (!email) {
    return next(new AppError('E-posta adresi gereklidir.', 400));
  }

  if (!email.toLowerCase().endsWith('.edu.tr')) {
    return next(
      new AppError(
        'UniLoop yalnızca akademik e-posta adreslerini (.edu.tr) kabul etmektedir.',
        400
      )
    );
  }

  next();
};

module.exports = { validateEduMail };
