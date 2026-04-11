/**
 * NotificationToggle.jsx
 * Place at: client/src/components/NotificationToggle.jsx
 *
 * Drop this anywhere you want a push notification on/off toggle.
 * Already used inside Profile.jsx — but can be placed in Navbar or Settings too.
 */

import { useState, useEffect } from 'react';
import {
  isPushSupported,
  getPermissionStatus,
  isPushEnabled,
  enablePushNotifications,
  disablePushNotifications
} from '../utils/pushNotifications';

export default function NotificationToggle() {
  const [supported,  setSupported]  = useState(false);
  const [enabled,    setEnabled]    = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading,    setLoading]    = useState(false);
  const [status,     setStatus]     = useState(''); // feedback message

  useEffect(() => {
    const supported = isPushSupported();
    setSupported(supported);
    if (!supported) return;

    setPermission(getPermissionStatus());
    isPushEnabled().then(setEnabled);
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    setStatus('');

    if (enabled) {
      await disablePushNotifications();
      setEnabled(false);
      setStatus('Notifications disabled.');
    } else {
      const result = await enablePushNotifications();
      if (result === 'granted') {
        setEnabled(true);
        setPermission('granted');
        setStatus('Notifications enabled! You\'ll get alerts for messages, announcements, and events.');
      } else if (result === 'denied') {
        setPermission('denied');
        setStatus('Permission denied. Please allow notifications in your browser settings.');
      } else if (result === 'unsupported') {
        setStatus('Your browser does not support push notifications.');
      } else {
        setStatus('Something went wrong. Please try again.');
      }
    }

    setLoading(false);
  };

  if (!supported) {
    return (
      <div style={styles.row}>
        <div>
          <div style={styles.label}>🔔 Push Notifications</div>
          <div style={styles.sub}>Not supported in this browser.</div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div style={styles.row}>
        <div>
          <div style={styles.label}>🔔 Push Notifications</div>
          <div style={styles.sub}>
            Blocked by browser. To enable, click the 🔒 icon in your address bar → Notifications → Allow.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.row}>
        <div>
          <div style={styles.label}>🔔 Push Notifications</div>
          <div style={styles.sub}>
            {enabled
              ? 'You\'ll receive alerts for DMs, announcements, and new events.'
              : 'Enable to get notified even when UniVerse is not open.'}
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            ...styles.toggle,
            background: enabled ? 'var(--blue-primary)' : 'var(--border)',
          }}
          aria-label={enabled ? 'Disable notifications' : 'Enable notifications'}
        >
          <span style={{
            ...styles.thumb,
            transform: enabled ? 'translateX(22px)' : 'translateX(2px)'
          }} />
        </button>
      </div>

      {status && (
        <p style={{
          ...styles.feedback,
          color: enabled ? 'var(--success)' : 'var(--text-muted)'
        }}>
          {status}
        </p>
      )}
    </div>
  );
}

const styles = {
  row: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            16,
    padding:        '16px 0',
    borderTop:      '1px solid var(--border)'
  },
  label: {
    fontWeight:  600,
    fontSize:    15,
    color:       'var(--text-primary)',
    marginBottom: 4
  },
  sub: {
    fontSize:   13,
    color:      'var(--text-muted)',
    maxWidth:   340,
    lineHeight: 1.4
  },
  toggle: {
    position:   'relative',
    width:       48,
    height:      26,
    borderRadius: 13,
    border:      'none',
    cursor:      'pointer',
    transition:  'background 0.25s',
    flexShrink:   0,
    padding:      0
  },
  thumb: {
    position:   'absolute',
    top:         2,
    width:       22,
    height:      22,
    borderRadius: '50%',
    background:  '#fff',
    boxShadow:   '0 1px 4px rgba(0,0,0,0.2)',
    transition:  'transform 0.25s'
  },
  feedback: {
    fontSize:   13,
    marginTop:   6,
    padding:    '0 2px'
  }
};