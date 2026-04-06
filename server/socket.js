/**
 * socket.js — UniVerse real-time server
 * Handles: Study Group Chat + Direct Messages (DMs)
 */

const jwt = require('jsonwebtoken');
const User          = require('./models/User');
const Message       = require('./models/Message');
const DirectMessage = require('./models/DirectMessage');
const Conversation  = require('./models/Conversation');

module.exports = function initSocket(server) {
  const { Server } = require('socket.io');

  const io = new Server(server, {
    cors: {
      origin:  process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // ─── Auth middleware for every socket connection ───────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user)    return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  // ─── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const uid = socket.user._id.toString();

    // Each user automatically joins their personal room for DM delivery
    socket.join(`user_${uid}`);

    // ════════════════════════════════════════════════
    // GROUP CHAT EVENTS
    // ════════════════════════════════════════════════

    socket.on('join_group', ({ groupId }) => {
      socket.join(`group_${groupId}`);
      socket.emit('joined_group', { groupId, groupName: '' });
    });

    socket.on('leave_group', ({ groupId }) => {
      socket.leave(`group_${groupId}`);
    });

    socket.on('send_message', async ({ groupId, content }) => {
      try {
        if (!content?.trim()) return;

        const msg = await Message.create({
          studyGroup:       groupId,
          sender:           socket.user._id,
          senderName:       socket.user.name,
          senderDepartment: socket.user.department,
          senderYear:       socket.user.year,
          senderPhoto:      socket.user.profilePhoto || '',
          content:          content.trim()
        });

        io.to(`group_${groupId}`).emit('receive_message', msg);
      } catch {
        socket.emit('error', { message: 'Failed to send group message' });
      }
    });

    socket.on('typing_start', ({ groupId }) => {
      socket.to(`group_${groupId}`).emit('user_typing', {
        userId:   socket.user._id,
        userName: socket.user.name
      });
    });

    socket.on('typing_stop', ({ groupId }) => {
      socket.to(`group_${groupId}`).emit('user_stopped_typing', {
        userId: socket.user._id
      });
    });

    // ════════════════════════════════════════════════
    // DIRECT MESSAGE EVENTS
    // ════════════════════════════════════════════════

    /**
     * send_dm
     * Payload: { conversationId, recipientId, content }
     * - Saves the message to MongoDB
     * - Updates conversation.lastMessage + unread count
     * - Emits receive_dm to sender + recipient personal rooms
     * - Emits dm_notification to recipient (for badge / toast)
     */
    socket.on('send_dm', async ({ conversationId, recipientId, content }) => {
      try {
        if (!content?.trim()) return;

        // Verify this user is actually in the conversation
        const convo = await Conversation.findOne({
          _id:          conversationId,
          participants: socket.user._id
        });
        if (!convo) return socket.emit('error', { message: 'Conversation not found' });

        const message = await DirectMessage.create({
          conversation: conversationId,
          sender:       socket.user._id,
          senderName:   socket.user.name,
          senderPhoto:  socket.user.profilePhoto || '',
          content:      content.trim()
        });

        // Update conversation metadata
        convo.lastMessage = {
          content: content.trim(),
          sender:  socket.user._id,
          sentAt:  new Date()
        };
        const prev = convo.unreadCount.get(recipientId) || 0;
        convo.unreadCount.set(recipientId, prev + 1);
        await convo.save();

        // Deliver to both sides
        socket.emit('receive_dm', message);
        io.to(`user_${recipientId}`).emit('receive_dm', message);

        // Lightweight notification for the recipient (shows badge / toast)
        io.to(`user_${recipientId}`).emit('dm_notification', {
          conversationId,
          senderId:   uid,
          senderName: socket.user.name,
          preview:    content.trim().slice(0, 60)
        });
      } catch {
        socket.emit('error', { message: 'Failed to send DM' });
      }
    });

    /**
     * dm_typing_start / dm_typing_stop
     * Payload: { conversationId, recipientId }
     */
    socket.on('dm_typing_start', ({ conversationId, recipientId }) => {
      io.to(`user_${recipientId}`).emit('dm_user_typing', {
        userId:         uid,
        userName:       socket.user.name,
        conversationId
      });
    });

    socket.on('dm_typing_stop', ({ conversationId, recipientId }) => {
      io.to(`user_${recipientId}`).emit('dm_user_stopped_typing', {
        userId:         uid,
        conversationId
      });
    });

    // ─── Cleanup ──────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Personal room is auto-cleaned by socket.io
    });
  });

  return io;
};