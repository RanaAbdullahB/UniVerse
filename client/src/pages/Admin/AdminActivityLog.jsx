// client/src/pages/admin/AdminActivityLog.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { PageLoader, InlineLoader } from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const ACTION_CONFIG = {
  CREATE:    { color: '#198754', bg: 'rgba(25,135,84,0.08)',   border: 'rgba(25,135,84,0.2)',   icon: '➕', label: 'Created' },
  UPDATE:    { color: '#0d6efd', bg: 'rgba(13,110,253,0.08)',  border: 'rgba(13,110,253,0.2)',  icon: '✏️', label: 'Updated' },
  DELETE:    { color: '#dc3545', bg: 'rgba(220,53,69,0.08)',   border: 'rgba(220,53,69,0.2)',   icon: '🗑️', label: 'Deleted' },
  PROMOTE:   { color: '#6f42c1', bg: 'rgba(111,66,193,0.08)', border: 'rgba(111,66,193,0.2)',  icon: '⬆️', label: 'Promoted' },
  DEMOTE:    { color: '#fd7e14', bg: 'rgba(253,126,20,0.08)',  border: 'rgba(253,126,20,0.2)',  icon: '⬇️', label: 'Demoted' },
  BROADCAST: { color: '#0dcaf0', bg: 'rgba(13,202,240,0.08)',  border: 'rgba(13,202,240,0.2)',  icon: '📢', label: 'Announced' },
};

const TARGET_ICONS = { User: '👤', Club: '🏛️', Event: '📅', StudyGroup: '📚', Announcement: '📢' };

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminActivityLog() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filterAction, setFilterAction] = useState('');
  const [filterTarget, setFilterTarget] = useState('');

  const fetchLogs = useCallback(async (p = 1, append = false) => {
    try {
      p === 1 && !append ? setLoading(true) : setLoadingMore(true);
      const params = new URLSearchParams({ page: p, limit: 50 });
      if (filterAction) params.set('action', filterAction);
      if (filterTarget) params.set('targetType', filterTarget);

      const res = await api.get(`/admin/activity-log?${params}`);
      const newLogs = res.data.data || [];
      setLogs(prev => append ? [...prev, ...newLogs] : newLogs);
      setPagination(res.data.pagination);
      setPage(p);
    } catch {
      showToast('Failed to load activity log', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterAction, filterTarget, showToast]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const loadMore = () => { if (pagination && page < pagination.pages) fetchLogs(page + 1, true); };

  // Group logs by date
  const grouped = logs.reduce((acc, log) => {
    const dateKey = new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  const summaryStats = {
    total: pagination?.total || logs.length,
    creates: logs.filter(l => l.action === 'CREATE').length,
    deletes: logs.filter(l => l.action === 'DELETE').length,
    today: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Actions', value: summaryStats.total, color: 'var(--blue-primary)', bg: 'rgba(13,110,253,0.08)', icon: '📋' },
          { label: 'Today', value: summaryStats.today, color: 'var(--dark-accent)', bg: 'rgba(29,47,111,0.08)', icon: '📅' },
          { label: 'Created', value: summaryStats.creates, color: 'var(--success)', bg: 'rgba(25,135,84,0.08)', icon: '➕' },
          { label: 'Deleted', value: summaryStats.deletes, color: 'var(--error)', bg: 'rgba(220,53,69,0.08)', icon: '🗑️' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={selectStyle}>
          <option value="">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <select value={filterTarget} onChange={e => setFilterTarget(e.target.value)} style={selectStyle}>
          <option value="">All Resources</option>
          {Object.keys(TARGET_ICONS).map(t => (
            <option key={t} value={t}>{TARGET_ICONS[t]} {t}</option>
          ))}
        </select>
        <button onClick={() => fetchLogs(1)}
          style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-body)', fontWeight: 500 }}>
          🔄 Refresh
        </button>
        {pagination && (
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing {logs.length} of {pagination.total} entries
          </span>
        )}
      </div>

      {/* Log entries grouped by date */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No activity recorded yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>Actions taken by admins will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date}>
              {/* Date divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-page)', padding: '0.2rem 0.875rem', borderRadius: '20px', border: '1px solid var(--border)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {date}
                </span>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
              </div>

              {/* Log cards for this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dateLogs.map((log, i) => {
                  const ac = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE;
                  return (
                    <div key={log._id || i}
                      style={{ background: '#fff', borderRadius: '10px', border: '1px solid var(--border)', padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(1,8,24,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                      {/* Action badge */}
                      <div style={{ width: 38, height: 38, borderRadius: '10px', background: ac.bg, border: `1px solid ${ac.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                        {ac.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {log.adminName || 'Admin'}
                          </span>
                          <span style={{ background: ac.bg, color: ac.color, padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {ac.label}
                          </span>
                          {log.targetType && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              {TARGET_ICONS[log.targetType] || ''} {log.targetType}
                            </span>
                          )}
                          {log.targetName && (
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--dark-primary)', background: 'var(--bg-page)', padding: '0.1rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{log.targetName}"
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{log.details}</div>
                        )}
                        {log.adminEmail && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{log.adminEmail}</div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {timeAgo(log.createdAt)}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {pagination && page < pagination.pages && (
            <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
              <button onClick={loadMore} disabled={loadingMore}
                style={{ padding: '0.65rem 2rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: loadingMore ? 'not-allowed' : 'pointer', fontWeight: 500, color: 'var(--text-body)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {loadingMore ? <><InlineLoader /> Loading...</> : `Load more (${pagination.total - logs.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const selectStyle = { padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' };