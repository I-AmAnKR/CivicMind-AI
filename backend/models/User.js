const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String }, // for non-firebase auth
  role: { type: String, enum: ['citizen', 'authority', 'admin'], default: 'citizen' },
  department: { type: String }, // for authority users
  avatar: { type: String, default: '' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  points: { type: Number, default: 0 },
  badges: [{ 
    name: String, 
    icon: String, 
    earnedAt: { type: Date, default: Date.now } 
  }],
  reportsCount: { type: Number, default: 0 },
  verificationsCount: { type: Number, default: 0 },
  resolvedCount: { type: Number, default: 0 },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
  age: { type: Number },
  bio: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
