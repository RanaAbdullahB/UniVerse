import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Spinner } from '../components/LoadingSpinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your university email'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { universityEmail: email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: '#fff', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0', margin: '0 auto 14px', padding: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <img src="/lgulogo.png" alt="LGU Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: 'var(--dark-primary)', marginBottom: 6 }}>
            Forgot Password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Enter your university email and we'll send you a reset link
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {/* Success state */}
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: 'var(--dark-primary)', marginBottom: 10 }}>
                Check your inbox
              </h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 8 }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
              <div style={{
                background: 'var(--blue-tint)', border: '1px solid var(--blue-wash)',
                borderRadius: 8, padding: '12px 14px', margin: '16px 0',
                fontSize: '0.8rem', color: 'var(--dark-accent)', lineHeight: 1.5,
              }}>
                ⏱ The link expires in <strong>15 minutes</strong>.<br />
                Don't see it? Check your spam folder.
              </div>

              {/* Dev hint — only useful in development */}
              <div style={{
                background: 'rgb(255, 243, 205)', border: '1px solid rgb(255, 220, 100)',
                borderRadius: 8, padding: '10px 14px', margin: '12px 0',
                fontSize: '0.78rem', color: 'rgb(102, 77, 3)',
              }}>
                💡 <strong>Development tip:</strong> If email is not configured, check your <strong>server terminal</strong> — the reset link is printed there.
              </div>

              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: 'var(--blue-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', marginTop: 8,
              }}>
                ← Back to Login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fca5a5',
                  borderRadius: 8, padding: '11px 14px', marginBottom: 20,
                  color: 'var(--error)', fontSize: '0.85rem',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="input-label">University Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="yourname@university.edu"
                    className={`input-field ${error ? 'error' : ''}`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                  {loading
                    ? <><Spinner size={16} color="#fff" /> Sending link...</>
                    : '📧 Send Reset Link'
                  }
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Remembered your password?{' '}
                <Link to="/login" style={{ color: 'var(--blue-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}