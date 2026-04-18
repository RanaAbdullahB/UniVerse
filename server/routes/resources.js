/**
 * resources.js
 * Place at: server/routes/resources.js
 *
 * IMPORTANT: All static routes (/requests, /requests/:id/...) are declared
 * BEFORE wildcard routes (/:id, /:id/download) to avoid Express conflicts.
 */

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { authMiddleware } = require('../middleware/authMiddleware');
const Resource        = require('../models/Resource');
const ResourceRequest = require('../models/ResourceRequest');

// ─── Multer setup ─────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resources');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_').slice(0, 60);
    cb(null, `res_${Date.now()}_${base}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png', 'image/jpeg', 'image/jpg',
    'application/zip', 'application/x-zip-compressed'
  ];
  cb(allowed.includes(file.mimetype) ? null : new Error('File type not allowed'),
     allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS — declared FIRST so /requests doesn't get caught by /:id
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/resources/requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status     && status !== 'All')     filter.status = status;
    if (department && department !== 'All') filter.department = department;

    const requests = await ResourceRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources/requests
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const { title, description, resourceType, department, course } = req.body;
    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title is required' });

    const request = await ResourceRequest.create({
      title:         title.trim(),
      description:   description?.trim() || '',
      resourceType:  resourceType || 'PDF',
      department:    department   || 'General',
      course:        course?.trim() || '',
      requestedBy:   req.user._id,
      requesterName: req.user.name
    });

    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources/requests/:id/fulfill
router.post('/requests/:id/fulfill', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const resourceRequest = await ResourceRequest.findById(req.params.id);
    if (!resourceRequest)
      return res.status(404).json({ success: false, message: 'Request not found' });
    if (resourceRequest.status === 'fulfilled')
      return res.status(400).json({ success: false, message: 'Request already fulfilled' });
    if (!req.file)
      return res.status(400).json({ success: false, message: 'File is required' });

    const resource = await Resource.create({
      title:            resourceRequest.title,
      description:      req.body.description?.trim() || `Fulfills request: ${resourceRequest.title}`,
      fileUrl:          `/uploads/resources/${req.file.filename}`,
      fileName:         req.file.originalname,
      fileSize:         req.file.size,
      fileType:         req.file.mimetype,
      resourceType:     resourceRequest.resourceType,
      department:       resourceRequest.department,
      course:           resourceRequest.course,
      uploadedBy:       req.user._id,
      uploaderName:     req.user.name,
      fulfilledRequest: resourceRequest._id
    });

    resourceRequest.status            = 'fulfilled';
    resourceRequest.fulfilledBy       = req.user._id;
    resourceRequest.fulfilledByName   = req.user.name;
    resourceRequest.fulfilledResource = resource._id;
    await resourceRequest.save();

    res.json({ success: true, resource, request: resourceRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/resources/requests/:id
router.delete('/requests/:id', authMiddleware, async (req, res) => {
  try {
    const request = await ResourceRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({ success: false, message: 'Request not found' });

    const isOwner = request.requestedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await request.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCES — wildcard /:id routes come AFTER static routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/resources
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, department, type } = req.query;
    const filter = {};
    if (department && department !== 'All') filter.department = department;
    if (type       && type !== 'All')       filter.resourceType = type;
    if (q) {
      filter.$or = [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { course:      { $regex: q, $options: 'i' } }
      ];
    }
    const resources = await Resource.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/resources
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'File is required' });

    const { title, description, resourceType, department, course, tags } = req.body;
    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title is required' });

    const resource = await Resource.create({
      title:        title.trim(),
      description:  description?.trim() || '',
      fileUrl:      `/uploads/resources/${req.file.filename}`,
      fileName:     req.file.originalname,
      fileSize:     req.file.size,
      fileType:     req.file.mimetype,
      resourceType: resourceType || 'PDF',
      department:   department   || 'General',
      course:       course?.trim() || '',
      tags:         tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      uploadedBy:   req.user._id,
      uploaderName: req.user.name
    });

    res.status(201).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/resources/:id/download
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!resource)
      return res.status(404).json({ success: false, message: 'Resource not found' });

    res.json({ success: true, fileUrl: resource.fileUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/resources/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource)
      return res.status(404).json({ success: false, message: 'Resource not found' });

    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const filePath = path.join(__dirname, '..', resource.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await resource.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;