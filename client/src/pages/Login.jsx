import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/LoadingSpinner';

export default function Login() {
  const [form, setForm] = useState({ universityEmail: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.universityEmail || !form.password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(form.universityEmail, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      overflow: 'hidden',
    }}>

      {/* ── Full-page campus background ── */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/campus.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />

      {/* ── Dark gradient overlay ── */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, rgba(1,8,24,0.72) 0%, rgba(29,47,111,0.58) 100%)',
        zIndex: 1,
      }} />

      {/* ── Centered content wrapper ── */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>

        {/* Top branding — above the card */}
        <div style={{ textAlign: 'center', marginBottom: 28 }} className="animate-fade-in">
          <div style={{
            width: 72, height: 72,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            padding: 4,
          }}>
            <img src="/lgulogo.png" alt="LGU Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{
            color: '#fff',
            fontFamily: 'Playfair Display, serif',
            fontSize: '2rem',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            marginBottom: 4,
          }}>
            UniVerse
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            Lahore Garrison University · Student Gateway
          </p>
        </div>

        {/* ── Glassmorphism sign-in card ── */}
        <div style={{ width: '100%', maxWidth: 420 }} className="animate-fade-in">
          <div style={{
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 20,
            padding: '36px 36px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>

            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.5rem',
              color: '#fff',
              marginBottom: 4,
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
              textAlign: 'center',
            }}>
              Welcome back
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.83rem',
              marginBottom: 24,
              textAlign: 'center',
            }}>
              Sign in with your university credentials
            </p>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(220,53,69,0.18)',
                border: '1px solid rgba(220,53,69,0.45)',
                borderRadius: 8, padding: '11px 14px', marginBottom: 20,
                color: '#ffb3b3', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                  University Email
                </label>
                <input
                  type="email" name="universityEmail"
                  value={form.universityEmail} onChange={handleChange}
                  placeholder="yourname@lgu.edu.pk" autoComplete="email"
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'rgba(255,255,255,0.12)',
                    border: `1.5px solid ${error ? 'rgba(220,53,69,0.6)' : 'rgba(255,255,255,0.25)'}`,
                    borderRadius: 8, color: '#fff', fontSize: '0.9rem',
                    outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(152,197,255,0.8)'; e.target.style.boxShadow = '0 0 0 3px rgba(152,197,255,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'rgb(152,197,255)', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password" name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    borderRadius: 8, color: '#fff', fontSize: '0.9rem',
                    outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(152,197,255,0.8)'; e.target.style.boxShadow = '0 0 0 3px rgba(152,197,255,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '12px', marginTop: 4,
                  background: loading ? 'rgba(13,110,253,0.5)' : 'rgb(13,110,253)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(13,110,253,0.4)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgb(29,47,111)'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'rgb(13,110,253)'; }}
              >
                {loading ? <><Spinner size={16} color="#fff" /> Signing in...</> : 'Sign In →'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '22px 0' }} />

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'rgb(152,197,255)', fontWeight: 600, textDecoration: 'none' }}>
                Register here
              </Link>
            </p>

            <div style={{ marginTop: 14, padding: '9px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                🔒 Students: use your @lgu.edu.pk email
              </p>
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: 18, color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
            © 2025 Lahore Garrison University — UniVerse
          </p>
        </div>
      </div>
    </div>
  );
}