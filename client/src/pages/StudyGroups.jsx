// client/src/pages/StudyGroups.jsx
// Full study groups page with Group Chat button added.
// Replace your existing StudyGroups.jsx with this file.

import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InlineLoader } from '../components/LoadingSpinner';
import GroupChat from '../components/GroupChat';

const DEPARTMENTS = [
  'Computer Science', 'Software Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Mathematics', 'Physics', 'English', 'Management Sciences',
];
const SEMESTERS = ['Fall', 'Spring', 'Summer'];

const emptyForm = {
  name: '', subject: '', description: '', course: '', department: '',
  semester: 'Fall', maxMembers: 10, isOnline: false, groupType: 'Open',
  meetingSchedule: { day: '', time: '', location: '' },
};

export default function StudyGroups() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [groups, setGroups]         = useState([]);
  const [myGroups, setMyGroups]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('browse'); // browse | mine
  const [search, setSearch]         = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [creating, setCreating]     = useState(false);
  const [joiningId, setJoiningId]   = useState(null);
  const [leavingId, setLeavingId]   = useState(null);
  const [chatGroup, setChatGroup]   = useState(null); // open chat modal

  const myId = user?._id || user?.id;

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([
        api.get('/study-groups'),
        api.get('/study-groups/my-groups'),
      ]);
      setGroups(allRes.data.data || allRes.data.studyGroups || []);
      setMyGroups(myRes.data.data || myRes.data.studyGroups || []);
    } catch {
      showToast('Failed to load study groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isMember = (group) =>
    group.members?.some(m => (m._id || m).toString() === myId?.toString()) ||
    group.creator?._id?.toString() === myId?.toString() ||
    group.creator?.toString() === myId?.toString();

  const handleJoin = async (groupId) => {
    setJoiningId(groupId);
    try {
      await api.post(`/study-groups/${groupId}/join`);
      showToast('Joined study group!', 'success');
      await fetchAll();
      refreshUser && refreshUser();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join', 'error');
    } finally { setJoiningId(null); }
  };

  const handleLeave = async (groupId) => {
    setLeavingId(groupId);
    try {
      await api.post(`/study-groups/${groupId}/leave`);
      showToast('Left study group', 'success');
      await fetchAll();
      refreshUser && refreshUser();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave', 'error');
    } finally { setLeavingId(null); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) {
      showToast('Name and subject are required', 'error'); return;
    }
    setCreating(true);
    try {
      await api.post('/study-groups', form);
      showToast('Study group created!', 'success');
      setShowCreate(false);
      setForm(emptyForm);
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create group', 'error');
    } finally { setCreating(false); }
  };

  // Filtered list for browse tab
  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !search || g.name.toLowerCase().includes(q) || g.subject.toLowerCase().includes(q) || (g.department && g.department.toLowerCase().includes(q));
    const matchDept = !filterDept || g.department === filterDept;
    const matchMode = filterMode === '' ? true : filterMode === 'online' ? g.isOnline : !g.isOnline;
    return matchSearch && matchDept && matchMode;
  });

  const displayGroups = activeTab === 'mine' ? myGroups : filtered;

  if (loading) return <InlineLoader text="Loading study groups..." />;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100 }}>
      {/* Chat modal */}
      {chatGroup && (
        <GroupChat
          group={chatGroup}
          currentUser={user}
          onClose={() => setChatGroup(null)}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !creating && setShowCreate(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: '1.1rem' }}>Create Study Group</h3>
              <button onClick={() => !creating && setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FL label="Group Name *"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. DS Final Exam Prep" style={iStyle} /></FL>
              </div>
              <FL label="Subject *"><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Data Structures" style={iStyle} /></FL>
              <FL label="Course Code"><input value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} placeholder="e.g. CS301" style={iStyle} /></FL>
              <FL label="Department">
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={iStyle}>
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FL>
              <FL label="Semester">
                <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} style={iStyle}>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FL>
              <FL label="Max Members"><input type="number" min="2" max="50" value={form.maxMembers} onChange={e => setForm(f => ({ ...f, maxMembers: +e.target.value }))} style={iStyle} /></FL>
              <FL label="Type">
                <select value={form.groupType} onChange={e => setForm(f => ({ ...f, groupType: e.target.value }))} style={iStyle}>
                  <option value="Open">Open (anyone can join)</option>
                  <option value="Invite-Only">Invite Only</option>
                </select>
              </FL>
              <FL label="Mode">
                <select value={form.isOnline} onChange={e => setForm(f => ({ ...f, isOnline: e.target.value === 'true' }))} style={iStyle}>
                  <option value="false">📍 In-person</option>
                  <option value="true">🌐 Online</option>
                </select>
              </FL>
              <div style={{ gridColumn: '1 / -1' }}>
                <FL label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What will you study together?" rows={3} style={{ ...iStyle, resize: 'vertical' }} /></FL>
              </div>
              <FL label="Meeting Day"><input value={form.meetingSchedule.day} onChange={e => setForm(f => ({ ...f, meetingSchedule: { ...f.meetingSchedule, day: e.target.value } }))} placeholder="e.g. Monday" style={iStyle} /></FL>
              <FL label="Meeting Time"><input value={form.meetingSchedule.time} onChange={e => setForm(f => ({ ...f, meetingSchedule: { ...f.meetingSchedule, time: e.target.value } }))} placeholder="e.g. 4:00 PM" style={iStyle} /></FL>
              <div style={{ gridColumn: '1 / -1' }}>
                <FL label="Location / Link"><input value={form.meetingSchedule.location} onChange={e => setForm(f => ({ ...f, meetingSchedule: { ...f.meetingSchedule, location: e.target.value } }))} placeholder="Room number or Google Meet link" style={iStyle} /></FL>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="submit" disabled={creating} style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: creating ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'var(--dark-primary)', marginBottom: 4 }}>📚 Study Groups</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join groups, collaborate, and chat with your study partners</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: '10px 20px', background: 'var(--blue-primary)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
          + Create Group
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[{ id: 'browse', label: `🌐 Browse (${groups.length})` }, { id: 'mine', label: `📚 My Groups (${myGroups.length})` }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '0.6rem 1.25rem', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--blue-primary)' : '2px solid transparent', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 700 : 400, color: activeTab === tab.id ? 'var(--blue-primary)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters (browse tab only) */}
      {activeTab === 'browse' && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: '1 1 200px', padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', background: '#fff', color: 'var(--text-primary)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--blue-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={sStyle}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={sStyle}>
            <option value="">All Modes</option>
            <option value="online">🌐 Online</option>
            <option value="offline">📍 In-person</option>
          </select>
        </div>
      )}

      {/* Groups grid */}
      {displayGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
            {activeTab === 'mine' ? "You haven't joined any groups yet" : 'No groups found'}
          </p>
          {activeTab === 'mine' && (
            <button onClick={() => setActiveTab('browse')}
              style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: 8, border: '1.5px solid var(--blue-primary)', background: 'var(--blue-tint)', color: 'var(--blue-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              Browse Groups
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {displayGroups.map(group => {
            const member = isMember(group);
            const full = group.members?.length >= group.maxMembers;
            const pct = group.maxMembers ? Math.round((group.members?.length || 0) / group.maxMembers * 100) : 0;

            return (
              <div key={group._id} style={{ background: '#fff', borderRadius: 12, border: member ? '1.5px solid var(--blue-primary)' : '1px solid var(--border)', overflow: 'hidden', boxShadow: member ? '0 4px 20px rgba(13,110,253,0.1)' : '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => { if (!member) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { if (!member) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}>

                {/* Top accent */}
                <div style={{ height: 3, background: member ? 'var(--blue-primary)' : 'var(--border)' }} />

                <div style={{ padding: '1.125rem 1.25rem' }}>
                  {/* Badges row */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {member && <span style={{ background: 'var(--blue-tint)', color: 'var(--blue-primary)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>✓ Joined</span>}
                    <span style={{ background: group.isOnline ? 'rgba(13,110,253,0.08)' : 'rgba(25,135,84,0.08)', color: group.isOnline ? 'var(--blue-primary)' : 'var(--success)', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                      {group.isOnline ? '🌐 Online' : '📍 In-person'}
                    </span>
                    <span style={{ background: group.groupType === 'Open' ? 'rgba(25,135,84,0.08)' : 'rgba(253,126,20,0.1)', color: group.groupType === 'Open' ? 'var(--success)' : '#fd7e14', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                      {group.groupType === 'Open' ? '🔓 Open' : '🔒 Invite'}
                    </span>
                  </div>

                  {/* Name + subject */}
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.975rem', color: 'var(--dark-primary)', marginBottom: 4, lineHeight: 1.3 }}>{group.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>📖 {group.subject}{group.course ? ` · ${group.course}` : ''}</p>
                  {group.department && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>🏛️ {group.department}</p>}
                  {group.meetingSchedule?.day && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      🕐 {group.meetingSchedule.day}{group.meetingSchedule.time ? ` · ${group.meetingSchedule.time}` : ''}
                      {group.meetingSchedule.location ? ` · ${group.meetingSchedule.location}` : ''}
                    </p>
                  )}

                  {/* Capacity bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Members</span>
                      <span style={{ fontWeight: 600 }}>{group.members?.length || 0} / {group.maxMembers}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct >= 90 ? 'var(--error)' : 'var(--blue-primary)', borderRadius: 99, transition: 'width 0.4s' }} />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Chat button — only for members */}
                    {member && (
                      <button
                        onClick={() => setChatGroup(group)}
                        style={{
                          flex: 1, padding: '7px 8px', borderRadius: 8,
                          border: '1.5px solid var(--blue-primary)',
                          background: 'var(--blue-primary)', color: '#fff',
                          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                          fontFamily: 'DM Sans, sans-serif', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: 5,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgb(11,94,215)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--blue-primary)')}>
                        💬 Group Chat
                      </button>
                    )}

                    {/* Join / Leave */}
                    {member ? (
                      <button
                        onClick={() => handleLeave(group._id)}
                        disabled={leavingId === group._id}
                        style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid rgba(220,53,69,0.3)', background: '#fef2f2', color: 'var(--error)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s', opacity: leavingId === group._id ? 0.6 : 1 }}>
                        {leavingId === group._id ? '...' : 'Leave'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(group._id)}
                        disabled={joiningId === group._id || full || group.groupType === 'Invite-Only'}
                        style={{
                          flex: 1, padding: '7px 8px', borderRadius: 8,
                          border: '1.5px solid var(--blue-primary)',
                          background: full || group.groupType === 'Invite-Only' ? 'var(--bg-page)' : 'var(--blue-tint)',
                          color: full || group.groupType === 'Invite-Only' ? 'var(--text-muted)' : 'var(--blue-primary)',
                          cursor: full || group.groupType === 'Invite-Only' ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                          borderColor: full || group.groupType === 'Invite-Only' ? 'var(--border)' : 'var(--blue-primary)',
                          opacity: joiningId === group._id ? 0.6 : 1,
                        }}>
                        {joiningId === group._id ? 'Joining...' : full ? 'Full' : group.groupType === 'Invite-Only' ? '🔒 Invite Only' : 'Join Group'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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

const iStyle = { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)', background: '#fff', boxSizing: 'border-box', fontFamily: 'DM Sans, sans-serif' };
const sStyle = { padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.875rem', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' };