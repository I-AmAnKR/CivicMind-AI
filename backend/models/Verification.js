const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vote: { type: String, enum: ['confirm', 'dispute'], required: true },
  comment: { type: String, trim: true },
  image: { type: String }, // optional supporting image
}, { timestamps: true });

verificationSchema.index({ issueId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Verification', verificationSchema);
