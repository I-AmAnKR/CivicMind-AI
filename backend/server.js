const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
require('express-async-errors');

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'CivicMind AI Backend is running 🚀', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('join-area', ({ lat, lng }) => {
    const areaRoom = `area-${Math.round(lat * 100)}-${Math.round(lng * 100)}`;
    socket.join(areaRoom);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to controllers
app.set('io', io);

// Serve frontend in production (must be after API routes but before 404 handler)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('*', (req, res) => {
    // If route starts with /api or /uploads, it shouldn't hit this, return next to fall through to 404 handler
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return res.status(404).json({ success: false, message: 'API Route not found' });
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 CivicMind AI Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`🌐 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});

module.exports = { app, io };
