// server/socket.js
// Real-time chat via Socket.io
//
// HOW TO INTEGRATE INTO server/index.js:
// ─────────────────────────────────────────
// 1. Replace:
//      const app = express();
//      ...
//      app.listen(PORT, ...)
//
//    With:
//      const app    = express();
//      const http   = require('http');
//      const server = http.createServer(app);
//      const initSocket = require('./socket');
//      initSocket(server);
//      ...
//      server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// ─────────────────────────────────────────

const { Server }   = require('socket.io');
const jwt          = require('jsonwebtoken');
const Message      = require('./models/Message');
const StudyGroup   = require('./models/StudyGroup');
const User         = require('./models/User');

module.exports = function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Auth middleware ───────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`💬 Socket connected: ${socket.user.name} (${socket.id})`);

    // ── Join a study group chat room ──────────────────────
    socket.on('join_group', async ({ groupId }) => {
      try {
        const group = await StudyGroup.findById(groupId);
        if (!group) return socket.emit('error', { message: 'Group not found' });

        const isMember = group.members.some(m => m.toString() === userId);
        const isCreator = group.creator.toString() === userId;
        if (!isMember && !isCreator) {
          return socket.emit('error', { message: 'Not a member of this group' });
        }

        socket.join(`group_${groupId}`);
        socket.emit('joined_group', { groupId, groupName: group.name });
        console.log(`  → ${socket.user.name} joined group_${groupId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join group' });
      }
    });

    // ── Leave a study group chat room ─────────────────────
    socket.on('leave_group', ({ groupId }) => {
      socket.leave(`group_${groupId}`);
      console.log(`  → ${socket.user.name} left group_${groupId}`);
    });

    // ── Send a message ────────────────────────────────────
    socket.on('send_message', async ({ groupId, content }) => {
      try {
        if (!content?.trim()) return;
        if (content.length > 1000) return socket.emit('error', { message: 'Message too long (max 1000 chars)' });

        // Verify membership again
        const group = await StudyGroup.findById(groupId);
        if (!group) return socket.emit('error', { message: 'Group not found' });

        const isMember = group.members.some(m => m.toString() === userId);
        const isCreator = group.creator.toString() === userId;
        if (!isMember && !isCreator) {
          return socket.emit('error', { message: 'Not a member of this group' });
        }

        // Save to DB
        const message = await Message.create({
          studyGroup: groupId,
          sender: socket.user._id,
          senderName: socket.user.name,
          senderDepartment: socket.user.department || null,
          senderYear: socket.user.year || null,
          senderPhoto: socket.user.profilePhoto || null,
          content: content.trim(),
          readBy: [socket.user._id],
        });

        // Broadcast to everyone in the room (including sender)
        io.to(`group_${groupId}`).emit('receive_message', {
          _id: message._id,
          studyGroup: groupId,
          sender: socket.user._id,
          senderName: socket.user.name,
          senderDepartment: socket.user.department || null,
          senderYear: socket.user.year || null,
          senderPhoto: socket.user.profilePhoto || null,
          content: message.content,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Typing indicator ──────────────────────────────────
    socket.on('typing_start', ({ groupId }) => {
      socket.to(`group_${groupId}`).emit('user_typing', {
        userId,
        userName: socket.user.name,
      });
    });

    socket.on('typing_stop', ({ groupId }) => {
      socket.to(`group_${groupId}`).emit('user_stopped_typing', { userId });
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`💬 Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};