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
// ============================================================
// ADD THESE ROUTES TO: server/routes/admin.js
// Place them after your existing admin routes (before module.exports)
// Also add these requires at the top of admin.js if not already there:
//   const StudyGroup = require('../models/StudyGroup');
//   const Event = require('../models/Event');
//   const User = require('../models/User');
//   const Club = require('../models/Club');
// ============================================================

// ─── GET /api/admin/study-groups ────────────────────────────
// Returns all study groups with creator + members populated
router.get('/study-groups', protect, adminMiddleware, async (req, res, next) => {
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
// Deletes a study group and removes it from all users' joinedStudyGroups
router.delete('/study-groups/:id', protect, adminMiddleware, async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    await StudyGroup.findByIdAndDelete(req.params.id);

    // Clean up users' joinedStudyGroups references
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
// Returns the list of students registered for a specific event
router.get('/events/:id/registrations', protect, adminMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'registeredStudents',
      'name universityEmail department year studentId'
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

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
// Returns aggregated analytics data for charts in AdminOverview
router.get('/analytics', protect, adminMiddleware, async (req, res, next) => {
  try {
    // 1. Students per department
    const deptDistribution = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // 2. Monthly new student registrations — last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: 'student' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 3. Club membership totals by category
    const clubsByCategory = await Club.aggregate([
      {
        $group: {
          _id: '$category',
          totalMembers: { $sum: { $size: '$members' } },
          clubCount: { $sum: 1 },
        },
      },
      { $sort: { totalMembers: -1 } },
    ]);

    // 4. Event registrations by event type
    const eventsByType = await Event.aggregate([
      {
        $group: {
          _id: '$eventType',
          totalRegistrations: { $sum: { $size: '$registeredStudents' } },
          eventCount: { $sum: 1 },
        },
      },
      { $sort: { totalRegistrations: -1 } },
    ]);

    // 5. Student year distribution (Year 1–5)
    const yearDistribution = await User.aggregate([
      { $match: { role: 'student', year: { $exists: true, $ne: null } } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        deptDistribution,
        monthlyRegistrations,
        clubsByCategory,
        eventsByType,
        yearDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
});
module.exports = router;