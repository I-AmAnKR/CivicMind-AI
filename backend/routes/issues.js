const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const {
  createIssue, getIssues, getIssue,
  verifyIssue, upvoteIssue, resolveIssue,
  getAuthorityIssues, communityConfirmResolution
} = require('../controllers/issueController');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    cb(null, isValid);
  },
});

router.get('/', getIssues);
router.get('/authority', protect, authorize('authority', 'admin'), getAuthorityIssues);
router.get('/:id', getIssue);
router.post('/', protect, upload.single('image'), createIssue);
router.post('/:id/verify', protect, verifyIssue);
router.post('/:id/upvote', protect, upvoteIssue);
router.put('/:id/resolve', protect, authorize('authority', 'admin'), upload.single('image'), resolveIssue);

// 🆕 Community confirmation vote for disputed resolutions
router.post('/:id/community-confirm', protect, communityConfirmResolution);

module.exports = router;
