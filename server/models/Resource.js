/**
 * Resource.js
 * Place at: server/models/Resource.js
 */

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 120
    },
    description: {
      type:     String,
      trim:     true,
      maxlength: 500,
      default:  ''
    },
    fileUrl:   { type: String, required: true },   // relative path served statically
    fileName:  { type: String, required: true },   // original file name
    fileSize:  { type: Number, default: 0 },       // bytes
    fileType:  { type: String, default: '' },      // mime type

    resourceType: {
      type:    String,
      enum:    ['PDF', 'Notes', 'Slides', 'Book', 'Assignment', 'Other'],
      default: 'PDF'
    },

    department: { type: String, default: 'General' },
    course:     { type: String, default: '',  trim: true },
    tags:       [{ type: String, trim: true }],

    uploadedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true
    },
    uploaderName: { type: String, default: '' },

    // If this resource was uploaded to fulfill a request
    fulfilledRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'ResourceRequest',
      default: null
    },

    downloads: { type: Number, default: 0 }
  },
  { timestamps: true }
);

resourceSchema.index({ department: 1, resourceType: 1 });
resourceSchema.index({ title: 'text', description: 'text', course: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);