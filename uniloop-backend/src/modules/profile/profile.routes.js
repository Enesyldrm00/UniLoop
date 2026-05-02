const express              = require('express');
const { protect }          = require('../../middleware/auth');
const {
  getProfile,
  updateMyProfile,
  addCertification,
  addAchievement,
} = require('./profile.controller');

const router = express.Router();

// GET /api/profile/:userId — Herkese açık profil
router.get('/:userId', getProfile);

// Aşağıdaki rotalar JWT koruması gerektirir
router.use(protect);

// PUT /api/profile/me — GPA, bölüm, bio güncelle
router.put('/me', updateMyProfile);

// POST /api/profile/me/certifications — Sertifika ekle
router.post('/me/certifications', addCertification);

// POST /api/profile/me/achievements — Başarı ekle
router.post('/me/achievements', addAchievement);

module.exports = router;
