const User = require('../models/User');
const Reward = require('../models/Reward');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role, department, firebaseUid, phone, city, age } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'citizen',
    department,
    firebaseUid,
    phone,
    city,
    age,
  });

  // Create reward entry
  await Reward.create({ userId: user._id, totalPoints: 50, history: [{ action: 'signup', points: 50, description: 'Welcome bonus!' }] });
  user.points = 50;
  await user.save();

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points },
    token: generateToken(user._id),
  });
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  if (password && user.password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, badges: user.badges },
    token: generateToken(user._id),
  });
};

// @desc    Firebase login/register
// @route   POST /api/auth/firebase
const firebaseAuth = async (req, res) => {
  const { firebaseUid, email, name, role } = req.body;

  let user = await User.findOne({ firebaseUid });
  if (!user) user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ firebaseUid, email, name, role: role || 'citizen' });
    await Reward.create({ userId: user._id, totalPoints: 50, history: [{ action: 'signup', points: 50, description: 'Welcome bonus!' }] });
    user.points = 50;
    await user.save();
  } else if (!user.firebaseUid) {
    user.firebaseUid = firebaseUid;
    await user.save();
  }

  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points },
    token: generateToken(user._id),
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  const reward = await Reward.findOne({ userId: req.user._id });
  res.json({ success: true, user, reward });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const { name, phone, city, age, bio } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name: name.trim(), phone, city, age, bio } },
    { new: true }
  ).select('-password');
  res.json({ success: true, user });
};

module.exports = { register, login, firebaseAuth, getMe, updateProfile };
