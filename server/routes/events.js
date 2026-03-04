const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/events/my-events
// @access  Private
router.get('/my-events', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('registeredEvents');
    res.json({ success: true, events: user.registeredEvents });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events
// @access  Private
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { eventType, search, upcoming } = req.query;
    const filter = {};

    if (eventType && eventType !== 'All') filter.eventType = eventType;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (upcoming === 'true') filter.date = { $gte: new Date() };

    const events = await Event.find(filter)
      .populate('organizer', 'name category')
      .sort({ date: 1 });

    const eventsWithStatus = events.map((event) => {
      const obj = event.toJSON();
      obj.isRegistered = event.registeredStudents.some((s) => s.toString() === req.user._id.toString());
      return obj;
    });

    res.json({ success: true, count: events.length, events: eventsWithStatus });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/:id
// @access  Private
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name category coverImage')
      .populate('registeredStudents', 'name studentId department');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const obj = event.toJSON();
    obj.isRegistered = event.registeredStudents.some((s) => s._id.toString() === req.user._id.toString());

    res.json({ success: true, event: obj });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events
// @access  Admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, message: 'Event created', event });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events/:id/register
// @access  Private
router.post('/:id/register', authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (!event.isRegistrationOpen) {
      return res.status(400).json({ success: false, message: 'Registration is closed for this event' });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ success: false, message: 'This event has already passed' });
    }

    if (event.registeredStudents.length >= event.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity' });
    }

    const userId = req.user._id;
    if (event.registeredStudents.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    event.registeredStudents.push(userId);
    await event.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { registeredEvents: event._id } });

    res.json({
      success: true,
      message: `Successfully registered for ${event.title}`,
      seatsLeft: event.maxCapacity - event.registeredStudents.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events/:id/unregister
// @access  Private
router.post('/:id/unregister', authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userId = req.user._id;
    if (!event.registeredStudents.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are not registered for this event' });
    }

    event.registeredStudents = event.registeredStudents.filter((s) => s.toString() !== userId.toString());
    await event.save();

    await User.findByIdAndUpdate(userId, { $pull: { registeredEvents: event._id } });

    res.json({ success: true, message: `Registration cancelled for ${event.title}` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
