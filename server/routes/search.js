// server/routes/search.js
// Register in server/index.js:
//   app.use('/api/search', require('./routes/search'));

const express    = require('express');
const router     = express.Router();
const User       = require('../models/User');
const Club       = require('../models/Club');
const Event      = require('../models/Event');
const StudyGroup = require('../models/StudyGroup');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/search?q=keyword&type=all|clubs|events|groups|students
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const q    = (req.query.q || '').trim();
    const type = req.query.type || 'all';

    if (!q || q.length < 2) {
      return res.json({ success: true, data: { clubs: [], events: [], groups: [], students: [] } });
    }

    const regex = { $regex: q, $options: 'i' };
    const limit = 5;

    const [clubs, events, groups, students] = await Promise.all([
      // Clubs
      (type === 'all' || type === 'clubs')
        ? Club.find({ $or: [{ name: regex }, { description: regex }, { category: regex }, { presidentName: regex }] })
            .select('name category description totalMembers coverImage presidentName')
            .limit(limit).lean()
        : Promise.resolve([]),

      // Events
      (type === 'all' || type === 'events')
        ? Event.find({ $or: [{ title: regex }, { description: regex }, { venue: regex }, { organizerName: regex }, { eventType: regex }] })
            .select('title eventType date venue organizerName coverImage registeredStudents isRegistrationOpen')
            .limit(limit).lean()
        : Promise.resolve([]),

      // Study Groups
      (type === 'all' || type === 'groups')
        ? StudyGroup.find({ $or: [{ name: regex }, { subject: regex }, { department: regex }, { course: regex }] })
            .select('name subject department semester isOnline groupType members maxMembers')
            .populate('creator', 'name')
            .limit(limit).lean()
        : Promise.resolve([]),

      // Students (only name + dept, no sensitive info)
      (type === 'all' || type === 'students')
        ? User.find({ role: 'student', $or: [{ name: regex }, { department: regex }] })
            .select('name department year profilePhoto')
            .limit(limit).lean()
        : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      data: { clubs, events, groups, students },
      query: q,
      total: clubs.length + events.length + groups.length + students.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;