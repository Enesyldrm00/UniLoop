const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { protect } = require('../../middleware/auth');

router.get('/', protect, eventController.getEvents);
router.post('/', protect, eventController.createEvent);
router.get('/my-pending', protect, eventController.getMyPendingEvents);
router.post('/:id/join', protect, eventController.joinEvent);
router.post('/:id/approve', protect, eventController.approveEvent);

module.exports = router;
