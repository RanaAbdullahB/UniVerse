/**
 * PushSubscription.js
 * Place at: server/models/PushSubscription.js
 *
 * Stores each browser's Web Push subscription object per user.
 * One user can have multiple subscriptions (phone + laptop etc.)
 */

const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true
    },
    // The full PushSubscription JSON object from the browser
    // { endpoint, keys: { p256dh, auth } }
    subscription: {
      type:     Object,
      required: true
    },
    // Unique identifier — the endpoint URL is unique per subscription
    endpoint: {
      type:   String,
      unique: true,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);