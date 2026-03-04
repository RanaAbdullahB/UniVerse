const express = require('express');
const Club = require('../models/Club');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/clubs/my-clubs
// @access  Private
router.get('/my-clubs', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('joinedClubs');
    res.json({ success: true, clubs: user.joinedClubs });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/clubs
// @access  Private
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const clubs = await Club.find(filter).sort({ createdAt: -1 });

    // Add isMember flag for current user
    const clubsWithMembership = clubs.map((club) => {
      const obj = club.toJSON();
      obj.isMember = club.members.some((m) => m.toString() === req.user._id.toString());
      return obj;
    });

    res.json({ success: true, count: clubs.length, clubs: clubsWithMembership });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/clubs/:id
// @access  Private
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id).populate('members', 'name studentId department profilePhoto');
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    const obj = club.toJSON();
    obj.isMember = club.members.some((m) => m._id.toString() === req.user._id.toString());

    res.json({ success: true, club: obj });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/clubs
// @access  Admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const club = await Club.create(req.body);
    res.status(201).json({ success: true, message: 'Club created', club });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/clubs/:id/join
// @access  Private
router.post('/:id/join', authMiddleware, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    const userId = req.user._id;
    if (club.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are already a member of this club' });
    }

    club.members.push(userId);
    await club.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { joinedClubs: club._id } });

    res.json({ success: true, message: `Successfully joined ${club.name}`, totalMembers: club.members.length });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/clubs/:id/leave
// @access  Private
router.post('/:id/leave', authMiddleware, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    const userId = req.user._id;
    if (!club.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are not a member of this club' });
    }

    club.members = club.members.filter((m) => m.toString() !== userId.toString());
    await club.save();

    await User.findByIdAndUpdate(userId, { $pull: { joinedClubs: club._id } });

    res.json({ success: true, message: `Successfully left ${club.name}`, totalMembers: club.members.length });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/clubs/:id
// @access  Admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, message: 'Club updated', club });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
