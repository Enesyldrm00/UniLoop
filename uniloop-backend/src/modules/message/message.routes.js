const express   = require('express');
const { protect } = require('../../middleware/auth');
const {
  sendMessage,
  getConversation,
  getInbox,
} = require('./message.controller');

const router = express.Router();

router.use(protect);

// GET /api/messages/inbox — Gelen kutusu
router.get('/inbox', getInbox);

// GET /api/messages/:userId — Bir kullanıcıyla sohbet
router.get('/:userId', getConversation);

// POST /api/messages — Mesaj gönder
router.post('/', sendMessage);

module.exports = router;
