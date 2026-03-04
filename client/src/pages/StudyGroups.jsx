import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { InlineLoader, Spinner } from '../components/LoadingSpinner';

const SEMESTERS = ['Fall', 'Spring', 'Summer'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'TBD'];

function GroupCard({ group, onJoinLeave, onDelete }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  const spotsLeft = group.maxMembers - (group.members?.length || 0);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (group.isCreator) {
        await api.delete(`/study-groups/${group._id}`);
        addToast('Study group deleted', 'success');
        onDelete(group._id);
      } else {
        const endpoint = group.isMember
          ? `/study-groups/${group._id}/leave`
          : `/study-groups/${group._id}/join`;
        const { data } = await api.post(endpoint);
        addToast(data.message, 'success');
        onJoinLeave(group._id, !group.isMember);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#0f1b2d', marginBottom: 3, lineHeight: 1.3 }}>
            {group.name}
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#718096' }}>
            {group.subject} · <strong style={{ color: '#4a5568' }}>{group.course}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
          <span style={{
            padding: '3px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
            background: group.isOnline ? '#dbeafe' : '#f0fdf4',
            color: group.isOnline ? '#1e40af' : '#166534',
          }}>
            {group.isOnline ? '🌐 Online' : '🏢 In-Person'}
          </span>
          <span style={{
            padding: '3px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
            background: group.groupType === 'Open' ? '#dcfce7' : '#fef3c7',
            color: group.groupType === 'Open' ? '#166534' : '#92400e',
          }}>
            {group.groupType}
          </span>
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p style={{ fontSize: '0.8rem', color: '#718096', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {group.description}
        </p>
      )}

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.75rem', color: '#4a5568' }}>
        <div>📚 <span style={{ color: '#718096' }}>{group.department}</span></div>
        <div>📅 <span style={{ color: '#718096' }}>{group.semester} Semester</span></div>
        <div>👥 <span style={{ color: '#718096' }}>{group.members?.length || 0}/{group.maxMembers} members</span></div>
        <div>📍 <span style={{ color: '#718096' }}>{group.meetingSchedule?.day || 'TBD'} {group.meetingSchedule?.time || ''}</span></div>
      </div>

      {/* Capacity bar */}
      <div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(100, ((group.members?.length || 0) / group.maxMembers) * 100)}%` }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: spotsLeft === 0 ? '#c53030' : '#718096', marginTop: 4 }}>
          {spotsLeft === 0 ? 'Group is full' : `${spotsLeft} open spot${spotsLeft !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Creator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.75rem', color: '#718096' }}>
          {group.isCreator ? (
            <span style={{ color: '#c9a84c', fontWeight: 500 }}>👑 Your group</span>
          ) : (
            <span>Created by {group.creator?.name?.split(' ')[0] || 'Student'}</span>
          )}
        </div>
        <button
          onClick={handleAction}
          disabled={loading || (spotsLeft === 0 && !group.isMember && !group.isCreator)}
          style={{
            padding: '7px 14px', borderRadius: 8,
            border: group.isCreator
              ? '1.5px solid #fca5a5'
              : group.isMember ? '1.5px solid #fca5a5' : '1.5px solid rgba(201,168,76,0.3)',
            background: group.isCreator
              ? '#fef2f2'
              : group.isMember ? '#fef2f2'
              : spotsLeft === 0 ? '#f0ebe2' : 'linear-gradient(135deg, #1a2d4a, #0f1b2d)',
            color: group.isCreator
              ? '#c53030'
              : group.isMember ? '#c53030'
              : spotsLeft === 0 ? '#718096' : '#e8c97a',
            fontSize: '0.78rem', fontWeight: 600,
            cursor: spotsLeft === 0 && !group.isMember && !group.isCreator ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {loading ? <Spinner size={11} /> : null}
          {group.isCreator ? 'Delete Group' : group.isMember ? 'Leave Group' : spotsLeft === 0 ? 'Full' : 'Join Group'}
        </button>
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '', subject: '', description: '', course: '', department: '',
    semester: 'Spring', maxMembers: 8, meetingSchedule: { day: 'TBD', time: '', location: '' },
    isOnline: false, groupType: 'Open',
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('meeting.')) {
      const field = name.split('.')[1];
      setForm((prev) => ({ ...prev, meetingSchedule: { ...prev.meetingSchedule, [field]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.course || !form.department) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/study-groups', form);
      addToast('Study group created!', 'success');
      onCreate(data.group);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f0ebe2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#0f1b2d' }}>Create Study Group</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#718096' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label className="input-label">Group Name *</label><input name="name" value={form.name} onChange={handleChange} placeholder="Study Group Name" className="input-field" /></div>
            <div><label className="input-label">Course Code *</label><input name="course" value={form.course} onChange={handleChange} placeholder="CS301" className="input-field" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label className="input-label">Subject *</label><input name="subject" value={form.subject} onChange={handleChange} placeholder="Data Structures" className="input-field" /></div>
            <div><label className="input-label">Department *</label><input name="department" value={form.department} onChange={handleChange} placeholder="Computer Science" className="input-field" /></div>
          </div>
          <div><label className="input-label">Description</label><textarea name="description" value={form.description} onChange={handleChange} placeholder="What will your group focus on?" className="input-field" rows={3} style={{ resize: 'none' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label className="input-label">Semester</label>
              <select name="semester" value={form.semester} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
                {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="input-label">Max Members</label><input type="number" name="maxMembers" value={form.maxMembers} onChange={handleChange} min={2} max={50} className="input-field" /></div>
            <div>
              <label className="input-label">Group Type</label>
              <select name="groupType" value={form.groupType} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
                <option>Open</option><option>Invite-Only</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="input-label">Meeting Day</label>
              <select name="meeting.day" value={form.meetingSchedule.day} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
                {DAYS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="input-label">Meeting Time</label><input name="meeting.time" value={form.meetingSchedule.time} onChange={handleChange} placeholder="5:00 PM" className="input-field" /></div>
          </div>
          <div><label className="input-label">Location / Meeting Link</label><input name="meeting.location" value={form.meetingSchedule.location} onChange={handleChange} placeholder="Library Room 3 or Zoom link" className="input-field" /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: '#4a5568' }}>
            <input type="checkbox" name="isOnline" checked={form.isOnline} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#c9a84c' }} />
            This is an online group
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Spinner size={14} color="#e8c97a" /> Creating...</> : '📚 Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOnline, setFilterOnline] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterOnline !== 'all') params.append('isOnline', filterOnline === 'online' ? 'true' : 'false');
      const { data } = await api.get(`/study-groups?${params}`);
      setGroups(data.groups);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterOnline]);

  useEffect(() => {
    const t = setTimeout(fetchGroups, 300);
    return () => clearTimeout(t);
  }, [fetchGroups]);

  const handleJoinLeave = (id, isMember) => setGroups((prev) => prev.map((g) => g._id === id ? { ...g, isMember } : g));
  const handleDelete = (id) => setGroups((prev) => prev.filter((g) => g._id !== id));
  const handleCreate = (newGroup) => setGroups((prev) => [{ ...newGroup, isMember: true, isCreator: true }, ...prev]);

  const myGroups = groups.filter((g) => g.isMember || g.isCreator);
  const displayGroups = activeTab === 'mine' ? myGroups : groups;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1200 }} className="animate-fade-in">
      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.7rem', color: '#0f1b2d', marginBottom: 4 }}>
            📚 Study Groups
          </h2>
          <p style={{ color: '#718096', fontSize: '0.875rem' }}>Connect with peers and study smarter together</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Create Study Group
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0ebe2', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ key: 'all', label: `All Groups (${groups.length})` }, { key: 'mine', label: `My Groups (${myGroups.length})` }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 16px', borderRadius: 7, border: 'none',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#0f1b2d' : '#718096',
              fontWeight: activeTab === tab.key ? 600 : 400, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search by name, subject, or course..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field" style={{ maxWidth: 320 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ key: 'all', label: 'All' }, { key: 'online', label: '🌐 Online' }, { key: 'offline', label: '🏢 In-Person' }].map((f) => (
            <button key={f.key} onClick={() => setFilterOnline(f.key)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: filterOnline === f.key ? 'none' : '1.5px solid #e2ddd5',
                background: filterOnline === f.key ? '#0f1b2d' : 'transparent',
                color: filterOnline === f.key ? '#e8c97a' : '#718096',
                fontSize: '0.8rem', fontWeight: filterOnline === f.key ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <InlineLoader text="Loading study groups..." />
      ) : displayGroups.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📚</span>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#0f1b2d', marginBottom: 8 }}>
            {activeTab === 'mine' ? "You haven't joined any study groups" : 'No study groups found'}
          </h3>
          <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>
            {activeTab === 'mine' ? 'Join an existing group or create your own' : 'Try different filters or create a new group'}
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Create a Group</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }} className="stagger-children">
          {displayGroups.map((group) => (
            <GroupCard key={group._id} group={group} onJoinLeave={handleJoinLeave} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
