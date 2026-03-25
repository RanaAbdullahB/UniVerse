import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { InlineLoader, Spinner } from '../../components/LoadingSpinner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { addToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      addToast(data.message, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (userId) => {
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      addToast('User deleted successfully', 'success');
      setDeleteConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally { setActionLoading(null); }
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100 }} className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>
          👥 Manage Users
        </h2>
        <p style={{ color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>
          View, search, promote or remove university portal users
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search by name, email or ID..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: '10px 14px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
        />
        <select
          value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', appearance: 'none', cursor: 'pointer', background: '#fff' }}
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Stats bar */}
      <div style={{ background: 'rgb(231,237,254)', border: '1px solid rgb(210,224,255)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: '0.82rem', color: 'rgb(29,47,111)' }}>
        Showing <strong>{users.length}</strong> user{users.length !== 1 ? 's' : ''} ·{' '}
        <strong>{users.filter((u) => u.role === 'admin').length}</strong> admin{users.filter((u) => u.role === 'admin').length !== 1 ? 's' : ''} ·{' '}
        <strong>{users.filter((u) => u.role === 'student').length}</strong> student{users.filter((u) => u.role === 'student').length !== 1 ? 's' : ''}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'rgb(1,8,24)', marginBottom: 12 }}>Delete User?</h3>
            <p style={{ color: 'rgb(88,85,94)', fontSize: '0.875rem', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will remove them from all clubs, events, and study groups. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                disabled={actionLoading === deleteConfirm._id}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'rgb(220,53,69)', color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {actionLoading === deleteConfirm._id ? <Spinner size={14} color="#fff" /> : null}
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <InlineLoader text="Loading users..." /> : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgb(126,126,126)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>👥</div>
          <p>No users found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgb(222,226,230)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 20px', background: 'rgb(248,249,250)', borderBottom: '1px solid rgb(222,226,230)', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(88,85,94)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Name</span>
            <span>Email / ID</span>
            <span>Department</span>
            <span>Role</span>
            <span>Actions</span>
          </div>

          {users.map((u, i) => (
            <div
              key={u._id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < users.length - 1 ? '1px solid rgb(233,236,239)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(248,249,250)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.role === 'admin' ? 'linear-gradient(135deg, rgb(131,144,250), rgb(29,47,111))' : 'linear-gradient(135deg, rgb(13,110,253), rgb(29,47,111))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'rgb(33,37,41)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
              </div>

              {/* Email / ID */}
              <div>
                <p style={{ fontSize: '0.8rem', color: 'rgb(33,37,41)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.universityEmail}</p>
                <p style={{ fontSize: '0.72rem', color: 'rgb(126,126,126)' }}>{u.studentId}</p>
              </div>

              {/* Department */}
              <span style={{ fontSize: '0.78rem', color: 'rgb(88,85,94)' }}>{u.department || '—'}</span>

              {/* Role badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20,
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                background: u.role === 'admin' ? 'rgb(231,237,254)' : 'rgb(209,231,221)',
                color: u.role === 'admin' ? 'rgb(29,47,111)' : 'rgb(13,62,2)',
              }}>
                {u.role === 'admin' ? '👑 Admin' : '🎓 Student'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                {/* Toggle role */}
                <button
                  onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'student' : 'admin')}
                  disabled={actionLoading === u._id}
                  title={u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1.5px solid rgb(210,224,255)', background: 'rgb(231,237,254)', color: 'rgb(29,47,111)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {actionLoading === u._id ? <Spinner size={10} color="rgb(29,47,111)" /> : u.role === 'admin' ? '↓ Demote' : '↑ Promote'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteConfirm(u)}
                  disabled={actionLoading === u._id}
                  title="Delete user"
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1.5px solid rgba(220,53,69,0.3)', background: '#fef2f2', color: 'rgb(220,53,69)', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}