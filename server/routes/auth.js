const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailDomainMiddleware = require('../middleware/emailDomainMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @access  Public
router.post('/register', emailDomainMiddleware, async (req, res, next) => {
  try {
    const { name, universityEmail, password, studentId, department, year } = req.body;

    if (!name || !universityEmail || !password || !studentId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, universityEmail, password, studentId, department',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ universityEmail: universityEmail.toLowerCase() }, { studentId }],
    });

    if (existingUser) {
      const field = existingUser.universityEmail === universityEmail.toLowerCase() ? 'email' : 'student ID';
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    const user = await User.create({
      name,
      universityEmail: universityEmail.toLowerCase(),
      password,
      studentId,
      department,
      year: year || 1,
      role: 'student',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        universityEmail: user.universityEmail,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        role: user.role,
        profilePhoto: user.profilePhoto,
        joinedClubs: user.joinedClubs,
        joinedStudyGroups: user.joinedStudyGroups,
        registeredEvents: user.registeredEvents,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @access  Public
router.post('/login', emailDomainMiddleware, async (req, res, next) => {
  try {
    const { universityEmail, password } = req.body;

    if (!universityEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ universityEmail: universityEmail.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        universityEmail: user.universityEmail,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        role: user.role,
        profilePhoto: user.profilePhoto,
        joinedClubs: user.joinedClubs,
        joinedStudyGroups: user.joinedStudyGroups,
        registeredEvents: user.registeredEvents,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('joinedClubs', 'name category coverImage')
      .populate('joinedStudyGroups', 'name subject course')
      .populate('registeredEvents', 'title date venue');

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/update-profile
// @access  Private
router.put('/update-profile', authMiddleware, async (req, res, next) => {
  try {
    const { name, department, year, profilePhoto } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, department, year, profilePhoto },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
