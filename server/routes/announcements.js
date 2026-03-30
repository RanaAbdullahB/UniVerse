// server/routes/announcements.js
// Register in server/index.js:  app.use('/api/announcements', require('./routes/announcements'));

const express = require('express');
const router  = express.Router();
const Announcement = require('../models/Announcement');

// GET /api/announcements — Active, non-expired announcements for the student portal
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