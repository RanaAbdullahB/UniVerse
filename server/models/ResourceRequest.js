/**
 * ResourceRequest.js
 * Place at: server/models/ResourceRequest.js
 */

const mongoose = require('mongoose');

const resourceRequestSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 120
    },
    description: {
      type:     String,
      trim:     true,
      maxlength: 500,
      default:  ''
    },
    department:   { type: String, default: 'General' },
    course:       { type: String, default: '', trim: true },
    resourceType: {
      type:    String,
      enum:    ['PDF', 'Notes', 'Slides', 'Book', 'Assignment', 'Other'],
      default: 'PDF'
    },

    requestedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true
    },
    requesterName: { type: String, default: '' },

    status: {
      type:    String,
      enum:    ['open', 'fulfilled'],
      default: 'open'
    },

    // Populated once someone fulfils it
    fulfilledBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fulfilledByName:  { type: String, default: '' },
    fulfilledResource:{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource', default: null }
  },
  { timestamps: true }
);

resourceRequestSchema.index({ status: 1, department: 1 });

module.exports = mongoose.model('ResourceRequest', resourceRequestSchema);