const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Conversation  = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const User          = require('../models/User');

// ─────────────────────────────────────────────
// GET /api/conversations
// Returns all conversations for the logged-in user, sorted newest first
// ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name profilePhoto department year')
      .sort({ updatedAt: -1 });

    // Attach per-user unread count to each conversation object
    const result = conversations.map(c => {
      const obj = c.toObject();
      obj.myUnread = c.unreadCount.get(req.user._id.toString()) || 0;
      return obj;
    });

    res.json({ success: true, conversations: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/conversations
// Start or retrieve an existing conversation with another user
// Body: { userId }
// ─────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ success: false, message: 'userId is required' });
    if (userId === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'You cannot DM yourself' });

    // Check if a conversation already exists between these two users
    let convo = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 }
    }).populate('participants', 'name profilePhoto department year');

    if (!convo) {
      const other = await User.findById(userId).select('name profilePhoto department year');
      if (!other)
        return res.status(404).json({ success: false, message: 'User not found' });

      convo = await Conversation.create({ participants: [req.user._id, userId] });
      convo = await convo.populate('participants', 'name profilePhoto department year');
    }

    const obj     = convo.toObject();
    obj.myUnread  = convo.unreadCount.get(req.user._id.toString()) || 0;

    res.json({ success: true, conversation: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/conversations/users/search
// Search students to start a new DM
// Query: ?q=name
// ─────────────────────────────────────────────
router.get('/users/search', authMiddleware, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2)
      return res.json({ success: true, users: [] });

    const users = await User.find({
      _id:  { $ne: req.user._id },
      role: 'student',
      name: { $regex: q, $options: 'i' }
    })
      .select('name profilePhoto department year')
      .limit(8);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/conversations/:id/messages
// Load paginated message history for a conversation
// Query: ?page=1
// ─────────────────────────────────────────────
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const convo = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });
    if (!convo)
      return res.status(404).json({ success: false, message: 'Conversation not found' });

    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 30;
    const skip  = (page - 1) * limit;

    const messages = await DirectMessage.find({ conversation: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const hasMore = messages.length === limit;

    // Mark all unread messages from the other person as read
    await DirectMessage.updateMany(
      {
        conversation: req.params.id,
        sender:  { $ne: req.user._id },
        readAt: null
      },
      { readAt: new Date() }
    );

    // Reset unread counter for this user
    convo.unreadCount.set(req.user._id.toString(), 0);
    await convo.save();

    res.json({ success: true, messages: messages.reverse(), page, hasMore });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/conversations/:id/messages
// REST fallback to send a message (Socket.io is primary)
// Body: { content }
// ─────────────────────────────────────────────
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res.status(400).json({ success: false, message: 'content is required' });

    const convo = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });
    if (!convo)
      return res.status(404).json({ success: false, message: 'Conversation not found' });

    const message = await DirectMessage.create({
      conversation: req.params.id,
      sender:       req.user._id,
      senderName:   req.user.name,
      senderPhoto:  req.user.profilePhoto || '',
      content:      content.trim()
    });

    // Update last message + increment unread for the other participant
    const otherId = convo.participants
      .find(p => p.toString() !== req.user._id.toString())
      .toString();

    convo.lastMessage = {
      content: content.trim(),
      sender:  req.user._id,
      sentAt:  new Date()
    };
    const prev = convo.unreadCount.get(otherId) || 0;
    convo.unreadCount.set(otherId, prev + 1);
    await convo.save();

    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;