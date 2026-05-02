const express   = require('express');
const { protect } = require('../../middleware/auth');
const { getPendingEscrows, approveEscrow, disputeEscrow, getReviewPending } = require('./escrow.controller');

const router = express.Router();

router.use(protect);

// GET /api/escrow/pending — Bekleyen (onay gerektiren) escrow'ları listele
router.get('/pending', getPendingEscrows);

// GET /api/escrow/review-pending — Puan verilmesi gereken tamamlanmış işlemler
router.get('/review-pending', getReviewPending);

// POST /api/escrow/:id/approve — Onay ver (alıcı veya satıcı)
router.post('/:id/approve', approveEscrow);

// POST /api/escrow/:id/dispute — Anlaşmazlık bildir
router.post('/:id/dispute', disputeEscrow);

module.exports = router;
