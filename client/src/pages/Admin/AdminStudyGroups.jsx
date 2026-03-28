// client/src/pages/admin/AdminStudyGroups.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/LoadingSpinner';

export default function AdminStudyGroups() {
  const { showToast } = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [membersModal, setMembersModal] = useState(null); // group object
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/study-groups/${deleteId}`);
      showToast('Study group deleted', 'success');
      setGroups(prev => prev.filter(g => g._id !== deleteId));
      setDeleteId(null);
    } catch {
      showToast('Failed to delete study group', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const departments = [...new Set(groups.map(g => g.department).filter(Boolean))].sort();

  const filtered = groups.filter(g => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      g.name.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q) ||
      (g.department && g.department.toLowerCase().includes(q)) ||
      (g.creator?.name && g.creator.name.toLowerCase().includes(q));
    const matchDept = !filterDept || g.department === filterDept;
    const matchType = !filterType || g.groupType === filterType;
    const matchMode =
      filterMode === '' ? true :
      filterMode === 'online' ? g.isOnline :
      !g.isOnline;
    return matchSearch && matchDept && matchType && matchMode;
  });

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Groups', value: groups.length, color: 'var(--blue-primary)', bg: 'rgba(13,110,253,0.08)', icon: '📚' },
    { label: 'Open Groups', value: groups.filter(g => g.groupType === 'Open').length, color: 'var(--success)', bg: 'rgba(25,135,84,0.08)', icon: '🔓' },
    { label: 'Online Groups', value: groups.filter(g => g.isOnline).length, color: 'var(--dark-accent)', bg: 'rgba(29,47,111,0.08)', icon: '🌐' },
    { label: 'Total Members', value: groups.reduce((acc, g) => acc + (g.members?.length || 0), 0), color: '#fd7e14', bg: 'rgba(253,126,20,0.08)', icon: '👤' },
  ];

  return (
    <div>
      {/* Stat mini cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: card.color, lineHeight: 1.1, fontFamily: 'Playfair Display, serif' }}>{card.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, subject, department, creator..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: '1 1 240px', padding: '0.55rem 0.875rem',
            border: '1.5px solid var(--border)', borderRadius: '8px',
            fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)', background: '#fff',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--blue-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
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
      </div>

      {/* Results count */}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.875rem' }}>
        {filtered.length} group{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No study groups found</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border)' }}>
                  {['Group Info', 'Subject', 'Department', 'Creator', 'Members', 'Semester', 'Type', 'Mode', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((group, i) => (
                  <tr key={group._id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-page)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>

                    {/* Group Info */}
                    <td style={{ padding: '0.875rem 1rem', minWidth: 160 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{group.name}</div>
                      {group.course && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{group.course}</div>
                      )}
                    </td>

                    {/* Subject */}
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-body)', fontSize: '0.85rem', minWidth: 120 }}>{group.subject}</td>

                    {/* Department */}
                    <td style={{ padding: '0.875rem 1rem', minWidth: 130 }}>
                      {group.department ? (
                        <span style={{ background: 'var(--blue-tint)', color: 'var(--dark-accent)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {group.department}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>

                    {/* Creator */}
                    <td style={{ padding: '0.875rem 1rem', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}>
                          {group.creator?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{group.creator?.name || '—'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{group.creator?.department || ''}</div>
                        </div>
                      </div>
                    </td>

                    {/* Members */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <button
                        onClick={() => setMembersModal(group)}
                        style={{ background: 'var(--blue-tint)', color: 'var(--blue-primary)', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-primary)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue-tint)'; e.currentTarget.style.color = 'var(--blue-primary)'; }}>
                        {group.members?.length || 0} / {group.maxMembers}
                      </button>
                    </td>

                    {/* Semester */}
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {group.semester || '—'}
                    </td>

                    {/* Type */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                        background: group.groupType === 'Open' ? 'rgba(25,135,84,0.1)' : 'rgba(255,193,7,0.15)',
                        color: group.groupType === 'Open' ? 'var(--success)' : '#856404',
                      }}>
                        {group.groupType === 'Open' ? '🔓 Open' : '🔒 Invite'}
                      </span>
                    </td>

                    {/* Mode */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: group.isOnline ? 'var(--blue-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
                        {group.isOnline ? '🌐 Online' : '📍 Offline'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <button
                        onClick={() => setDeleteId(group._id)}
                        style={{ background: 'rgba(220,53,69,0.08)', color: 'var(--error)', border: '1px solid rgba(220,53,69,0.2)', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.08)'; e.currentTarget.style.color = 'var(--error)'; }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Members Modal ── */}
      {membersModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setMembersModal(null)}>
          <div
            style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '82vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#fff' }}>{membersModal.name}</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  {membersModal.subject} · {membersModal.department} · {membersModal.members?.length || 0} member{membersModal.members?.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setMembersModal(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ×
              </button>
            </div>

            {/* Group details strip */}
            <div style={{ display: 'flex', gap: '1.5rem', padding: '0.875rem 1.5rem', background: 'var(--bg-page)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>📅 {membersModal.semester}</span>
              <span>{membersModal.isOnline ? '🌐 Online' : '📍 Offline'}</span>
              <span>{membersModal.groupType === 'Open' ? '🔓 Open' : '🔒 Invite-Only'}</span>
              {membersModal.meetingSchedule?.day && (
                <span>🕐 {membersModal.meetingSchedule.day} {membersModal.meetingSchedule.time}</span>
              )}
            </div>

            {/* Members list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {!membersModal.members?.length ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No members yet</p>
              ) : (
                membersModal.members.map((member, i) => (
                  <div key={member._id || i}
                    style={{ padding: '0.875rem 1.5rem', borderBottom: i < membersModal.members.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.universityEmail}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      {member.year && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--blue-primary)', background: 'var(--blue-tint)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          Year {member.year}
                        </span>
                      )}
                      {member.department && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-page)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          {member.department}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Capacity: {membersModal.members?.length || 0} / {membersModal.maxMembers}
              </span>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={() => { setDeleteId(membersModal._id); setMembersModal(null); }}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(220,53,69,0.3)', background: 'rgba(220,53,69,0.08)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
                  Delete Group
                </button>
                <button onClick={() => setMembersModal(null)}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !deleting && setDeleteId(null)}>
          <div
            style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,53,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem' }}>🗑️</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 0.5rem', color: 'var(--dark-primary)', fontSize: '1.2rem' }}>Delete Study Group?</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              This will permanently remove the group and all its memberships. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500, color: 'var(--text-body)', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--error)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: '0.55rem 0.875rem',
  border: '1.5px solid var(--border)',
  borderRadius: '8px',
  fontSize: '0.875rem',
  background: '#fff',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  outline: 'none',
};