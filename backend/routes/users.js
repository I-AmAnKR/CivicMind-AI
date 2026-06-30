const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getLeaderboard, getRecommendations, checkBadges } = require('../controllers/userController');

router.get('/leaderboard', protect, getLeaderboard);
router.get('/recommendations', protect, getRecommendations);
router.post('/:id/check-badges', protect, checkBadges);

module.exports = router;
