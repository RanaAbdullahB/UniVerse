import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Spinner } from '../components/LoadingSpinner';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Verify token is valid as soon as page loads
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const { data } = await api.get(`/auth/verify-reset-token/${token}`);
        setTokenValid(true);
        setUserEmail(data.email);
      } catch {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.newPassword) errs.newPassword = 'Password is required';
    else if (form.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Failed to reset password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Loading while verifying token ──
  if (verifying) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--blue-wash)', borderTop: '3px solid var(--blue-primary)', borderRadius: '50%', margin: '0 auto 16px' }} className="animate-spin" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // ── Invalid / expired token ──
  if (!tokenValid) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }} className="animate-fade-in">
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>⏰</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: 'var(--dark-primary)', marginBottom: 10 }}>
            Link Expired or Invalid
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 24 }}>
            This password reset link has expired or is invalid. Reset links are only valid for 15 minutes.
          </p>
          <Link to="/forgot-password" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
            Request a New Link
          </Link>
          <p style={{ marginTop: 16, fontSize: '0.85rem' }}>
            <Link to="/login" style={{ color: 'var(--blue-primary)', textDecoration: 'none', fontWeight: 500 }}>← Back to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }} className="animate-fade-in">
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: 'var(--dark-primary)', marginBottom: 10 }}>
            Password Reset!
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 20 }}>
            Your password has been successfully reset. Redirecting you to login in a moment...
          </p>
          <div style={{ width: 36, height: 36, border: '3px solid var(--blue-wash)', borderTop: '3px solid var(--blue-primary)', borderRadius: '50%', margin: '0 auto 20px' }} className="animate-spin" />
          <Link to="/login" style={{ color: 'var(--blue-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  // ── Reset form ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'linear-gradient(135deg, var(--blue-primary), var(--dark-accent))',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', margin: '0 auto 14px',
          }}>🔑</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: 'var(--dark-primary)', marginBottom: 6 }}>
            Set New Password
          </h1>
          {userEmail && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Resetting password for <strong style={{ color: 'var(--text-body)' }}>{userEmail}</strong>
            </p>
          )}
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {errors.api && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 8, padding: '11px 14px', marginBottom: 20,
              color: 'var(--error)', fontSize: '0.85rem',
            }}>
              ⚠️ {errors.api}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="input-label">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className={`input-field ${errors.newPassword ? 'error' : ''}`}
                autoFocus
              />
              {errors.newPassword && (
                <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: 4 }}>⚠ {errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
              />
              {errors.confirmPassword && (
                <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: 4 }}>⚠ {errors.confirmPassword}</p>
              )}
            </div>

            {/* Password strength hint */}
            {form.newPassword && (
              <div style={{
                background: form.newPassword.length >= 8 ? 'rgb(209, 231, 221)' : 'var(--blue-tint)',
                border: `1px solid ${form.newPassword.length >= 8 ? 'rgb(163, 207, 187)' : 'var(--blue-wash)'}`,
                borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem',
                color: form.newPassword.length >= 8 ? 'var(--success-dark)' : 'var(--dark-accent)',
              }}>
                {form.newPassword.length < 6
                  ? '❌ Too short — minimum 6 characters'
                  : form.newPassword.length < 8
                  ? '⚠️ Acceptable — 8+ characters recommended'
                  : '✅ Strong password'}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}
            >
              {loading
                ? <><Spinner size={16} color="#fff" /> Resetting...</>
                : '🔑 Reset Password'
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Link to="/login" style={{ color: 'var(--blue-primary)', fontWeight: 500, textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}