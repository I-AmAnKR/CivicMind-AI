const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Road Damage', 'Streetlight', 'Garbage', 'Water Supply', 'Sewage', 'Park', 'Building', 'Traffic', 'Other'],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  priorityScore: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected', 'Needs Further Action'],
    default: 'Pending'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
    area: { type: String }
  },
  images: [{ type: String }],
  beforeImage: { type: String },
  afterImage: { type: String },
  assignedDept: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ✅ SUPPORTER SYSTEM — citizens who confirmed they see the same issue
  supporters: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
    confidence: { type: String }, // AI confidence when they were added
    reason: { type: String },     // AI reason for match
  }],

  aiAnalysis: {
    category: String,
    severity: String,
    risk: String,
    confidence: String,
    description: String,
    department: String,
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }
  },
  resolutionVerification: {
    verdict:       { type: String, enum: ['Resolved', 'Partial Fix', 'Not Resolved', 'Pending'] },
    confidence:    { type: Number },          // 0-100
    summary:       String,                    // AI summary
    improvements:  [String],
    concerns:      [String],
    isFakePhoto:   { type: Boolean, default: false },
    inspectorNote: String,
    verifiedAt:    Date,
  },
  // Community votes when AI says "Not Resolved" — citizens confirm or deny
  communityConfirms: [{
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote:      { type: String, enum: ['yes', 'no'] }, // yes = fixed, no = not fixed
    votedAt:   { type: Date, default: Date.now },
  }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verificationCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  resolvedAt: { type: Date },
  tags: [String],
}, { timestamps: true });

// Virtual: total reach = upvotes + supporters + verifications
issueSchema.virtual('totalReach').get(function() {
  return (this.upvotes?.length || 0) + (this.supporters?.length || 0) + (this.verificationCount || 0);
});

// Index for geo-queries
issueSchema.index({ 'location.lat': 1, 'location.lng': 1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
