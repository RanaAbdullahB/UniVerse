// client/src/pages/admin/AdminUsers.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, InlineLoader } from '../../components/LoadingSpinner';
import { exportUsers } from '../../utils/csvExport';

const EVENT_TYPE_COLORS = { Workshop:'#0d6efd', Seminar:'#1d2f6f', Competition:'#dc3545', Social:'#198754', Sports:'#fd7e14', Cultural:'#6f42c1' };
const CLUB_CAT_COLORS   = { Technical:'#0d6efd', Sports:'#198754', Arts:'#6f42c1', Cultural:'#fd7e14', Academic:'#0dcaf0', Social:'#ffc107' };

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Profile / activity modal
  const [activityModal, setActivityModal] = useState(null);  // basic user obj
  const [activityData, setActivityData] = useState(null);    // enriched data
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityTab, setActivityTab] = useState('profile'); // profile | clubs | events | groups

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data || res.data.users || res.data || []);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Open activity modal — fetch enriched data
  const openActivity = async (user) => {
    setActivityModal(user);
    setActivityData(null);
    setActivityTab('profile');
    setActivityLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/activity`);
      setActivityData(res.data.data);
    } catch {
      showToast('Failed to load student activity', 'error');
    } finally {
      setActivityLoading(false);
    }
  };

  // Promote / demote
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      showToast(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to student'}`, 'success');
    } catch {
      showToast('Failed to update role', 'error');
    }
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteId}`);
      setUsers(prev => prev.filter(u => u._id !== deleteId));
      showToast('User deleted', 'success');
      setDeleteId(null);
    } catch {
      showToast('Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))].sort();

  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || u.name.toLowerCase().includes(q) || u.universityEmail.toLowerCase().includes(q) || (u.studentId && u.studentId.toLowerCase().includes(q)) || (u.department && u.department.toLowerCase().includes(q));
    const matchRole = !filterRole || u.role === filterRole;
    const matchDept = !filterDept || u.department === filterDept;
    return matchSearch && matchRole && matchDept;
  });

  if (loading) return <PageLoader />;

  const u = activityData?.user || activityModal;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search by name, email, student ID, department..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: '1 1 240px', padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', background: '#fff', color: 'var(--text-primary)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--blue-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={selectStyle}>
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={selectStyle}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={() => exportUsers(filtered)}
          style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-body)', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
          ⬇️ Export CSV
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.875rem' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👥</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No users found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border)' }}>
                  {['User','Student ID','Department','Year','Role','Joined','Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr key={user._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-page)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    onClick={() => openActivity(user)}>

                    <td style={{ padding: '0.875rem 1rem', minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{user.universityEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.studentId || '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', minWidth: 130 }}>
                      {user.department ? <span style={{ background: 'var(--blue-tint)', color: 'var(--dark-accent)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{user.department}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-body)', fontSize: '0.85rem' }}>{user.year ? `Year ${user.year}` : '—'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: user.role === 'admin' ? 'rgba(111,66,193,0.1)' : 'rgba(13,110,253,0.08)', color: user.role === 'admin' ? '#6f42c1' : 'var(--blue-primary)' }}>
                        {user.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'student' : 'admin')}
                          style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-page)', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-body)', fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-primary)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                          {user.role === 'admin' ? '⬇️ Demote' : '⬆️ Promote'}
                        </button>
                        <button onClick={() => setDeleteId(user._id)}
                          style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(220,53,69,0.2)', background: 'rgba(220,53,69,0.08)', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--error)', fontWeight: 500, transition: 'all 0.15s' }}
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

      {/* ── Full Student Activity Modal ── */}
      {activityModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setActivityModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '1.375rem 1.5rem', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue-primary), var(--blue-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.25rem', border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0 }}>
                {activityModal.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: '1.15rem' }}>{activityModal.name}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{activityModal.universityEmail}</p>
              </div>
              <button onClick={() => setActivityModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>

            {/* Activity Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)', padding: '0 1rem' }}>
              {[
                { id: 'profile', label: '👤 Profile' },
                { id: 'clubs',   label: `🏛️ Clubs (${activityData?.joinedClubs?.length ?? '…'})` },
                { id: 'events',  label: `📅 Events (${activityData?.registeredEvents?.length ?? '…'})` },
                { id: 'groups',  label: `📚 Groups (${activityData?.joinedStudyGroups?.length ?? '…'})` },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActivityTab(tab.id)}
                  style={{ padding: '0.75rem 1rem', border: 'none', borderBottom: activityTab === tab.id ? '2px solid var(--blue-primary)' : '2px solid transparent', background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: activityTab === tab.id ? 700 : 400, color: activityTab === tab.id ? 'var(--blue-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {activityLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem' }}>
                  <InlineLoader /><span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading activity...</span>
                </div>
              ) : (
                <>
                  {/* Profile tab */}
                  {activityTab === 'profile' && (
                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                      {[
                        { label: 'Student ID',     value: u?.studentId || '—' },
                        { label: 'Department',      value: u?.department || '—' },
                        { label: 'Academic Year',   value: u?.year ? `Year ${u.year}` : '—' },
                        { label: 'Role',            value: u?.role === 'admin' ? '👑 Admin' : '🎓 Student' },
                        { label: 'Clubs Joined',    value: activityData?.joinedClubs?.length ?? activityModal.joinedClubs?.length ?? 0 },
                        { label: 'Events Registered', value: activityData?.registeredEvents?.length ?? activityModal.registeredEvents?.length ?? 0 },
                        { label: 'Study Groups',    value: activityData?.joinedStudyGroups?.length ?? activityModal.joinedStudyGroups?.length ?? 0 },
                        { label: 'Member Since',    value: u?.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--bg-page)', borderRadius: '8px', padding: '0.875rem', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clubs tab */}
                  {activityTab === 'clubs' && (
                    <div style={{ padding: '1rem 1.5rem' }}>
                      {!activityData?.joinedClubs?.length ? (
                        <EmptyState icon="🏛️" text="Not a member of any clubs yet" />
                      ) : activityData.joinedClubs.map(club => (
                        <div key={club._id} style={{ padding: '0.875rem', marginBottom: '0.75rem', background: 'var(--bg-page)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{club.name}</div>
                            {club.presidentName && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>President: {club.presidentName}</div>}
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px', background: `${CLUB_CAT_COLORS[club.category] || '#0d6efd'}18`, color: CLUB_CAT_COLORS[club.category] || '#0d6efd' }}>
                            {club.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Events tab */}
                  {activityTab === 'events' && (
                    <div style={{ padding: '1rem 1.5rem' }}>
                      {!activityData?.registeredEvents?.length ? (
                        <EmptyState icon="📅" text="Not registered for any events" />
                      ) : activityData.registeredEvents.map(event => (
                        <div key={event._id} style={{ padding: '0.875rem', marginBottom: '0.75rem', background: 'var(--bg-page)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{event.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              📅 {new Date(event.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })} · 📍 {event.venue}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px', background: `${EVENT_TYPE_COLORS[event.eventType] || '#0d6efd'}18`, color: EVENT_TYPE_COLORS[event.eventType] || '#0d6efd', flexShrink: 0, marginLeft: '0.75rem' }}>
                            {event.eventType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Study Groups tab */}
                  {activityTab === 'groups' && (
                    <div style={{ padding: '1rem 1.5rem' }}>
                      {!activityData?.joinedStudyGroups?.length ? (
                        <EmptyState icon="📚" text="Not in any study groups" />
                      ) : activityData.joinedStudyGroups.map(group => (
                        <div key={group._id} style={{ padding: '0.875rem', marginBottom: '0.75rem', background: 'var(--bg-page)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{group.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{group.subject} · {group.department}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--blue-tint)', color: 'var(--dark-accent)' }}>{group.semester}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{group.isOnline ? '🌐' : '📍'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-page)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActivityModal(null)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Close</button>
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
            <h3 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Delete User?</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>This will permanently delete the user account and all associated data.</p>
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

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.625rem' }}>{icon}</div>
      <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{text}</p>
    </div>
  );
}

const selectStyle = { padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' };