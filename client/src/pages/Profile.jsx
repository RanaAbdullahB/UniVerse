import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { Spinner } from '../components/LoadingSpinner';

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Business Administration', 'Economics', 'Psychology', 'Sociology',
  'English Literature', 'History', 'Political Science', 'Architecture',
  'Medicine', 'Law', 'Fine Arts', 'Other',
];

function Section({ title, icon, children }) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: '#0f1b2d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    year: user?.year || 1,
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleProfileChange = (e) => setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (passwordErrors[e.target.name]) setPasswordErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/update-profile', profileForm);
      updateUser({ ...user, ...profileForm });
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange2 = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password required';
    if (!passwordForm.newPassword) errs.newPassword = 'New password required';
    else if (passwordForm.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setPasswordErrors(errs); return; }

    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      addToast('Password changed successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 800 }} className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.7rem', color: '#0f1b2d', marginBottom: 4 }}>
          👤 My Profile
        </h2>
        <p style={{ color: '#718096', fontSize: '0.875rem' }}>Manage your account and preferences</p>
      </div>

      {/* Avatar header */}
      <div className="card" style={{ padding: '28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, background: 'linear-gradient(135deg, #0f1b2d, #1a2d4a)', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #c9a84c, #8a6f30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0f1b2d', fontWeight: 700, fontSize: '1.8rem',
          flexShrink: 0, border: '3px solid rgba(201,168,76,0.4)',
        }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#f5f0e8', fontSize: '1.3rem' }}>{user?.name}</h3>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.85rem', marginTop: 3 }}>{user?.universityEmail}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <span style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)', color: '#e8c97a', fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
              ID: {user?.studentId}
            </span>
            <span style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)', color: '#e8c97a', fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
              {user?.role === 'admin' ? '👑 Admin' : '🎓 Student'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Quick stats */}
        {[
          { icon: '🏛️', label: 'Clubs', value: user?.joinedClubs?.length || 0 },
          { icon: '📅', label: 'Events', value: user?.registeredEvents?.length || 0 },
          { icon: '📚', label: 'Study Groups', value: user?.joinedStudyGroups?.length || 0 },
          { icon: '📆', label: 'Year', value: user?.year || 1 },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
            <div>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f1b2d', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: '0.78rem', color: '#718096' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Profile */}
      <Section title="Edit Profile" icon="✏️">
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="input-label">Full Name</label>
              <input name="name" value={profileForm.name} onChange={handleProfileChange} className="input-field" />
            </div>
            <div>
              <label className="input-label">University Email</label>
              <input value={user?.universityEmail} disabled className="input-field" style={{ background: '#f7f5f0', color: '#718096' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="input-label">Department</label>
              <select name="department" value={profileForm.department} onChange={handleProfileChange} className="input-field" style={{ appearance: 'none' }}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Year of Study</label>
              <select name="year" value={profileForm.year} onChange={handleProfileChange} className="input-field" style={{ appearance: 'none' }}>
                {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? <><Spinner size={14} color="#e8c97a" /> Saving...</> : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon="🔒">
        <form onSubmit={handlePasswordChange2} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">Current Password</label>
            <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="••••••••" className={`input-field ${passwordErrors.currentPassword ? 'error' : ''}`} />
            {passwordErrors.currentPassword && <p style={{ color: '#c53030', fontSize: '0.75rem', marginTop: 4 }}>⚠ {passwordErrors.currentPassword}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="input-label">New Password</label>
              <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Min. 6 characters" className={`input-field ${passwordErrors.newPassword ? 'error' : ''}`} />
              {passwordErrors.newPassword && <p style={{ color: '#c53030', fontSize: '0.75rem', marginTop: 4 }}>⚠ {passwordErrors.newPassword}</p>}
            </div>
            <div>
              <label className="input-label">Confirm New Password</label>
              <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Re-enter new password" className={`input-field ${passwordErrors.confirmPassword ? 'error' : ''}`} />
              {passwordErrors.confirmPassword && <p style={{ color: '#c53030', fontSize: '0.75rem', marginTop: 4 }}>⚠ {passwordErrors.confirmPassword}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={passwordLoading}>
              {passwordLoading ? <><Spinner size={14} color="#e8c97a" /> Updating...</> : '🔑 Update Password'}
            </button>
          </div>
        </form>
      </Section>

      {/* Account info */}
      <div className="card" style={{ padding: '18px 24px', marginTop: 20, background: '#fffbeb', border: '1px solid #fde68a' }}>
        <p style={{ fontSize: '0.8rem', color: '#92400e' }}>
          <strong>Account created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} · <strong>Student ID:</strong> {user?.studentId}
        </p>
      </div>
    </div>
  );
}
