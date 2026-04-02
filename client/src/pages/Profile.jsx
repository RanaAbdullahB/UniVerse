// client/src/pages/Profile.jsx
// Full profile page with local photo upload added
// Drop this in as a replacement for your existing Profile.jsx

import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

const DEPARTMENTS = [
  'Computer Science', 'Software Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Mathematics', 'Physics', 'English', 'Management Sciences',
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  // ── Profile form ──
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    year: user?.year || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password form ──
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // ── Photo upload ──
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  // current avatar: uploaded local, or initials fallback
  const avatarUrl = photoPreview || (user?.profilePhoto ? user.profilePhoto : null);

  // ── Handlers ──────────────────────────────────────────────

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { showToast('Name is required', 'error'); return; }
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/update-profile', profileForm);
      updateUser(res.data.user || res.data.data);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally { setProfileSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) { showToast('All password fields are required', 'error'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { showToast('New passwords do not match', 'error'); return; }
    if (pwForm.newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast('Password changed successfully', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally { setPwSaving(false); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { showToast('Image must be under 3 MB', 'error'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', photoFile);
      const res = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      setPhotoFile(null);
      setPhotoPreview(null);
      showToast('Profile photo updated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally { setPhotoUploading(false); }
  };

  const handlePhotoRemove = async () => {
    if (!user?.profilePhoto) { setPhotoPreview(null); setPhotoFile(null); return; }
    setPhotoUploading(true);
    try {
      const res = await api.delete('/upload/avatar');
      updateUser(res.data.user);
      setPhotoPreview(null);
      setPhotoFile(null);
      showToast('Photo removed', 'success');
    } catch {
      showToast('Failed to remove photo', 'error');
    } finally { setPhotoUploading(false); }
  };

  const cancelPreview = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 24px', maxWidth: 680 }}>

      {/* ── Avatar Section ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgb(222,226,230)', padding: '24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: 'rgb(1,8,24)', marginBottom: 20 }}>
          📷 Profile Photo
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar preview */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgb(210,224,255)', background: 'linear-gradient(135deg, rgb(29,47,111), rgb(13,110,253))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.75rem', fontFamily: 'Playfair Display, serif' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Camera overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'rgb(13,110,253)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
              📷
            </button>
          </div>

          {/* Upload controls */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect} style={{ display: 'none' }} />

            {/* New file selected — show upload/cancel */}
            {photoFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: '0.78rem', color: 'rgb(88,85,94)', margin: 0 }}>
                  📎 <strong>{photoFile.name}</strong> — ready to upload
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handlePhotoUpload} disabled={photoUploading}
                    style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: 'rgb(13,110,253)', color: '#fff', cursor: photoUploading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: photoUploading ? 0.7 : 1 }}>
                    {photoUploading ? 'Uploading...' : '⬆️ Upload'}
                  </button>
                  <button onClick={cancelPreview}
                    style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'rgb(88,85,94)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: '0.78rem', color: 'rgb(126,126,126)', margin: 0 }}>
                  JPG, PNG or WebP · Max 3 MB
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ padding: '7px 16px', borderRadius: 7, border: '1.5px solid rgb(210,224,255)', background: 'rgb(231,237,254)', color: 'rgb(29,47,111)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Choose Photo
                  </button>
                  {user?.profilePhoto && (
                    <button onClick={handlePhotoRemove} disabled={photoUploading}
                      style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid rgba(220,53,69,0.3)', background: '#fef2f2', color: 'rgb(220,53,69)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Info ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgb(222,226,230)', padding: '24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: 'rgb(1,8,24)', marginBottom: 20 }}>
          👤 Personal Information
        </h3>

        {/* Read-only badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Email',      value: user?.universityEmail },
            { label: 'Student ID', value: user?.studentId },
            { label: 'Role',       value: user?.role === 'admin' ? '👑 Admin' : '🎓 Student' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgb(248,249,250)', borderRadius: 8, padding: '6px 12px', border: '1px solid rgb(222,226,230)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgb(126,126,126)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgb(33,37,41)', marginTop: 1 }}>{value || '—'}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Full Name *">
            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your full name" style={inputStyle} />
          </Field>

          <Field label="Department">
            <select value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} style={inputStyle}>
              <option value="">Select department...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          <Field label="Academic Year">
            <select value={profileForm.year} onChange={e => setProfileForm(f => ({ ...f, year: e.target.value }))} style={inputStyle}>
              <option value="">Select year...</option>
              {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="submit" disabled={profileSaving}
              style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: 'rgb(13,110,253)', color: '#fff', cursor: profileSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', opacity: profileSaving ? 0.7 : 1 }}>
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change Password ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgb(222,226,230)', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.05rem', color: 'rgb(1,8,24)', marginBottom: 20 }}>
          🔒 Change Password
        </h3>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Current Password', key: 'currentPassword', show: 'current' },
            { label: 'New Password',     key: 'newPassword',     show: 'new' },
            { label: 'Confirm New Password', key: 'confirmPassword', show: 'confirm' },
          ].map(({ label, key, show }) => (
            <Field key={key} label={label}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords[show] ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, [show]: !p[show] }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'rgb(126,126,126)' }}>
                  {showPasswords[show] ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="submit" disabled={pwSaving}
              style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: 'rgb(220,53,69)', color: '#fff', cursor: pwSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', opacity: pwSaving ? 0.7 : 1 }}>
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid rgb(222,226,230)', borderRadius: 8,
  fontSize: '0.875rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: 'rgb(33,37,41)',
  background: '#fff', boxSizing: 'border-box',
};