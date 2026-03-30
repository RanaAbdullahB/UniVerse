// server/models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String },
    adminEmail: { type: String },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'PROMOTE', 'DEMOTE', 'BROADCAST'],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['User', 'Club', 'Event', 'StudyGroup', 'Announcement'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    targetName: { type: String, default: null },
    details: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);