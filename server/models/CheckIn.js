/**
 * checkin.js — Check-in routes
 * Place at: server/routes/checkin.js
 */

const express    = require('express');
const router     = express.Router();
const crypto     = require('crypto');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const Event      = require('../models/Event');
const CheckIn    = require('../models/CheckIn');
const User       = require('../models/User');

// ─── Helper: generate a secure check-in token for an event ───────────────────
function generateCheckInToken(eventId) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'universe-secret')
    .update(eventId.toString())
    .digest('hex')
    .slice(0, 32); // 32-char hex token
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/checkin/:eventId/token
// Admin only — get (or generate) the check-in token for an event
// Returns the full check-in URL to embed in the QR code
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:eventId/token', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Generate deterministic token from eventId (no need to store it)
    const token    = generateCheckInToken(req.params.eventId);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const checkInUrl = `${clientUrl}/checkin/${req.params.eventId}/${token}`;

    res.json({
      success: true,
      token,
      checkInUrl,
      event: { _id: event._id, title: event.title, date: event.date, venue: event.venue }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/checkin/:eventId
// Student — scan QR and check in
// Body: { token }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    // Verify token
    const expectedToken = generateCheckInToken(req.params.eventId);
    if (token !== expectedToken) {
      return res.status(401).json({ success: false, message: 'Invalid check-in token' });
    }

    // Find event
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Check if event is in the past (allow check-in on day of event too)
    const eventDate  = new Date(event.date);
    const today      = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      return res.status(400).json({ success: false, message: 'This event has already ended' });
    }

    // Check for duplicate check-in
    const existing = await CheckIn.findOne({
      event:   req.params.eventId,
      student: req.user._id
    });
    if (existing) {
      return res.status(409).json({
        success:  false,
        message:  'You have already checked in to this event',
        checkedInAt: existing.checkedInAt
      });
    }

    // Create check-in record
    const checkIn = await CheckIn.create({
      event:             req.params.eventId,
      student:           req.user._id,
      studentName:       req.user.name,
      studentEmail:      req.user.universityEmail,
      studentDepartment: req.user.department,
      studentYear:       req.user.year,
    });

    res.json({
      success: true,
      message: `Successfully checked in to ${event.title}!`,
      checkIn,
      event: { title: event.title, date: event.date, venue: event.venue }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/checkin/:eventId/list
// Admin only — get full check-in list for an event
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:eventId/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).select('title date venue');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const checkIns = await CheckIn.find({ event: req.params.eventId })
      .sort({ checkedInAt: 1 });

    res.json({
      success: true,
      event,
      checkIns,
      total: checkIns.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/checkin/:eventId/verify
// Public (no auth) — verify an event + token are valid before showing check-in page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:eventId/verify/:token', async (req, res) => {
  try {
    const expectedToken = generateCheckInToken(req.params.eventId);
    if (req.params.token !== expectedToken) {
      return res.status(401).json({ success: false, message: 'Invalid QR code' });
    }

    const event = await Event.findById(req.params.eventId)
      .select('title date time venue eventType coverImage');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;