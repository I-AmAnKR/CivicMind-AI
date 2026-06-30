const User = require('../models/User');
const Issue = require('../models/Issue');
const { awardBadges, getCurrentChallenge, getAllBadges } = require('../ai/badgeEngine');
const { generateRecommendations } = require('../ai/recommendationAgent');

// @desc    Get leaderboard data
// @route   GET /api/users/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const leaders = await User.find({ role: 'citizen', isActive: true })
      .sort({ points: -1 })
      .limit(50)
      .select('name points badges reportsCount verificationsCount resolvedCount createdAt');

    const challenge = getCurrentChallenge();
    const allBadges = getAllBadges();

    res.json({ success: true, leaders, challenge, allBadges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get AI action recommendations
// @route   GET /api/users/recommendations
const getRecommendations = async (req, res) => {
  try {
    const result = await generateRecommendations();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Award badges for a user (called internally after actions)
// @route   POST /api/users/:id/check-badges (internal use)
const checkBadges = async (req, res) => {
  try {
    const newBadges = await awardBadges(req.params.id);
    res.json({ success: true, newBadges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLeaderboard, getRecommendations, checkBadges };
