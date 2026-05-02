const express               = require('express');
const { protect }           = require('../../middleware/auth');
const { getMyWallet, topup } = require('./wallet.controller');

const router = express.Router();

// Tüm wallet rotaları JWT koruması gerektirir
router.use(protect);

// GET /api/wallet/me — Bakiye + işlem geçmişi
router.get('/me', getMyWallet);

// POST /api/wallet/topup — TL → K-Kredi yükleme
router.post('/topup', topup);

module.exports = router;
