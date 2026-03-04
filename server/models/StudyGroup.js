const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    course: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: String,
      enum: ['Fall', 'Spring', 'Summer'],
      required: [true, 'Semester is required'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxMembers: {
      type: Number,
      default: 10,
      min: [2, 'Group must allow at least 2 members'],
      max: [50, 'Group cannot exceed 50 members'],
    },
    meetingSchedule: {
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'TBD'],
        default: 'TBD',
      },
      time: { type: String, default: 'TBD' },
      location: { type: String, default: 'TBD' },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    groupType: {
      type: String,
      enum: ['Open', 'Invite-Only'],
      default: 'Open',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for member count
studyGroupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Virtual for open slots
studyGroupSchema.virtual('openSlots').get(function () {
  return this.maxMembers - this.members.length;
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
