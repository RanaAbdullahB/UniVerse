/**
 * push.js — Push subscription routes
 * Place at: server/routes/push.js
 */

const express          = require('express');
const router           = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const PushSubscription = require('../models/PushSubscription');

// ─── POST /api/push/subscribe ─────────────────────────────────────────────────
// Save a browser push subscription for the logged-in user
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }

    // Upsert — update if endpoint exists, insert if new
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { user: req.user._id, subscription, endpoint: subscription.endpoint },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Subscribed to push notifications' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/push/subscribe ───────────────────────────────────────────────
// Remove a push subscription (when user disables notifications)
router.delete('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'endpoint is required' });
    }

    await PushSubscription.deleteOne({ endpoint, user: req.user._id });
    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/push/status ─────────────────────────────────────────────────────
// Check if the current user has any active subscriptions
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const count = await PushSubscription.countDocuments({ user: req.user._id });
    res.json({ success: true, subscribed: count > 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;