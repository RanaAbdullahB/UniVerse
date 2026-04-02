// server/routes/upload.js
// Handles local profile photo uploads using multer
//
// SETUP — run in /server:
//   npm install multer
//
// Register in server/index.js:
//   app.use('/api/upload', require('./routes/upload'));
//   app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//   (also add: const path = require('path'); at the top of index.js if not already there)

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const router   = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const User     = require('../models/User');

// ── Ensure uploads directory exists ──────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Multer storage config ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${req.user._id || req.user.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and WebP images are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB max
});

// ── POST /api/upload/avatar ───────────────────────────────────
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Build the public URL for the uploaded file
    const photoUrl = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar file if it exists and is a local file
    const user = await User.findById(req.user._id || req.user.id);
    if (user?.profilePhoto && user.profilePhoto.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Save new photo URL to user record
    const updated = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      { profilePhoto: photoUrl },
      { new: true, select: '-password' }
    );

    res.json({ success: true, photoUrl, user: updated });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/upload/avatar ─────────────────────────────────
router.delete('/avatar', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (user?.profilePhoto && user.profilePhoto.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', user.profilePhoto);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      { profilePhoto: null },
      { new: true, select: '-password' }
    );

    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;