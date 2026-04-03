// server/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    studyGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: { type: String, required: true },
    senderDepartment: { type: String, default: null },
    senderYear: { type: Number, default: null },
    senderPhoto: { type: String, default: null },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: 1000,
      trim: true,
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Index for fast message history queries
messageSchema.index({ studyGroup: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);