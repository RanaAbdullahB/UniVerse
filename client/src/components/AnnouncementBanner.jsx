// client/src/components/AnnouncementBanner.jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';

const TYPE_CONFIG = {
  info:    { bg: 'rgba(13,110,253,0.08)',  border: 'rgba(13,110,253,0.25)',  color: '#0d6efd',  icon: 'ℹ️',  label: 'Info' },
  warning: { bg: 'rgba(253,126,20,0.08)',  border: 'rgba(253,126,20,0.3)',   color: '#fd7e14',  icon: '⚠️',  label: 'Notice' },
  urgent:  { bg: 'rgba(220,53,69,0.07)',   border: 'rgba(220,53,69,0.3)',    color: '#dc3545',  icon: '🚨',  label: 'Urgent' },
  success: { bg: 'rgba(25,135,84,0.07)',   border: 'rgba(25,135,84,0.25)',   color: '#198754',  icon: '✅',  label: 'Update' },
};

export default function AnnouncementBanner({ userDepartment }) {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    api.get('/announcements')
      .then(res => setAnnouncements(res.data.data || []))
      .catch(() => {});
  }, []);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { sessionStorage.setItem('dismissed_announcements', JSON.stringify(next)); } catch {}
  };

  // Filter: hide dismissed, hide department-specific if not matching
  const visible = announcements.filter(a => {
    if (dismissed.includes(a._id)) return false;
    if (a.targetAudience === 'department' && a.targetDepartment && userDepartment) {
      return a.targetDepartment === userDepartment;
    }
    return true;
  });

  if (!visible.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
      {visible.map(a => {
        const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
        return (
          <div key={a._id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
              padding: '0.875rem 1.125rem',
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderLeft: `4px solid ${cfg.color}`,
              borderRadius: '10px',
              animation: 'slideDown 0.25s ease',
            }}>

            <span style={{ fontSize: '1.15rem', lineHeight: 1, flexShrink: 0, marginTop: '0.1rem' }}>{cfg.icon}</span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.07em', background: `${cfg.color}18`, padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                  {cfg.label}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.55 }}>{a.message}</p>
              {a.expiresAt && (
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ⏳ Expires {new Date(a.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            <button onClick={() => dismiss(a._id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', padding: '0', lineHeight: 1, flexShrink: 0, opacity: 0.6, transition: 'opacity 0.15s' }}
              title="Dismiss"
              onMouseEnter={e => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={e => (e.currentTarget.style.opacity = 0.6)}>
              ×
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
