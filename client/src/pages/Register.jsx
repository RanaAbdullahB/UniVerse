import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Business Administration', 'Economics', 'Psychology', 'Sociology',
  'English Literature', 'History', 'Political Science', 'Architecture',
  'Medicine', 'Law', 'Fine Arts', 'Other',
];

// ── IMPORTANT: Field is defined OUTSIDE Register component ──
// If defined inside, React recreates it on every keystroke causing focus loss
const Field = ({ label, name, type = 'text', placeholder, value, onChange, error }) => (
  <div>
    <label style={{
      display: 'block', fontSize: '0.825rem', fontWeight: 500,
      color: '#4a5568', marginBottom: 5,
    }}>
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '11px 14px',
        border: `1.5px solid ${error ? '#e53e3e' : '#e2ddd5'}`,
        borderRadius: 8, fontSize: '0.9rem', color: '#1a1a2e',
        background: '#fff', outline: 'none', fontFamily: 'DM Sans, sans-serif',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => { e.target.style.borderColor = 'rgb(13,110,253)'; e.target.style.boxShadow = '0 0 0 3px rgba(13,110,253,0.15)'; }}
      onBlur={(e) => { e.target.style.borderColor = error ? '#e53e3e' : '#e2ddd5'; e.target.style.boxShadow = 'none'; }}
    />
    {error && <p style={{ color: '#c53030', fontSize: '0.75rem', marginTop: 4 }}>⚠ {error}</p>}
  </div>
);

export default function Register() {
  const [form, setForm] = useState({
    name: '', universityEmail: '', studentId: '',
    department: '', year: '1', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.universityEmail) newErrors.universityEmail = 'University email is required';
    else if (!form.universityEmail.toLowerCase().endsWith('@lgu.edu.pk'))
      newErrors.universityEmail = 'Email must end with @lgu.edu.pk';
    if (!form.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!form.department) newErrors.department = 'Please select your department';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'At least 6 characters required';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      await register({ ...submitData, year: parseInt(form.year) });
      navigate('/dashboard');
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(248,249,250)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 580 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, background: '#fff', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0', margin: '0 auto 14px', padding: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <img src="/lgulogo.png" alt="LGU Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.9rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>
            Create your account
          </h1>
          <p style={{ color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>
            Join UniVerse with your LGU student credentials
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgb(222,226,230)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '32px' }}>

          {errors.api && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '11px 14px', marginBottom: 20, color: '#991b1b', fontSize: '0.85rem' }}>
              ⚠️ {errors.api}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Full Name *" name="name" placeholder="Ali Khan" value={form.name} onChange={handleChange} error={errors.name} />
              <Field label="Student ID *" name="studentId" placeholder="2024-CS-001" value={form.studentId} onChange={handleChange} error={errors.studentId} />
            </div>

            {/* Email */}
            <Field
              label="LGU Email *" name="universityEmail" type="email"
              placeholder="yourname@lgu.edu.pk"
              value={form.universityEmail} onChange={handleChange} error={errors.universityEmail}
            />

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Department dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#4a5568', marginBottom: 5 }}>
                  Department *
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: `1.5px solid ${errors.department ? '#e53e3e' : '#e2ddd5'}`,
                    borderRadius: 8, fontSize: '0.9rem', color: '#1a1a2e',
                    background: '#fff', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    appearance: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p style={{ color: '#c53030', fontSize: '0.75rem', marginTop: 4 }}>⚠ {errors.department}</p>}
              </div>

              {/* Year dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 500, color: '#4a5568', marginBottom: 5 }}>
                  Year of Study
                </label>
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #e2ddd5', borderRadius: 8,
                    fontSize: '0.9rem', color: '#1a1a2e', background: '#fff',
                    outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    appearance: 'none', cursor: 'pointer',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            {/* Passwords */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Password *" name="password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} error={errors.password} />
              <Field label="Confirm Password *" name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
            </div>

            {/* Domain notice */}
            <div style={{ background: 'rgb(231,237,254)', border: '1px solid rgb(210,224,255)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: 'rgb(29,47,111)' }}>
              🔒 Only LGU email addresses ending in <strong>@lgu.edu.pk</strong> are accepted
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', marginTop: 4,
                background: loading ? 'rgba(13,110,253,0.6)' : 'rgb(13,110,253)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, color: 'rgb(126,126,126)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'rgb(13,110,253)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}