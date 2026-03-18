const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const emailDomainMiddleware = require('../middleware/emailDomainMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Format user object for response (never include password)
const formatUser = (user) => ({
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
});

// ── Email helper for password reset ───────────────────────────────────────
const sendResetEmail = async (toEmail, resetURL, userName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n─────────────────────────────────────────────');
    console.log('📧 PASSWORD RESET LINK (no email config found)');
    console.log(`   To: ${toEmail}`);
    console.log(`   Link: ${resetURL}`);
    console.log('─────────────────────────────────────────────\n');
    return;
  }
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"UniVerse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request — UniVerse',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px;">
        <h1 style="color:#010818;font-size:1.4rem;">🎓 UniVerse</h1>
        <div style="background:#fff;border-radius:10px;padding:28px;border:1px solid #dee2e6;margin-top:16px;">
          <h2 style="color:#010818;font-size:1.1rem;">Hi ${userName},</h2>
          <p style="color:#333;line-height:1.6;">We received a request to reset your password. Click the button below:</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetURL}" style="background:rgb(13,110,253);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset My Password
            </a>
          </div>
          <p style="color:#6c757d;font-size:0.82rem;border-top:1px solid #dee2e6;padding-top:16px;">
            ⏱ This link expires in <strong>15 minutes</strong>.<br/>
            If you did not request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  });
};

// ── REGISTER ──────────────────────────────────────────────────────────────
// emailDomainMiddleware enforces @lgu.edu.pk for all registrations
router.post('/register', emailDomainMiddleware, async (req, res, next) => {
  try {
    const { name, universityEmail, password, studentId, department, year } = req.body;

    if (!name || !universityEmail || !password || !studentId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { universityEmail: universityEmail.toLowerCase() },
        { studentId },
      ],
    });

    if (existingUser) {
      const field = existingUser.universityEmail === universityEmail.toLowerCase()
        ? 'email' : 'student ID';
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
      role: 'student', // all self-registered users are students
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────
// Students: must use @lgu.edu.pk
// Admins: can use any email — no domain restriction
router.post('/login', async (req, res, next) => {
  try {
    const { universityEmail, password } = req.body;

    if (!universityEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const emailLower = universityEmail.toLowerCase().trim();

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Find user by email
    const user = await User.findOne({ universityEmail: emailLower }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Domain check — only for students, admins bypass this
    if (user.role !== 'admin' && !emailLower.endsWith('@lgu.edu.pk')) {
      return res.status(401).json({
        success: false,
        message: 'Students must log in with their LGU email (@lgu.edu.pk)',
      });
    }

    // Verify password
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
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('joinedClubs', 'name category coverImage')
      .populate('joinedStudyGroups', 'name subject course')
      .populate('registeredEvents', 'title date venue');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────
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

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────
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

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { universityEmail } = req.body;

    if (!universityEmail) {
      return res.status(400).json({ success: false, message: 'Please provide your email' });
    }

    const user = await User.findOne({ universityEmail: universityEmail.toLowerCase() });

    // Always return same message for security
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetURL = `${clientURL}/reset-password/${resetToken}`;

    try {
      await sendResetEmail(user.universityEmail, resetURL, user.name);
      res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }
  } catch (error) {
    next(error);
  }
});

// ── RESET PASSWORD ────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide new password and confirmation' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    next(error);
  }
});

// ── VERIFY RESET TOKEN ────────────────────────────────────────────────────
router.get('/verify-reset-token/:token', async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    res.json({ success: true, message: 'Token is valid', email: user.universityEmail });
  } catch (error) {
    next(error);
  }
});

module.exports = router;