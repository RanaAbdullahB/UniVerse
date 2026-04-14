/**
 * CheckIn.js
 * Place at: server/models/CheckIn.js
 *
 * Records each student's physical check-in to an event via QR scan.
 * Separate from registeredStudents — a student can register but not show up,
 * or check in without pre-registering (if admin allows walk-ins).
 */

const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    event: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: true,
      index:    true
    },
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true
    },
    studentName:       { type: String, default: '' },
    studentEmail:      { type: String, default: '' },
    studentDepartment: { type: String, default: '' },
    studentYear:       { type: Number, default: 1 },
    checkedInAt:       { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// One check-in per student per event
checkInSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);