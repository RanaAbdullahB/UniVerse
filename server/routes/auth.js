const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // built-in Node.js, no install needed
const nodemailer = require('nodemailer');
const User = require('../models/User');
const emailDomainMiddleware = require('../middleware/emailDomainMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Email sender helper ───────────────────────────────────────────────────
const sendResetEmail = async (toEmail, resetURL, userName) => {
  // If no email config in .env, just log to console (great for development)
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
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // use an App Password for Gmail
    },
  });

  await transporter.sendMail({
    from: `"UniVerse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request — UniVerse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="font-size: 1.6rem; color: #010818; margin: 0;">🎓 UniVerse</h1>
          <p style="color: #6c757d; margin: 4px 0 0;">Student Gateway</p>
        </div>
        <div style="background: #fff; border-radius: 10px; padding: 28px; border: 1px solid #dee2e6;">
          <h2 style="color: #010818; font-size: 1.2rem; margin: 0 0 12px;">Hi ${userName},</h2>
          <p style="color: #333; line-height: 1.6; margin: 0 0 20px;">
            We received a request to reset your password. Click the button below to choose a new password.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetURL}" style="background: rgb(13,110,253); color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="color: #6c757d; font-size: 0.82rem; margin: 0; border-top: 1px solid #dee2e6; padding-top: 16px;">
            ⏱ This link expires in <strong>15 minutes</strong>.<br/>
            If you did not request a password reset, please ignore this email.
          </p>
        </div>
        <p style="color: #adb5bd; font-size: 0.75rem; text-align: center; margin-top: 20px;">
          If the button doesn't work, copy this link:<br/>
          <span style="color: #0d6efd;">${resetURL}</span>
        </p>
      </div>
    `,
  });
};

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
// Rules: students must use @lgu.edu.pk — admins can use any email
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

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    // Find user first so we can check their role
    const user = await User.findOne({ universityEmail: emailLower }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // If user is a student, enforce @lgu.edu.pk domain
    if (user.role === 'student') {
      const domain = process.env.UNIVERSITY_EMAIL_DOMAIN || '@cs.lgu.edu.pk';
      if (!emailLower.endsWith(`@${domain}`)) {
        return res.status(401).json({
          success: false,
          message: `Students must log in with their LGU email (@${domain})`,
        });
      }
    }
    // Admins can log in with any email — no domain restriction

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

// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { universityEmail } = req.body;

    if (!universityEmail) {
      return res.status(400).json({ success: false, message: 'Please provide your university email' });
    }

    const user = await User.findOne({ universityEmail: universityEmail.toLowerCase() });

    // Always return success even if email not found (security best practice)
    // This prevents attackers from knowing which emails are registered
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate a random reset token (plain version sent in email)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing in DB (so DB leak doesn't expose tokens)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token + expiry (15 minutes) to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Build the reset URL pointing to the frontend
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetURL = `${clientURL}/reset-password/${resetToken}`;

    try {
      await sendResetEmail(user.universityEmail, resetURL, user.name);
      res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    } catch (emailError) {
      // If email fails, clear the token so user can try again
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send error:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password/:token
// @access  Public
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

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // token must not be expired
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Set new password (pre-save hook will hash it automatically)
    user.password = newPassword;
    user.resetPasswordToken = undefined; // clear the token
    user.resetPasswordExpire = undefined; // clear the expiry
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/verify-reset-token/:token
// @access  Public — lets frontend check if token is still valid before showing form
router.get('/verify-reset-token/:token', async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

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