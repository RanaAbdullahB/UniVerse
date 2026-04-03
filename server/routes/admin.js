const Announcement = require('../models/Announcement');
const ActivityLog  = require('../models/ActivityLog');
const nodemailer   = require('nodemailer');
const express = require('express');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const StudyGroup = require('../models/StudyGroup');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// @route   GET /api/admin/stats
// @desc    Dashboard overview stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalClubs, totalEvents, totalGroups] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Club.countDocuments({ isActive: true }),
      Event.countDocuments(),
      StudyGroup.countDocuments(),
    ]);

    const upcomingEvents = await Event.countDocuments({ date: { $gte: new Date() } });
    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name universityEmail department createdAt');

    res.json({
      success: true,
      stats: { totalUsers, totalClubs, totalEvents, totalGroups, upcomingEvents },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
router.get('/users', async (req, res, next) => {
  try {
    const { search, department, role } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { universityEmail: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (role) filter.role = role;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select('-password');

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Promote/demote user role
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: `User role updated to ${role}`, user });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Remove user from clubs and study groups
    await Club.updateMany({ members: req.params.id }, { $pull: { members: req.params.id } });
    await StudyGroup.updateMany({ members: req.params.id }, { $pull: { members: req.params.id } });
    await Event.updateMany({ registeredStudents: req.params.id }, { $pull: { registeredStudents: req.params.id } });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/clubs
// @desc    Create a club (admin only)
router.post('/clubs', async (req, res, next) => {
  try {
    const club = await Club.create(req.body);
    res.status(201).json({ success: true, message: 'Club created successfully', club });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/clubs/:id
// @desc    Edit a club
router.put('/clubs/:id', async (req, res, next) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, message: 'Club updated', club });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/clubs/:id
// @desc    Delete a club
router.delete('/clubs/:id', async (req, res, next) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    await User.updateMany({ joinedClubs: req.params.id }, { $pull: { joinedClubs: req.params.id } });
    res.json({ success: true, message: 'Club deleted' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/events
// @desc    Create an event (admin only)
router.post('/events', async (req, res, next) => {
  try {
    const event = await Event.create(req.body);

    // ── Email all students about the new event ──────────────
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const students = await User.find({ role: 'student' }).select('universityEmail').lean();
        const emailList = students.map(s => s.universityEmail).filter(Boolean);

        const eventDate = new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        const html = `
          <div style="font-family: DM Sans, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #010818, #1d2f6f); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #fff; font-size: 1.3rem; margin: 0;">📅 New Event on UniVerse</h1>
            </div>
            <div style="background: #fff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #dee2e6; border-top: none;">
              <span style="background: rgba(13,110,253,0.1); color: #0d6efd; padding: 3px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">${event.eventType}</span>
              <h2 style="color: #010818; font-size: 1.3rem; margin: 12px 0 8px;">${event.title}</h2>
              <p style="color: #58555e; line-height: 1.7; margin: 0 0 16px;">${event.description || ''}</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><td style="padding: 6px 0; color: #7e7e7e; font-size: 0.85rem; width: 110px;">📅 Date</td><td style="padding: 6px 0; font-weight: 600; font-size: 0.85rem;">${eventDate}</td></tr>
                ${event.time ? `<tr><td style="padding: 6px 0; color: #7e7e7e; font-size: 0.85rem;">⏰ Time</td><td style="padding: 6px 0; font-weight: 600; font-size: 0.85rem;">${event.time}</td></tr>` : ''}
                <tr><td style="padding: 6px 0; color: #7e7e7e; font-size: 0.85rem;">📍 Venue</td><td style="padding: 6px 0; font-weight: 600; font-size: 0.85rem;">${event.venue}</td></tr>
                ${event.organizerName ? `<tr><td style="padding: 6px 0; color: #7e7e7e; font-size: 0.85rem;">🏛️ Organizer</td><td style="padding: 6px 0; font-weight: 600; font-size: 0.85rem;">${event.organizerName}</td></tr>` : ''}
                ${event.maxCapacity ? `<tr><td style="padding: 6px 0; color: #7e7e7e; font-size: 0.85rem;">🎟️ Capacity</td><td style="padding: 6px 0; font-weight: 600; font-size: 0.85rem;">${event.maxCapacity} seats</td></tr>` : ''}
              </table>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="display: inline-block; background: #0d6efd; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.875rem;">
                Register on UniVerse →
              </a>
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
              <p style="color: #7e7e7e; font-size: 0.78rem; margin: 0; text-align: center;">Lahore Garrison University · UniVerse Student Portal</p>
            </div>
          </div>`;

        // Send in batches of 50
        const chunkSize = 50;
        for (let i = 0; i < emailList.length; i += chunkSize) {
          const chunk = emailList.slice(i, i + chunkSize);
          await transporter.sendMail({
            from: `"UniVerse LGU" <${process.env.EMAIL_USER}>`,
            bcc: chunk,
            subject: `📅 New Event: ${event.title} — ${eventDate}`,
            html,
          });
        }
        console.log(`📧 Event email sent to ${emailList.length} students`);
      } catch (emailErr) {
        // Don't fail the request if email fails
        console.error('Event email error:', emailErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Event created successfully', event });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/events/:id
// @desc    Edit an event
router.put('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event updated', event });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete an event
router.delete('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    await User.updateMany({ registeredEvents: req.params.id }, { $pull: { registeredEvents: req.params.id } });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
});


// ─── GET /api/admin/study-groups ────────────────────────────
router.get('/study-groups', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const groups = await StudyGroup.find()
      .populate('creator', 'name universityEmail department')
      .populate('members', 'name universityEmail department year')
      .sort('-createdAt');
    res.json({ success: true, count: groups.length, data: groups });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/admin/study-groups/:id ─────────────────────
router.delete('/study-groups/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found' });
    await StudyGroup.findByIdAndDelete(req.params.id);
    await User.updateMany(
      { joinedStudyGroups: req.params.id },
      { $pull: { joinedStudyGroups: req.params.id } }
    );
    res.json({ success: true, message: 'Study group deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/events/:id/registrations ────────────────
router.get('/events/:id/registrations', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'registeredStudents',
      'name universityEmail department year studentId'
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({
      success: true,
      data: {
        eventTitle: event.title,
        eventDate: event.date,
        eventType: event.eventType,
        registrations: event.registeredStudents,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/analytics ───────────────────────────────
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const deptDistribution = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: 'student' } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const clubsByCategory = await Club.aggregate([
      { $group: { _id: '$category', totalMembers: { $sum: { $size: '$members' } }, clubCount: { $sum: 1 } } },
      { $sort: { totalMembers: -1 } },
    ]);

    const eventsByType = await Event.aggregate([
      { $group: { _id: '$eventType', totalRegistrations: { $sum: { $size: '$registeredStudents' } }, eventCount: { $sum: 1 } } },
      { $sort: { totalRegistrations: -1 } },
    ]);

    const yearDistribution = await User.aggregate([
      { $match: { role: 'student', year: { $exists: true, $ne: null } } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: { deptDistribution, monthlyRegistrations, clubsByCategory, eventsByType, yearDistribution },
    });
  } catch (err) {
    next(err);
  }
});


// ── Helper: log an admin action ──────────────────────────────
async function logActivity(req, action, targetType, targetId, targetName, details = null) {
  try {
    await ActivityLog.create({
      admin: req.user._id || req.user.id,
      adminName: req.user.name,
      adminEmail: req.user.universityEmail,
      action,
      targetType,
      targetId: targetId || null,
      targetName: targetName || null,
      details,
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

// ── Helper: send announcement email ─────────────────────────
async function sendAnnouncementEmail(announcement, recipients) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email not configured — announcement email skipped');
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const typeEmoji = { info: 'ℹ️', warning: '⚠️', urgent: '🚨', success: '✅' };
    const typeColor = { info: '#0d6efd', warning: '#fd7e14', urgent: '#dc3545', success: '#198754' };

    const html = `
      <div style="font-family: DM Sans, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #010818, #1d2f6f); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <img src="${process.env.CLIENT_URL || 'http://localhost:3000'}/lgulogo.png" alt="LGU Logo" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); margin-bottom: 12px;" />
          <h1 style="color: #fff; font-size: 1.4rem; margin: 0;">UniVerse — Lahore Garrison University</h1>
        </div>
        <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #dee2e6; border-top: none;">
          <div style="display: inline-block; background: ${typeColor[announcement.type]}18; color: ${typeColor[announcement.type]}; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 16px; border: 1px solid ${typeColor[announcement.type]}40;">
            ${typeEmoji[announcement.type]} ${announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)} Announcement
          </div>
          <h2 style="color: #010818; font-size: 1.3rem; margin: 0 0 12px;">${announcement.title}</h2>
          <p style="color: #58555e; line-height: 1.7; margin: 0 0 24px; font-size: 0.95rem;">${announcement.message.replace(/\n/g, '<br>')}</p>
          ${announcement.expiresAt ? `<p style="color: #7e7e7e; font-size: 0.8rem;">⏳ This announcement expires on ${new Date(announcement.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;" />
          <p style="color: #7e7e7e; font-size: 0.8rem; text-align: center; margin: 0;">
            You received this email as a registered student of Lahore Garrison University.<br>
            Log in to <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="color: #0d6efd;">UniVerse Portal</a> for more details.
          </p>
        </div>
      </div>`;

    const emailList = recipients.map(r => r.universityEmail).filter(Boolean);
    const chunkSize = 50; // send in batches to avoid rate limits
    for (let i = 0; i < emailList.length; i += chunkSize) {
      const chunk = emailList.slice(i, i + chunkSize);
      await transporter.sendMail({
        from: `"UniVerse LGU" <${process.env.EMAIL_USER}>`,
        bcc: chunk,
        subject: `${typeEmoji[announcement.type]} [UniVerse] ${announcement.title}`,
        html,
      });
    }
    return true;
  } catch (err) {
    console.error('Announcement email error:', err.message);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════
// STUDY GROUP ROUTES
// ════════════════════════════════════════════════════════════════

// PUT /api/admin/study-groups/:id — Edit study group
router.put('/study-groups/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { name, subject, description, course, department, semester, maxMembers, isOnline, groupType, meetingSchedule } = req.body;
    const group = await StudyGroup.findByIdAndUpdate(
      req.params.id,
      { name, subject, description, course, department, semester, maxMembers, isOnline, groupType, meetingSchedule },
      { new: true, runValidators: true }
    ).populate('creator', 'name universityEmail department');

    if (!group) return res.status(404).json({ success: false, message: 'Study group not found' });

    await logActivity(req, 'UPDATE', 'StudyGroup', group._id, group.name);
    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
});

// ════════════════════════════════════════════════════════════════
// CLUB MEMBER LIST
// ════════════════════════════════════════════════════════════════

// GET /api/admin/clubs/:id/members — Get members of a club
router.get('/clubs/:id/members', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const Club = require('../models/Club');
    const club = await Club.findById(req.params.id).populate(
      'members',
      'name universityEmail department year studentId createdAt'
    );
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({
      success: true,
      data: {
        clubName: club.name,
        clubCategory: club.category,
        members: club.members,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ════════════════════════════════════════════════════════════════
// FULL STUDENT ACTIVITY VIEW
// ════════════════════════════════════════════════════════════════

// GET /api/admin/users/:id/activity — Full student activity
router.get('/users/:id/activity', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const Club = require('../models/Club');
    const user = await User.findById(req.params.id)
      .populate('joinedClubs', 'name category description presidentName')
      .populate('registeredEvents', 'title eventType date venue organizerName')
      .populate('joinedStudyGroups', 'name subject department semester isOnline groupType');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          universityEmail: user.universityEmail,
          studentId: user.studentId,
          department: user.department,
          year: user.year,
          role: user.role,
          createdAt: user.createdAt,
        },
        joinedClubs: user.joinedClubs || [],
        registeredEvents: user.registeredEvents || [],
        joinedStudyGroups: user.joinedStudyGroups || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ════════════════════════════════════════════════════════════════

// GET /api/admin/announcements — All announcements
router.get('/announcements', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name universityEmail')
      .sort('-createdAt');
    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/announcements — Create announcement + optional email blast
router.post('/announcements', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { title, message, type, targetAudience, targetDepartment, expiresAt, sendEmail } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'info',
      targetAudience: targetAudience || 'all',
      targetDepartment: targetAudience === 'department' ? targetDepartment : null,
      expiresAt: expiresAt || null,
      createdBy: req.user._id || req.user.id,
    });

    let emailSent = false;
    if (sendEmail) {
      let query = { role: 'student' };
      if (targetAudience === 'department' && targetDepartment) {
        query.department = targetDepartment;
      }
      const recipients = await User.find(query).select('universityEmail');
      emailSent = await sendAnnouncementEmail(announcement, recipients);
      if (emailSent) {
        announcement.emailSent = true;
        await announcement.save();
      }
    }

    await logActivity(req, 'BROADCAST', 'Announcement', announcement._id, announcement.title,
      `Type: ${type}, Audience: ${targetAudience}, Email: ${emailSent}`);

    const populated = await announcement.populate('createdBy', 'name universityEmail');
    res.status(201).json({ success: true, data: populated, emailSent });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/announcements/:id — Update announcement
router.put('/announcements/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { title, message, type, targetAudience, targetDepartment, expiresAt, isActive } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, message, type, targetAudience, targetDepartment, expiresAt, isActive },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name universityEmail');

    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

    await logActivity(req, 'UPDATE', 'Announcement', announcement._id, announcement.title);
    res.json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/announcements/:id — Delete announcement
router.delete('/announcements/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });

    await logActivity(req, 'DELETE', 'Announcement', announcement._id, announcement.title);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
});

// ════════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ════════════════════════════════════════════════════════════════

// GET /api/admin/activity-log — Paginated activity log
router.get('/activity-log', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.action)     filter.action     = req.query.action;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort('-createdAt').skip(skip).limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});


// ================================================================
// FILE 2: NEW FILE — server/routes/announcements.js
// (Student-facing public announcements route)
// Register it in server/index.js:
//   app.use('/api/announcements', require('./routes/announcements'));
// ================================================================

/*
const express = require('express');
const router  = express.Router();
const Announcement = require('../models/Announcement');

// GET /api/announcements — Active announcements for students
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select('title message type targetAudience targetDepartment createdAt expiresAt')
      .sort('-createdAt')
      .limit(10);

    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
*/
module.exports = router;