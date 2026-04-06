const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');
const http       = require('http');
const errorHandler = require('./middleware/errorHandler');
const initSocket = require('./socket');

dotenv.config();

const app    = express();
const server = http.createServer(app);
initSocket(server);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/clubs',         require('./routes/clubs'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/study-groups',  require('./routes/studyGroups'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/search',        require('./routes/search'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/uploads',           express.static(path.join(__dirname, 'uploads')));
app.use('/api/conversations', require('./routes/conversations'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'UniVerse API is running' });
});

// ── 404 + Error handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/university-portal')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;