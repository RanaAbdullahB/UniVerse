/**
 * CheckIn.jsx — Student QR check-in landing page
 * Place at: client/src/pages/CheckIn.jsx
 *
 * This is the page that opens when a student scans the event QR code.
 * Route: /checkin/:eventId/:token
 * Works whether or not the student is already logged in.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function CheckIn() {
  const { eventId, token } = useParams();
  const { user }           = useAuth();
  const navigate           = useNavigate();

  const [event,       setEvent]       = useState(null);
  const [status,      setStatus]      = useState('loading'); // loading | ready | success | already | error | invalid
  const [message,     setMessage]     = useState('');
  const [checkedInAt, setCheckedInAt] = useState(null);
  const [loading,     setLoading]     = useState(false);

  // ── Verify the QR token and load event info ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/checkin/${eventId}/verify/${token}`);
        if (data.success) {
          setEvent(data.event);
          setStatus(user ? 'ready' : 'login');
        } else {
          setStatus('invalid');
        }
      } catch {
        setStatus('invalid');
      }
    })();
  }, [eventId, token, user]);

  // ── Handle check-in ──────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!user) {
      // Save intended check-in URL and redirect to login
      sessionStorage.setItem('checkin_redirect', `/checkin/${eventId}/${token}`);
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/api/checkin/${eventId}`, { token });
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      }
    } catch (err) {
      const res = err.response?.data;
      if (err.response?.status === 409) {
        setStatus('already');
        setCheckedInAt(res?.checkedInAt);
      } else {
        setStatus('error');
        setMessage(res?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Redirect to login and come back after ────────────────────────────────
  useEffect(() => {
    if (user && status === 'login') setStatus('ready');
    // If came back from login with a saved redirect
    const saved = sessionStorage.getItem('checkin_redirect');
    if (user && saved && saved === `/checkin/${eventId}/${token}`) {
      sessionStorage.removeItem('checkin_redirect');
      setStatus('ready');
    }
  }, [user]);

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Card */}
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoRow}>
          <img src="/lgulogo.png" alt="LGU" style={styles.logo} />
          <span style={styles.logoText}>UniVerse</span>
        </div>

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div style={styles.centerContent}>
            <div style={styles.spinner} />
            <p style={styles.hint}>Verifying QR code…</p>
          </div>
        )}

        {/* ── Invalid QR ── */}
        {status === 'invalid' && (
          <div style={styles.centerContent}>
            <div style={styles.iconCircle('#fee2e2')}>❌</div>
            <h2 style={styles.heading}>Invalid QR Code</h2>
            <p style={styles.hint}>This QR code is not valid or has expired. Please scan again.</p>
          </div>
        )}

        {/* ── Ready to check in ── */}
        {(status === 'ready' || status === 'login') && event && (
          <>
            <div style={styles.eventBadge}>{event.eventType}</div>
            <h2 style={styles.eventTitle}>{event.title}</h2>
            <div style={styles.eventMeta}>
              <div style={styles.metaItem}>📅 {formatDate(event.date)}</div>
              {event.time  && <div style={styles.metaItem}>🕐 {event.time}</div>}
              {event.venue && <div style={styles.metaItem}>📍 {event.venue}</div>}
            </div>

            {user ? (
              <>
                <div style={styles.userPill}>
                  <span style={styles.userDot}>👤</span>
                  Checking in as <strong style={{ marginLeft: 4 }}>{user.name}</strong>
                </div>
                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  style={{ ...styles.checkInBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Checking in…' : '✅ Check In Now'}
                </button>
              </>
            ) : (
              <>
                <p style={{ ...styles.hint, marginBottom: 16 }}>
                  You need to be logged in to check in to this event.
                </p>
                <button onClick={handleCheckIn} style={styles.checkInBtn}>
                  🔐 Log in to Check In
                </button>
              </>
            )}
          </>
        )}

        {/* ── Success ── */}
        {status === 'success' && event && (
          <div style={styles.centerContent}>
            <div style={styles.iconCircle('#dcfce7')}>✅</div>
            <h2 style={{ ...styles.heading, color: 'var(--success)' }}>Checked In!</h2>
            <p style={styles.eventTitle}>{event.title}</p>
            <p style={styles.hint}>{message}</p>
            <p style={{ ...styles.hint, marginTop: 4 }}>
              Welcome, <strong>{user?.name}</strong>. Enjoy the event!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={styles.secondaryBtn}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* ── Already checked in ── */}
        {status === 'already' && event && (
          <div style={styles.centerContent}>
            <div style={styles.iconCircle('#fef9c3')}>⚠️</div>
            <h2 style={styles.heading}>Already Checked In</h2>
            <p style={styles.eventTitle}>{event.title}</p>
            <p style={styles.hint}>
              You already checked in to this event
              {checkedInAt ? ` at ${new Date(checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={styles.secondaryBtn}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div style={styles.centerContent}>
            <div style={styles.iconCircle('#fee2e2')}>⚠️</div>
            <h2 style={styles.heading}>Check-in Failed</h2>
            <p style={styles.hint}>{message}</p>
            <button onClick={handleCheckIn} style={styles.checkInBtn}>Try Again</button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight:       '100vh',
    background:      'var(--bg-page)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         24,
    fontFamily:      'DM Sans, sans-serif'
  },
  card: {
    background:      'var(--white)',
    borderRadius:    20,
    padding:         '36px 32px',
    maxWidth:        420,
    width:           '100%',
    boxShadow:       '0 8px 40px rgba(0,0,0,0.10)',
    textAlign:       'center'
  },
  logoRow: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             10,
    marginBottom:    28
  },
  logo: {
    width:           36,
    height:          36,
    objectFit:       'contain'
  },
  logoText: {
    fontFamily:      'Playfair Display, serif',
    fontSize:        22,
    fontWeight:      700,
    color:           'var(--dark-primary)'
  },
  centerContent: {
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    gap:             12
  },
  iconCircle: (bg) => ({
    width:           72,
    height:          72,
    borderRadius:    '50%',
    background:      bg,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        32,
    marginBottom:    4
  }),
  heading: {
    fontFamily:      'Playfair Display, serif',
    fontSize:        22,
    fontWeight:      700,
    color:           'var(--dark-primary)',
    margin:          0
  },
  eventBadge: {
    display:         'inline-block',
    background:      'var(--blue-tint)',
    color:           'var(--blue-primary)',
    borderRadius:    20,
    padding:         '3px 14px',
    fontSize:        12,
    fontWeight:      700,
    marginBottom:    12,
    letterSpacing:   0.5
  },
  eventTitle: {
    fontFamily:      'Playfair Display, serif',
    fontSize:        20,
    fontWeight:      700,
    color:           'var(--dark-primary)',
    margin:          '0 0 16px'
  },
  eventMeta: {
    display:         'flex',
    flexDirection:   'column',
    gap:             8,
    marginBottom:    24,
    padding:         '14px 18px',
    background:      'var(--bg-page)',
    borderRadius:    12,
    textAlign:       'left'
  },
  metaItem: {
    fontSize:        14,
    color:           'var(--text-body)',
    display:         'flex',
    alignItems:      'center',
    gap:             8
  },
  userPill: {
    display:         'inline-flex',
    alignItems:      'center',
    background:      'var(--blue-tint)',
    borderRadius:    20,
    padding:         '6px 16px',
    fontSize:        13,
    color:           'var(--text-body)',
    marginBottom:    20
  },
  userDot: {
    marginRight:     6
  },
  checkInBtn: {
    width:           '100%',
    padding:         '14px',
    borderRadius:    12,
    border:          'none',
    background:      'var(--blue-primary)',
    color:           '#fff',
    fontSize:        16,
    fontWeight:      700,
    cursor:          'pointer',
    fontFamily:      'DM Sans, sans-serif',
    transition:      'opacity 0.2s'
  },
  secondaryBtn: {
    marginTop:       8,
    padding:         '10px 24px',
    borderRadius:    10,
    border:          '1.5px solid var(--border)',
    background:      'transparent',
    color:           'var(--text-body)',
    fontSize:        14,
    cursor:          'pointer',
    fontFamily:      'DM Sans, sans-serif'
  },
  hint: {
    fontSize:        14,
    color:           'var(--text-muted)',
    margin:          0,
    lineHeight:      1.5
  },
  spinner: {
    width:           40,
    height:          40,
    border:          '3px solid var(--border)',
    borderTop:       '3px solid var(--blue-primary)',
    borderRadius:    '50%',
    animation:       'spin 0.8s linear infinite',
    marginBottom:    12
  }
};