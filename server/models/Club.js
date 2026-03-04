const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: ['Technical', 'Sports', 'Arts', 'Cultural', 'Academic', 'Social'],
      required: [true, 'Category is required'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    presidentName: {
      type: String,
      required: [true, 'President name is required'],
      trim: true,
    },
    presidentEmail: {
      type: String,
      required: [true, 'President email is required'],
      trim: true,
      lowercase: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total member count
clubSchema.virtual('totalMembers').get(function () {
  return this.members.length;
});

module.exports = mongoose.model('Club', clubSchema);
