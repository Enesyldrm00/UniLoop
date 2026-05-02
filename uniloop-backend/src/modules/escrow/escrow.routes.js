const express   = require('express');
const { protect } = require('../../middleware/auth');
const { approveEscrow, disputeEscrow } = require('./escrow.controller');

const router = express.Router();

router.use(protect);

// POST /api/escrow/:id/approve — Onay ver (alıcı veya satıcı)
router.post('/:id/approve', approveEscrow);

// POST /api/escrow/:id/dispute — Anlaşmazlık bildir
router.post('/:id/dispute', disputeEscrow);

module.exports = router;
