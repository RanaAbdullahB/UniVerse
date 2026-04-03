// server/routes/messages.js
// Register in server/index.js:
//   app.use('/api/messages', require('./routes/messages'));

const express  = require('express');
const router   = express.Router();
const Message  = require('../models/Message');
const StudyGroup = require('../models/StudyGroup');
const { authMiddleware } = require('../middleware/authMiddleware');

// ── GET /api/messages/:groupId ────────────────────────────────
// Load last N messages for a study group (must be a member)
router.get('/:groupId', authMiddleware, async (req, res, next) => {
  try {
    const userId  = req.user._id || req.user.id;
    const limit   = Math.min(parseInt(req.query.limit) || 50, 100);
    const before  = req.query.before; // ISO date for pagination

    // Verify user is a member of this group
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === userId.toString());
    const isCreator = group.creator.toString() === userId.toString();
    if (!isMember && !isCreator) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    const query = { studyGroup: req.params.groupId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Return in chronological order
    res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/messages/:groupId ───────────────────────────────
// Save a message (also emitted via socket — this is the REST fallback)
router.post('/:groupId', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some(m => m.toString() === userId.toString());
    const isCreator = group.creator.toString() === userId.toString();
    if (!isMember && !isCreator) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    const message = await Message.create({
      studyGroup: req.params.groupId,
      sender: userId,
      senderName: req.user.name,
      senderDepartment: req.user.department || null,
      senderYear: req.user.year || null,
      senderPhoto: req.user.profilePhoto || null,
      content: content.trim(),
      readBy: [userId],
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

module.exports = router;