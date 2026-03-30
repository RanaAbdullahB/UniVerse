// server/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    message: { type: String, required: [true, 'Message is required'], maxlength: 2000 },
    type: {
      type: String,
      enum: ['info', 'warning', 'urgent', 'success'],
      default: 'info',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'department'],
      default: 'all',
    },
    targetDepartment: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual: is the announcement still live (not expired)
announcementSchema.virtual('isLive').get(function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
});

module.exports = mongoose.model('Announcement', announcementSchema);