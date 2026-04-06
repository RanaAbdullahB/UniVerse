const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName:  { type: String, default: '' },
    senderPhoto: { type: String, default: '' },
    content:     { type: String, required: true, maxlength: 1000 },
    readAt:      { type: Date, default: null }
  },
  { timestamps: true }
);

// Compound index for fast paginated history queries
directMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);