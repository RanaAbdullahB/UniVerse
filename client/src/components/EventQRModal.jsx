/**
 * EventQRModal.jsx — Admin QR code modal
 * Place at: client/src/components/EventQRModal.jsx
 *
 * Shows:
 *  - QR code for the event (using qrcode.react)
 *  - Live check-in count
 *  - Full check-in attendee list
 *  - Download QR as PNG button
 *  - CSV export of check-ins
 */

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import api from '../utils/api';

export default function EventQRModal({ event, onClose }) {
  const [tab,        setTab]        = useState('qr');   // 'qr' | 'checkins'
  const [tokenData,  setTokenData]  = useState(null);
  const [checkIns,   setCheckIns]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingList,setLoadingList] = useState(false);
  const qrRef = useRef(null);

  // Load QR token on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/checkin/${event._id}/token`);
        if (data.success) setTokenData(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [event._id]);

  // Load check-ins when switching to that tab
  useEffect(() => {
    if (tab !== 'checkins') return;
    (async () => {
      setLoadingList(true);
      try {
        const { data } = await api.get(`/api/checkin/${event._id}/list`);
        if (data.success) setCheckIns(data.checkIns);
      } catch {
        // silent
      } finally {
        setLoadingList(false);
      }
    })();
  }, [tab, event._id]);

  // Download QR as PNG
  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url  = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${event.title.replace(/\s+/g, '_')}_QR.png`;
    link.click();
  };

  // Export check-ins as CSV
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Department', 'Year', 'Checked In At'];
    const rows    = checkIns.map(c => [
      c.studentName,
      c.studentEmail,
      c.studentDepartment,
      c.studentYear,
      new Date(c.checkedInAt).toLocaleString()
    ]);
    const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${event.title.replace(/\s+/g, '_')}_CheckIns.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>📲 {event.title}</h2>
            <p style={styles.sub}>QR Check-in System</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['qr', 'checkins'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tab,
                background:  tab === t ? 'var(--blue-primary)' : 'transparent',
                color:       tab === t ? '#fff' : 'var(--text-muted)',
                fontWeight:  tab === t ? 700 : 400
              }}
            >
              {t === 'qr' ? '🔲 QR Code' : `✅ Check-ins (${checkIns.length || '…'})`}
            </button>
          ))}
        </div>

        {/* ── QR Tab ── */}
        {tab === 'qr' && (
          <div style={styles.qrPanel}>
            {loading ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
                <p style={styles.hint}>Generating QR code…</p>
              </div>
            ) : tokenData ? (
              <>
                <p style={styles.hint}>
                  Students scan this with their phone camera to check in to the event.
                </p>

                {/* QR Code */}
                <div ref={qrRef} style={styles.qrWrap}>
                  <QRCode
                    value={tokenData.checkInUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src:    '/lgulogo.png',
                      height: 36,
                      width:  36,
                      excavate: true
                    }}
                  />
                </div>

                {/* URL display */}
                <div style={styles.urlBox}>
                  <span style={styles.urlText}>{tokenData.checkInUrl}</span>
                </div>

                {/* Actions */}
                <div style={styles.qrActions}>
                  <button onClick={downloadQR} style={styles.actionBtn}>
                    ⬇️ Download QR
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(tokenData.checkInUrl)}
                    style={{ ...styles.actionBtn, background: 'var(--bg-page)', color: 'var(--text-body)' }}
                  >
                    📋 Copy Link
                  </button>
                </div>

                <p style={{ ...styles.hint, marginTop: 16, fontSize: 12 }}>
                  💡 Print this QR code and display it at the event entrance.
                </p>
              </>
            ) : (
              <p style={styles.hint}>Failed to generate QR code. Please try again.</p>
            )}
          </div>
        )}

        {/* ── Check-ins Tab ── */}
        {tab === 'checkins' && (
          <div style={styles.checkinsPanel}>
            <div style={styles.checkinsHeader}>
              <div style={styles.statBox}>
                <span style={styles.statNum}>{checkIns.length}</span>
                <span style={styles.statLabel}>Checked In</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNum}>{event.registeredStudents?.length || 0}</span>
                <span style={styles.statLabel}>Registered</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNum}>
                  {event.registeredStudents?.length
                    ? Math.round((checkIns.length / event.registeredStudents.length) * 100)
                    : 0}%
                </span>
                <span style={styles.statLabel}>Attendance</span>
              </div>
              {checkIns.length > 0 && (
                <button onClick={exportCSV} style={styles.csvBtn}>
                  ⬇️ Export CSV
                </button>
              )}
            </div>

            {loadingList ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
              </div>
            ) : checkIns.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <p>No check-ins yet. Share the QR code at the event entrance.</p>
              </div>
            ) : (
              <div style={styles.list}>
                {checkIns.map((c, i) => (
                  <div key={c._id} style={styles.listItem}>
                    <div style={styles.listNum}>{i + 1}</div>
                    <div style={styles.listInfo}>
                      <div style={styles.listName}>{c.studentName}</div>
                      <div style={styles.listSub}>
                        {c.studentDepartment} · Year {c.studentYear} · {c.studentEmail}
                      </div>
                    </div>
                    <div style={styles.listTime}>
                      {new Date(c.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const overlayStyle = {
  position:        'fixed',
  inset:           0,
  background:      'rgba(0,0,0,0.55)',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  zIndex:          1000,
  padding:         16
};

const modalStyle = {
  background:      'var(--white)',
  borderRadius:    20,
  width:           '100%',
  maxWidth:        520,
  maxHeight:       '90vh',
  overflow:        'hidden',
  display:         'flex',
  flexDirection:   'column',
  boxShadow:       '0 20px 60px rgba(0,0,0,0.2)'
};

const styles = {
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    padding:        '24px 24px 0'
  },
  title: {
    fontFamily:     'Playfair Display, serif',
    fontSize:       18,
    fontWeight:     700,
    color:          'var(--dark-primary)',
    margin:         0
  },
  sub: {
    fontSize:       13,
    color:          'var(--text-muted)',
    margin:         '4px 0 0'
  },
  closeBtn: {
    background:     'none',
    border:         'none',
    fontSize:       18,
    cursor:         'pointer',
    color:          'var(--text-muted)',
    padding:        4
  },
  tabs: {
    display:        'flex',
    gap:            6,
    padding:        '16px 24px 0'
  },
  tab: {
    padding:        '7px 18px',
    borderRadius:   8,
    border:         'none',
    cursor:         'pointer',
    fontSize:       13,
    fontFamily:     'DM Sans, sans-serif',
    transition:     'all 0.15s'
  },
  qrPanel: {
    padding:        '20px 24px 24px',
    overflowY:      'auto',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            12
  },
  checkinsPanel: {
    padding:        '20px 24px 24px',
    overflowY:      'auto',
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    gap:            12
  },
  qrWrap: {
    padding:        16,
    background:     '#fff',
    borderRadius:   16,
    border:         '2px solid var(--border)',
    display:        'inline-block'
  },
  urlBox: {
    background:     'var(--bg-page)',
    borderRadius:   8,
    padding:        '8px 14px',
    width:          '100%',
    boxSizing:      'border-box'
  },
  urlText: {
    fontSize:       11,
    color:          'var(--text-muted)',
    wordBreak:      'break-all'
  },
  qrActions: {
    display:        'flex',
    gap:            10,
    width:          '100%'
  },
  actionBtn: {
    flex:           1,
    padding:        '10px',
    borderRadius:   10,
    border:         'none',
    background:     'var(--blue-primary)',
    color:          '#fff',
    fontSize:       14,
    fontWeight:     600,
    cursor:         'pointer',
    fontFamily:     'DM Sans, sans-serif'
  },
  checkinsHeader: {
    display:        'flex',
    alignItems:     'center',
    gap:            12,
    flexWrap:       'wrap'
  },
  statBox: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    background:     'var(--blue-tint)',
    borderRadius:   10,
    padding:        '8px 16px'
  },
  statNum: {
    fontWeight:     700,
    fontSize:       20,
    color:          'var(--blue-primary)'
  },
  statLabel: {
    fontSize:       11,
    color:          'var(--text-muted)'
  },
  csvBtn: {
    marginLeft:     'auto',
    padding:        '8px 14px',
    borderRadius:   8,
    border:         '1.5px solid var(--border)',
    background:     'transparent',
    fontSize:       13,
    cursor:         'pointer',
    fontFamily:     'DM Sans, sans-serif',
    color:          'var(--text-body)'
  },
  list: {
    display:        'flex',
    flexDirection:  'column',
    gap:            6
  },
  listItem: {
    display:        'flex',
    alignItems:     'center',
    gap:            12,
    padding:        '10px 14px',
    background:     'var(--bg-page)',
    borderRadius:   10
  },
  listNum: {
    width:          28,
    height:         28,
    borderRadius:   '50%',
    background:     'var(--blue-tint)',
    color:          'var(--blue-primary)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       12,
    fontWeight:     700,
    flexShrink:     0
  },
  listInfo: {
    flex:           1,
    minWidth:       0
  },
  listName: {
    fontWeight:     600,
    fontSize:       14,
    color:          'var(--text-primary)'
  },
  listSub: {
    fontSize:       12,
    color:          'var(--text-muted)',
    marginTop:      2
  },
  listTime: {
    fontSize:       12,
    color:          'var(--text-muted)',
    flexShrink:     0
  },
  centered: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    padding:        32,
    gap:            12
  },
  emptyState: {
    textAlign:      'center',
    color:          'var(--text-muted)',
    fontSize:       14,
    padding:        32
  },
  hint: {
    fontSize:       13,
    color:          'var(--text-muted)',
    textAlign:      'center',
    margin:         0,
    lineHeight:     1.5
  },
  spinner: {
    width:          36,
    height:         36,
    border:         '3px solid var(--border)',
    borderTop:      '3px solid var(--blue-primary)',
    borderRadius:   '50%',
    animation:      'spin 0.8s linear infinite'
  }
};