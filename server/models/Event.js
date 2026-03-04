const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    organizerName: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['Workshop', 'Seminar', 'Competition', 'Social', 'Sports', 'Cultural'],
      required: [true, 'Event type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    registeredStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxCapacity: {
      type: Number,
      required: [true, 'Max capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    isRegistrationOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for seats left
eventSchema.virtual('seatsLeft').get(function () {
  return this.maxCapacity - this.registeredStudents.length;
});

// Virtual for is past event
eventSchema.virtual('isPast').get(function () {
  return new Date(this.date) < new Date();
});

module.exports = mongoose.model('Event', eventSchema);
