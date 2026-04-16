/**
 * checkin.js
 * Place at: server/routes/checkin.js
 *
 * QR Check-in system routes.
 * Token = HMAC-SHA256(eventId, JWT_SECRET).slice(0,32) — no extra DB field needed.
 */

const express  = require('express');
const router   = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const CheckIn  = require('../models/CheckIn');
const { generateCheckInToken } = require('../models/CheckIn');  // ← uses the fixed export
const Event    = require('../models/Event');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/checkin/:eventId/token
// Admin only — generate QR token + check-in URL for an event
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:eventId/token', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    const token      = generateCheckInToken(eventId);
    const checkInUrl = `${process.env.CLIENT_URL}/checkin/${eventId}/${token}`;

    res.json({
      success:    true,
      token,
      checkInUrl,
      eventTitle: event.title
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/checkin/:eventId/verify/:token
// Public — validate QR token before showing the check-in page to student
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:eventId/verify/:token', async (req, res) => {
  try {
    const { eventId, token } = req.params;

    const expected = generateCheckInToken(eventId);
    if (token !== expected)
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });

    const event = await Event.findById(eventId).select('title date time venue organizerName');
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/checkin/:eventId
// Student — submit check-in (requires valid token in body)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId }     = req.params;
    const { token }       = req.body;

    if (!token)
      return res.status(400).json({ success: false, message: 'Token is required' });

    // Validate token
    const expected = generateCheckInToken(eventId);
    if (token !== expected)
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    // Create check-in (unique index prevents duplicates)
    const checkIn = await CheckIn.create({
      event:             eventId,
      student:           req.user._id,
      studentName:       req.user.name,
      studentEmail:      req.user.universityEmail,
      studentDepartment: req.user.department || '',
      studentYear:       req.user.year       || 1
    });

    res.json({ success: true, checkIn });
  } catch (err) {
    // Duplicate check-in (unique index violation)
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'You have already checked in to this event' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/checkin/:eventId/list
// Admin only — full check-in list for an event
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:eventId/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const checkIns = await CheckIn.find({ event: eventId })
      .sort({ checkedInAt: 1 });

    res.json({ success: true, checkIns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;