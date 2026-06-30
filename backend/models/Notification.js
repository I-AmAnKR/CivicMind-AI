const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['new_issue', 'issue_resolved', 'issue_verified', 'reward_earned', 'system', 'authority_action'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }, // extra payload
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
