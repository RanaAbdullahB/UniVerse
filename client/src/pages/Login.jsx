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
    if (!form.universityEmail || !form.password) {
      setError('Please fill in all fields');
      return;
    }
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
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f7f5f0' }}>
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(160deg, #0f1b2d 0%, #1a2d4a 50%, #243d5e 100%)',
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 50px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="md:flex"
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.1)' }} />
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 350, height: 350, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.06)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #c9a84c, #8a6f30)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              🎓
            </div>
            <div>
              <h1 style={{ color: '#e8c97a', fontFamily: 'Playfair Display, serif', fontSize: '1.4rem' }}>UniPortal</h1>
              <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Student Gateway</p>
            </div>
          </div>

          <h2 style={{ color: '#f5f0e8', fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', lineHeight: 1.25, marginBottom: 20 }}>
            Your campus,<br />
            <span style={{ color: '#c9a84c' }}>connected.</span>
          </h2>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 360 }}>
            Access clubs, events, study groups, and everything university life has to offer — all in one place.
          </p>

          <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['🏛️ 50+ Student Clubs & Societies', '📅 Live Event Registration', '📚 Peer Study Groups'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a84c', flexShrink: 0 }} />
                <span style={{ color: 'rgba(245,240,232,0.7)', fontSize: '0.875rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="animate-fade-in">
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="md:hidden">
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #c9a84c, #8a6f30)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🎓</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#0f1b2d', fontSize: '1.2rem' }}>UniPortal</h1>
          </div>

          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#0f1b2d', marginBottom: 6 }}>
            Welcome back
          </h2>
          <p style={{ color: '#718096', fontSize: '0.875rem', marginBottom: 32 }}>
            Sign in with your university credentials
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '11px 14px', marginBottom: 20, color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="input-label">University Email</label>
              <input
                type="email"
                name="universityEmail"
                value={form.universityEmail}
                onChange={handleChange}
                placeholder="yourname@university.edu"
                className={`input-field ${error ? 'error' : ''}`}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}
            >
              {loading ? <><Spinner size={16} color="#e8c97a" /> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, color: '#718096', fontSize: '0.85rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#8a6f30', fontWeight: 600, textDecoration: 'none' }}>
              Register here
            </Link>
          </p>

          <div style={{ marginTop: 32, padding: '14px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.75rem', color: '#8a6f30', textAlign: 'center', fontWeight: 500 }}>
              🔒 Only university email addresses are accepted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
