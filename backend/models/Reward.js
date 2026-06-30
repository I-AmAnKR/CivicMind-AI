const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
  level: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'], default: 'Bronze' },
  badges: [{
    name: { type: String },
    icon: { type: String },
    description: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],
  history: [{
    action: { type: String }, // 'report', 'verify', 'resolve'
    points: { type: Number },
    description: { type: String },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    earnedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
