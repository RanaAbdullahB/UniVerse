/**
 * pushNotifications.js — UniVerse client push helper
 * Place at: client/src/utils/pushNotifications.js
 *
 * Handles:
 *  - Registering the service worker
 *  - Requesting notification permission
 *  - Subscribing the browser to Web Push
 *  - Sending the subscription to the server
 *  - Unsubscribing
 */

import api from './api';

// Your VAPID public key — set this after running `npm run generate-vapid` on the server.
// Copy the public key printed in the console into your .env as VAPID_PUBLIC_KEY,
// then paste it here too (it is safe to expose the PUBLIC key on the client).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert a base64 VAPID public key string to a Uint8Array
 * (required by PushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String) {
  const padding   = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64    = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData   = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get the current notification permission status
 * Returns: 'granted' | 'denied' | 'default'
 */
export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Register the service worker (call once on app load)
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('[Push] Service worker registration failed:', err);
    return null;
  }
}

/**
 * Request permission + subscribe to Web Push + send subscription to server
 * Call this when the user clicks "Enable Notifications"
 * Returns: 'granted' | 'denied' | 'unsupported' | 'error'
 */
export async function enablePushNotifications() {
  if (!isPushSupported()) return 'unsupported';
  if (!VAPID_PUBLIC_KEY)  {
    console.error('[Push] VITE_VAPID_PUBLIC_KEY is not set in .env');
    return 'error';
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    // 2. Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // 4. Send subscription to server
    await api.post('/api/push/subscribe', { subscription });

    return 'granted';
  } catch (err) {
    console.error('[Push] Failed to enable push:', err);
    return 'error';
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function disablePushNotifications() {
  if (!isPushSupported()) return;
  try {
    const registration  = await navigator.serviceWorker.ready;
    const subscription  = await registration.pushManager.getSubscription();
    if (!subscription)  return;

    // Notify server first
    await api.delete('/api/push/subscribe', {
      data: { endpoint: subscription.endpoint }
    });

    // Then unsubscribe locally
    await subscription.unsubscribe();
  } catch (err) {
    console.error('[Push] Failed to disable push:', err);
  }
}

/**
 * Returns true if the user is currently subscribed
 */
export async function isPushEnabled() {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}