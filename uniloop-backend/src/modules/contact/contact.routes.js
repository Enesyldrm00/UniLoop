const express   = require('express');
const { protect } = require('../../middleware/auth');
const {
  getMyContact,
  getPublicContact,
  updateMyContact,
} = require('./contact.controller');

const router = express.Router();

router.use(protect);

// GET /api/contact/me — Kendi iletişim bilgilerini gör
router.get('/me', getMyContact);

// GET /api/contact/:userId — Bir kullanıcının herkese açık iletişim bilgileri
router.get('/:userId', getPublicContact);

// PUT /api/contact/me — İletişim bilgilerini güncelle
router.put('/me', updateMyContact);

module.exports = router;
