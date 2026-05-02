const express   = require('express');
const { protect } = require('../../middleware/auth');
const { getPools, createPool, joinPool } = require('./pool.controller');

const router = express.Router();

// GET /api/pools — Herkese açık
router.get('/', getPools);

router.use(protect);

// POST /api/pools — Yeni havuz oluştur
router.post('/', createPool);

// POST /api/pools/:id/join — Havuza katıl (ACID)
router.post('/:id/join', joinPool);

module.exports = router;
