const express   = require('express');
const { protect } = require('../../middleware/auth');
const {
  getTasks,
  createTask,
  assignTask,
  createReview,
} = require('./task.controller');
const upload = require('../../middleware/upload');

const router = express.Router();

// GET /api/tasks — Lokasyon ve tür filtresiyle listele (herkese açık)
router.get('/', getTasks);

// JWT koruması gerektiren rotalar
router.use(protect);

// POST /api/tasks — Yeni ilan aç
router.post('/', upload.single('image'), createTask);

// PATCH /api/tasks/:id/assign — Görevi üstlen (escrow kilitler)
router.patch('/:id/assign', assignTask);

// POST /api/tasks/reviews — Görev tamamlanınca puan ver
router.post('/reviews', createReview);

module.exports = router;
