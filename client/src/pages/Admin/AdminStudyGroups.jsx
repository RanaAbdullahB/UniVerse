// client/src/pages/admin/AdminStudyGroups.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/LoadingSpinner';
import { exportStudyGroups } from '../../utils/csvExport';

const SEMESTERS = ['Fall', 'Spring', 'Summer'];
const DEPARTMENTS = [
  'Computer Science', 'Software Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Mathematics', 'Physics', 'English', 'Management Sciences',
];

const EMPTY_FORM = {
  name: '', subject: '', description: '', course: '', department: '',
  semester: 'Fall', maxMembers: 10, isOnline: false, groupType: 'Open',
  meetingSchedule: { day: '', time: '', location: '' },
};

export default function AdminStudyGroups() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [membersModal, setMembersModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/study-groups');
      setGroups(res.data.data);
    } catch {
      showToast('Failed to load study groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openEdit = (group) => {
    setEditModal(group);
    setForm({
      name: group.name || '',
      subject: group.subject || '',
      description: group.description || '',
      course: group.course || '',
      department: group.department || '',
      semester: group.semester || 'Fall',
      maxMembers: group.maxMembers || 10,
      isOnline: group.isOnline || false,
      groupType: group.groupType || 'Open',
      meetingSchedule: group.meetingSchedule || { day: '', time: '', location: '' },
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim()) {
      showToast('Name and subject are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/admin/study-groups/${editModal._id}`, form);
      setGroups(prev => prev.map(g => g._id === editModal._id ? { ...g, ...res.data.data } : g));
      showToast('Study group updated', 'success');
      setEditModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/study-groups/${deleteId}`);
      showToast('Study group deleted', 'success');
      setGroups(prev => prev.filter(g => g._id !== deleteId));
      setDeleteId(null);
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const departments = [...new Set(groups.map(g => g.department).filter(Boolean))].sort();
  const filtered = groups.filter(g => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || g.name.toLowerCase().includes(q) || g.subject.toLowerCase().includes(q) || (g.department && g.department.toLowerCase().includes(q)) || (g.creator?.name && g.creator.name.toLowerCase().includes(q));
    const matchDept = !filterDept || g.department === filterDept;
    const matchType = !filterType || g.groupType === filterType;
    const matchMode = filterMode === '' ? true : filterMode === 'online' ? g.isOnline : !g.isOnline;
    return matchSearch && matchDept && matchType && matchMode;
  });

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Groups',  value: groups.length,                                                color: 'var(--blue-primary)', bg: 'rgba(13,110,253,0.08)', icon: '📚' },
    { label: 'Open Groups',   value: groups.filter(g => g.groupType === 'Open').length,            color: 'var(--success)',      bg: 'rgba(25,135,84,0.08)',  icon: '🔓' },
    { label: 'Online Groups', value: groups.filter(g => g.isOnline).length,                        color: 'var(--dark-accent)',  bg: 'rgba(29,47,111,0.08)',  icon: '🌐' },
    { label: 'Total Members', value: groups.reduce((a, g) => a + (g.members?.length || 0), 0),    color: '#fd7e14',             bg: 'rgba(253,126,20,0.08)', icon: '👤' },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: card.color, lineHeight: 1.1, fontFamily: 'Playfair Display, serif' }}>{card.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Export */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by name, subject, department, creator..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: '1 1 240px', padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', background: '#fff', color: 'var(--text-primary)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--blue-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={selectStyle}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">All Types</option>
          <option value="Open">Open</option>
          <option value="Invite-Only">Invite-Only</option>
        </select>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={selectStyle}>
          <option value="">All Modes</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <button onClick={() => exportStudyGroups(filtered)}
          style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-body)', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
          ⬇️ Export CSV
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.875rem' }}>{filtered.length} group{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No study groups found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border)' }}>
                  {['Group Info','Subject','Department','Creator','Members','Semester','Type','Mode','Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((group, i) => (
                  <tr key={group._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-page)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <td style={{ padding: '0.875rem 1rem', minWidth: 160 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{group.name}</div>
                      {group.course && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{group.course}</div>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-body)', fontSize: '0.85rem', minWidth: 120 }}>{group.subject}</td>
                    <td style={{ padding: '0.875rem 1rem', minWidth: 130 }}>
                      {group.department ? <span style={{ background: 'var(--blue-tint)', color: 'var(--dark-accent)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{group.department}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}>
                          {group.creator?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{group.creator?.name || '—'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{group.creator?.department || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <button onClick={() => setMembersModal(group)}
                        style={{ background: 'var(--blue-tint)', color: 'var(--blue-primary)', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-primary)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue-tint)'; e.currentTarget.style.color = 'var(--blue-primary)'; }}>
                        {group.members?.length || 0} / {group.maxMembers}
                      </button>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{group.semester || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: group.groupType === 'Open' ? 'rgba(25,135,84,0.1)' : 'rgba(255,193,7,0.15)', color: group.groupType === 'Open' ? 'var(--success)' : '#856404' }}>
                        {group.groupType === 'Open' ? '🔓 Open' : '🔒 Invite'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: group.isOnline ? 'var(--blue-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
                        {group.isOnline ? '🌐 Online' : '📍 Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => openEdit(group)}
                          style={{ background: 'var(--blue-tint)', color: 'var(--blue-primary)', border: '1px solid rgba(13,110,253,0.2)', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-primary)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue-tint)'; e.currentTarget.style.color = 'var(--blue-primary)'; }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteId(group._id)}
                          style={{ background: 'rgba(220,53,69,0.08)', color: 'var(--error)', border: '1px solid rgba(220,53,69,0.2)', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.08)'; e.currentTarget.style.color = 'var(--error)'; }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {membersModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setMembersModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '82vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#fff' }}>{membersModal.name}</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{membersModal.subject} · {membersModal.members?.length || 0} members</p>
              </div>
              <button onClick={() => setMembersModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {!membersModal.members?.length ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No members yet</p>
              ) : membersModal.members.map((m, i) => (
                <div key={m._id || i} style={{ padding: '0.875rem 1.5rem', borderBottom: i < membersModal.members.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.universityEmail}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {m.year && <span style={{ fontSize: '0.72rem', color: 'var(--blue-primary)', background: 'var(--blue-tint)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>Year {m.year}</span>}
                    {m.department && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-page)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>{m.department}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-page)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setMembersModal(null)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !saving && setEditModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: '1.1rem' }}>Edit Study Group</h3>
              <button onClick={() => !saving && setEditModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><FL label="Group Name *"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></FL></div>
              <FL label="Subject *"><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputStyle} /></FL>
              <FL label="Course Code"><input value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} style={inputStyle} /></FL>
              <FL label="Department">
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inputStyle}>
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FL>
              <FL label="Semester">
                <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} style={inputStyle}>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FL>
              <FL label="Max Members"><input type="number" min="1" value={form.maxMembers} onChange={e => setForm(f => ({ ...f, maxMembers: +e.target.value }))} style={inputStyle} /></FL>
              <FL label="Type">
                <select value={form.groupType} onChange={e => setForm(f => ({ ...f, groupType: e.target.value }))} style={inputStyle}>
                  <option value="Open">Open</option>
                  <option value="Invite-Only">Invite-Only</option>
                </select>
              </FL>
              <FL label="Mode">
                <select value={form.isOnline} onChange={e => setForm(f => ({ ...f, isOnline: e.target.value === 'true' }))} style={inputStyle}>
                  <option value="false">Offline</option>
                  <option value="true">Online</option>
                </select>
              </FL>
              <div style={{ gridColumn: '1 / -1' }}><FL label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></FL></div>
              <FL label="Meeting Day"><input value={form.meetingSchedule.day} onChange={e => setForm(f => ({ ...f, meetingSchedule: { ...f.meetingSchedule, day: e.target.value } }))} placeholder="e.g. Monday" style={inputStyle} /></FL>
              <FL label="Meeting Time"><input value={form.meetingSchedule.time} onChange={e => setForm(f => ({ ...f, meetingSchedule: { ...f.meetingSchedule, time: e.target.value } }))} placeholder="e.g. 3:00 PM" style={inputStyle} /></FL>
              <div style={{ gridColumn: '1 / -1' }}><FL label="Meeting Location"><input value={form.meetingSchedule.location} onChange={e => setForm(f => ({ ...f, meetingSchedule: { ...f.meetingSchedule, location: e.target.value } }))} placeholder="e.g. Library Room 3" style={inputStyle} /></FL></div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--bg-page)' }}>
              <button onClick={() => !saving && setEditModal(null)} disabled={saving} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !deleting && setDeleteId(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Delete Study Group?</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>This will permanently remove the group and all memberships.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} disabled={deleting} style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--error)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FL({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.3rem' }}>{label}</label>
      {children}
    </div>
  );
}
const selectStyle = { padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' };
const inputStyle  = { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)', background: '#fff', boxSizing: 'border-box' };