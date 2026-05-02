const express               = require('express');
const { body }              = require('express-validator');
const { register, login }   = require('./auth.controller');
const { validateEduMail }   = require('../../middleware/eduMailValidator');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  validateEduMail,
  [
    body('full_name').trim().notEmpty().withMessage('Ad Soyad zorunludur.'),
    body('email').isEmail().withMessage('Geçerli bir e-posta girin.'),
    body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır.'),
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  validateEduMail,
  [
    body('email').isEmail().withMessage('Geçerli bir e-posta girin.'),
    body('password').notEmpty().withMessage('Şifre zorunludur.'),
  ],
  login
);

module.exports = router;
