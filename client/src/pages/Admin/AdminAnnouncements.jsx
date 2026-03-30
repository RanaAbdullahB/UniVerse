// client/src/pages/admin/AdminAnnouncements.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/LoadingSpinner';

const TYPE_CONFIG = {
  info:    { bg: 'rgba(13,110,253,0.08)', border: 'rgba(13,110,253,0.2)', color: '#0d6efd', icon: 'ℹ️',  label: 'Info' },
  warning: { bg: 'rgba(253,126,20,0.08)', border: 'rgba(253,126,20,0.25)', color: '#fd7e14', icon: '⚠️',  label: 'Warning' },
  urgent:  { bg: 'rgba(220,53,69,0.08)',  border: 'rgba(220,53,69,0.25)',  color: '#dc3545', icon: '🚨',  label: 'Urgent' },
  success: { bg: 'rgba(25,135,84,0.08)',  border: 'rgba(25,135,84,0.2)',   color: '#198754', icon: '✅',  label: 'Success' },
};

const EMPTY_FORM = {
  title: '', message: '', type: 'info',
  targetAudience: 'all', targetDepartment: '',
  expiresAt: '', sendEmail: false, isActive: true,
};

const DEPARTMENTS = [
  'Computer Science', 'Software Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Mathematics', 'Physics', 'English', 'Management Sciences',
];

export default function AdminAnnouncements() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data.data || []);
    } catch {
      showToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditingId(a._id);
    setForm({
      title: a.title,
      message: a.message,
      type: a.type,
      targetAudience: a.targetAudience,
      targetDepartment: a.targetDepartment || '',
      expiresAt: a.expiresAt ? a.expiresAt.split('T')[0] : '',
      sendEmail: false,
      isActive: a.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt || null,
        targetDepartment: form.targetAudience === 'department' ? form.targetDepartment : null,
      };

      if (editingId) {
        const res = await api.put(`/admin/announcements/${editingId}`, payload);
        setAnnouncements(prev => prev.map(a => a._id === editingId ? res.data.data : a));
        showToast('Announcement updated', 'success');
      } else {
        const res = await api.post('/admin/announcements', payload);
        setAnnouncements(prev => [res.data.data, ...prev]);
        const emailMsg = res.data.emailSent ? ' + email sent to students' : '';
        showToast(`Announcement created${emailMsg}`, 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save announcement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/announcements/${deleteId}`);
      setAnnouncements(prev => prev.filter(a => a._id !== deleteId));
      showToast('Announcement deleted', 'success');
      setDeleteId(null);
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (a) => {
    try {
      const res = await api.put(`/admin/announcements/${a._id}`, { ...a, isActive: !a.isActive });
      setAnnouncements(prev => prev.map(x => x._id === a._id ? res.data.data : x));
      showToast(`Announcement ${!a.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const now = new Date();
  const filtered = announcements.filter(a => {
    const isExpired = a.expiresAt && new Date(a.expiresAt) < now;
    const isLive = a.isActive && !isExpired;
    if (filterType && a.type !== filterType) return false;
    if (filterStatus === 'active' && !isLive) return false;
    if (filterStatus === 'inactive' && isLive) return false;
    return true;
  });

  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > now)).length,
    urgent: announcements.filter(a => a.type === 'urgent' && a.isActive).length,
    emailsSent: announcements.filter(a => a.emailSent).length,
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--blue-primary)', bg: 'rgba(13,110,253,0.08)', icon: '📢' },
          { label: 'Active', value: stats.active, color: 'var(--success)', bg: 'rgba(25,135,84,0.08)', icon: '🟢' },
          { label: 'Urgent', value: stats.urgent, color: 'var(--error)', bg: 'rgba(220,53,69,0.08)', icon: '🚨' },
          { label: 'Emails Sent', value: stats.emailsSent, color: '#fd7e14', bg: 'rgba(253,126,20,0.08)', icon: '📧' },
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

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">All Types</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="urgent">Urgent</option>
          <option value="success">Success</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive / Expired</option>
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate}
          style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
          + New Announcement
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📢</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No announcements found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map(a => {
            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
            const isExpired = a.expiresAt && new Date(a.expiresAt) < now;
            const isLive = a.isActive && !isExpired;

            return (
              <div key={a._id} style={{
                background: '#fff', borderRadius: '12px',
                border: `1px solid ${isLive ? cfg.border : 'var(--border)'}`,
                borderLeft: `4px solid ${isLive ? cfg.color : 'var(--border)'}`,
                padding: '1.25rem 1.375rem',
                opacity: isLive ? 1 : 0.65,
                transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 3px 16px rgba(1,8,24,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{cfg.icon}</span>

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      {!isLive && (
                        <span style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--border)' }}>
                          {isExpired ? '⏰ Expired' : '⏸ Inactive'}
                        </span>
                      )}
                      {a.targetAudience === 'department' && a.targetDepartment && (
                        <span style={{ background: 'var(--blue-tint)', color: 'var(--dark-accent)', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600 }}>
                          🏛️ {a.targetDepartment}
                        </span>
                      )}
                      {a.emailSent && (
                        <span style={{ background: 'rgba(25,135,84,0.08)', color: 'var(--success)', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600 }}>
                          📧 Email Sent
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.975rem', fontWeight: 700, color: 'var(--dark-primary)', fontFamily: 'Playfair Display, serif' }}>
                      {a.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.835rem', color: 'var(--text-body)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {a.message.length > 200 ? a.message.slice(0, 200) + '…' : a.message}
                    </p>

                    <div style={{ marginTop: '0.625rem', display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>📅 {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {a.createdBy?.name && <span>👤 {a.createdBy.name}</span>}
                      {a.expiresAt && <span>⏳ Expires {new Date(a.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Toggle active */}
                    <button onClick={() => toggleActive(a)}
                      style={{ padding: '0.4rem 0.75rem', borderRadius: '7px', border: `1.5px solid ${isLive ? 'rgba(25,135,84,0.3)' : 'var(--border)'}`, background: isLive ? 'rgba(25,135,84,0.08)' : 'var(--bg-page)', color: isLive ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}>
                      {isLive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openEdit(a)}
                      style={{ padding: '0.4rem 0.75rem', borderRadius: '7px', border: '1.5px solid var(--border)', background: '#fff', color: 'var(--text-body)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(a._id)}
                      style={{ padding: '0.4rem 0.75rem', borderRadius: '7px', border: '1.5px solid rgba(220,53,69,0.25)', background: 'rgba(220,53,69,0.06)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.06)'; e.currentTarget.style.color = 'var(--error)'; }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !saving && setModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: '1.1rem' }}>
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => !saving && setModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <FormField label="Title *">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Exam Schedule Released" style={inputStyle} />
              </FormField>

              <FormField label="Message *">
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Write your announcement message here..." rows={5}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }} />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Type">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                    <option value="info">ℹ️ Info</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="urgent">🚨 Urgent</option>
                    <option value="success">✅ Success</option>
                  </select>
                </FormField>

                <FormField label="Target Audience">
                  <select value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} style={inputStyle}>
                    <option value="all">All Students</option>
                    <option value="department">Specific Department</option>
                  </select>
                </FormField>
              </div>

              {form.targetAudience === 'department' && (
                <FormField label="Target Department">
                  <select value={form.targetDepartment} onChange={e => setForm(f => ({ ...f, targetDepartment: e.target.value }))} style={inputStyle}>
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
              )}

              <FormField label="Expires At (optional)">
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} style={inputStyle} />
              </FormField>

              {editingId && (
                <FormField label="Status">
                  <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))} style={inputStyle}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </FormField>
              )}

              {/* Email blast toggle */}
              {!editingId && (
                <div style={{ background: 'var(--bg-page)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div
                      onClick={() => setForm(f => ({ ...f, sendEmail: !f.sendEmail }))}
                      style={{
                        width: 44, height: 24, borderRadius: '12px', position: 'relative',
                        background: form.sendEmail ? 'var(--blue-primary)' : 'var(--border)',
                        transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, left: form.sendEmail ? 23 : 3,
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Send Email to Students</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {form.targetAudience === 'department' && form.targetDepartment
                          ? `Email will go to all ${form.targetDepartment} students`
                          : 'Email will be sent to all registered students'}
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--bg-page)' }}>
              <button onClick={() => !saving && setModalOpen(false)} disabled={saving}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500, color: 'var(--text-body)', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingId ? 'Update' : form.sendEmail ? '📢 Post + Send Email' : '📢 Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !deleting && setDeleteId(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Delete Announcement?</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              This announcement will be removed from the student portal immediately.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--error)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.375rem' }}>{label}</label>
      {children}
    </div>
  );
}

const selectStyle = { padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', width: '100%' };
const inputStyle  = { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)', background: '#fff', boxSizing: 'border-box' };