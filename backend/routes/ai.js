const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chat, analytics, predictions } = require('../controllers/aiController');

router.post('/chat', protect, chat);
router.get('/analytics', protect, analytics);
router.get('/predictions', protect, predictions);

module.exports = router;
