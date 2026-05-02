const express              = require('express');
const { protect }          = require('../../middleware/auth');
const {
  getProfile,
  updateMyProfile,
  addAchievement,
  getUserReviews,
  getUserTasks,
} = require('./profile.controller');

const router = express.Router();

// GET /api/profile/:userId — Herkese açık profil
router.get('/:userId', getProfile);

// GET /api/profile/:userId/reviews — Kullanıcıya yapılan değerlendirmeler
router.get('/:userId/reviews', getUserReviews);

// GET /api/profile/:userId/tasks — Kullanıcının aktif ilanları
router.get('/:userId/tasks', getUserTasks);

// Aşağıdaki rotalar JWT koruması gerektirir
router.use(protect);

// PUT /api/profile/me — GPA, bölüm, bio güncelle
router.put('/me', updateMyProfile);

// POST /api/profile/me/achievements — Başarı ekle
router.post('/me/achievements', addAchievement);

module.exports = router;
