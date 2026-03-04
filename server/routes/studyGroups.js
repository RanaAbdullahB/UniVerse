const express = require('express');
const StudyGroup = require('../models/StudyGroup');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/study-groups/my-groups
// @access  Private
router.get('/my-groups', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('joinedStudyGroups');
    res.json({ success: true, groups: user.joinedStudyGroups });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/study-groups
// @access  Private
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { department, isOnline, search } = req.query;
    const filter = {};

    if (department) filter.department = { $regex: department, $options: 'i' };
    if (isOnline !== undefined) filter.isOnline = isOnline === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
      ];
    }

    const groups = await StudyGroup.find(filter)
      .populate('creator', 'name studentId department profilePhoto')
      .populate('members', 'name studentId')
      .sort({ createdAt: -1 });

    const groupsWithStatus = groups.map((group) => {
      const obj = group.toJSON();
      obj.isMember = group.members.some((m) => m._id.toString() === req.user._id.toString());
      obj.isCreator = group.creator._id.toString() === req.user._id.toString();
      return obj;
    });

    res.json({ success: true, count: groups.length, groups: groupsWithStatus });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/study-groups/:id
// @access  Private
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('creator', 'name studentId department profilePhoto')
      .populate('members', 'name studentId department profilePhoto');

    if (!group) return res.status(404).json({ success: false, message: 'Study group not found' });

    const obj = group.toJSON();
    obj.isMember = group.members.some((m) => m._id.toString() === req.user._id.toString());
    obj.isCreator = group.creator._id.toString() === req.user._id.toString();

    res.json({ success: true, group: obj });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/study-groups
// @access  Private
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const groupData = {
      ...req.body,
      creator: req.user._id,
      members: [req.user._id],
    };

    const group = await StudyGroup.create(groupData);

    // Add to user's joined groups
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { joinedStudyGroups: group._id } });

    const populated = await StudyGroup.findById(group._id).populate('creator', 'name studentId');

    res.status(201).json({ success: true, message: 'Study group created successfully', group: populated });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/study-groups/:id/join
// @access  Private
router.post('/:id/join', authMiddleware, async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found' });

    if (group.groupType === 'Invite-Only') {
      return res.status(403).json({ success: false, message: 'This group is invite-only' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'This group is full' });
    }

    const userId = req.user._id;
    if (group.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are already a member of this group' });
    }

    group.members.push(userId);
    await group.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { joinedStudyGroups: group._id } });

    res.json({ success: true, message: `Joined ${group.name}` });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/study-groups/:id/leave
// @access  Private
router.post('/:id/leave', authMiddleware, async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found' });

    const userId = req.user._id;

    if (group.creator.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Creators cannot leave their group. Please delete the group instead.',
      });
    }

    if (!group.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are not a member of this group' });
    }

    group.members = group.members.filter((m) => m.toString() !== userId.toString());
    await group.save();

    await User.findByIdAndUpdate(userId, { $pull: { joinedStudyGroups: group._id } });

    res.json({ success: true, message: `Left ${group.name}` });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/study-groups/:id
// @access  Private (creator only)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found' });

    if (group.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the group creator can delete this group' });
    }

    // Remove from all members' joinedStudyGroups
    await User.updateMany({ joinedStudyGroups: group._id }, { $pull: { joinedStudyGroups: group._id } });

    await group.deleteOne();

    res.json({ success: true, message: 'Study group deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
