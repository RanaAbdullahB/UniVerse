/**
 * sendPush.js — UniVerse server push helper
 * Place at: server/utils/sendPush.js
 *
 * Reusable function to send a Web Push notification to one or more users.
 * Import and call this from any route that should trigger a notification.
 */

const webpush          = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID once (called automatically on first import)
webpush.setVapidDetails(
  `mailto:${process.env.EMAIL_USER || 'admin@lgu.edu.pk'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to one or more users.
 *
 * @param {string | string[]} userIds   — Single userId or array of userIds
 * @param {Object}            payload   — Notification content
 * @param {string}            payload.title
 * @param {string}            payload.body
 * @param {string}           [payload.icon]    default: /lgulogo.png
 * @param {string}           [payload.url]     URL to open on click
 * @param {string}           [payload.tag]     Collapses duplicate notifications
 */
async function sendPush(userIds, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    // VAPID keys not configured — skip silently
    return;
  }

  const ids = Array.isArray(userIds) ? userIds : [userIds];
  if (ids.length === 0) return;

  // Find all subscriptions for these users
  const subs = await PushSubscription.find({ user: { $in: ids } });
  if (subs.length === 0) return;

  const notification = JSON.stringify({
    title: payload.title || 'UniVerse',
    body:  payload.body  || '',
    icon:  payload.icon  || '/lgulogo.png',
    badge: '/lgulogo.png',
    tag:   payload.tag   || undefined,
    url:   payload.url   || '/',
    data:  payload.data  || {}
  });

  // Fire all pushes in parallel; remove stale subscriptions on 410/404
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(sub.subscription, notification).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription is expired or invalid — clean it up
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      })
    )
  );

  return results;
}

/**
 * Send to ALL students (e.g. for announcements / new events)
 */
async function sendPushToAllStudents(payload) {
  const User = require('../models/User');
  const students = await User.find({ role: 'student' }).select('_id');
  const ids      = students.map(s => s._id);
  return sendPush(ids, payload);
}

module.exports = { sendPush, sendPushToAllStudents };