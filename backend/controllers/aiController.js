const { chatWithCivicAI } = require('../ai/chatAgent');
const { generateAnalytics } = require('../ai/analyticsAgent');
const { generatePredictions } = require('../ai/predictiveAgent');

// @desc    Chat with AI
// @route   POST /api/ai/chat
const chat = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
  try {
    const result = await chatWithCivicAI(message, req.user._id);
    // Always return 200 — frontend reads .message regardless of success flag
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: "I'm having trouble connecting. Please check back in a moment! 🔧" });
  }
};

// @desc    Get AI analytics (base stats — used by Authority Dashboard)
// @route   GET /api/ai/analytics
const analytics = async (req, res) => {
  const result = await generateAnalytics();
  res.json(result);
};

// @desc    Get AI predictive hotspot analysis (Gemini-powered)
// @route   GET /api/ai/predictions
const predictions = async (req, res) => {
  try {
    // First get the analytics data
    const analyticsResult = await generateAnalytics();
    if (!analyticsResult.success) {
      return res.status(500).json({ success: false, message: 'Analytics data generation failed' });
    }

    // Then feed it to Gemini for predictive insights
    const predictResult = await generatePredictions(analyticsResult.analytics);

    res.json({
      success: true,
      analytics: analyticsResult.analytics,   // raw data for charts
      predictions: predictResult.predictions,  // Gemini predictions
      aiAvailable: predictResult.success,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { chat, analytics, predictions };
