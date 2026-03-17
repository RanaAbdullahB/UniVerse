import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/LoadingSpinner';

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Business Administration', 'Economics', 'Psychology', 'Sociology',
  'English Literature', 'History', 'Political Science', 'Architecture',
  'Medicine', 'Law', 'Fine Arts', 'Other',
];

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
    if (!form.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!form.department) newErrors.department = 'Please select your department';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      await register({ ...submitData, year: parseInt(form.year) });
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setErrors({ api: message });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, children }) => (
    <div>
      <label className="input-label">{label}</label>
      {children || (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`input-field ${errors[name] ? 'error' : ''}`}
        />
      )}
      {errors[name] && (
        <p style={{ color: '#c53030', fontSize: '0.75rem', marginTop: 4 }}>⚠ {errors[name]}</p>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 560 }} className="animate-fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: '#fff', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0', margin: '0 auto 16px', padding: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <img src="/lgulogo.png" alt="LGU Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.9rem', color: '#0f1b2d', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ color: '#718096', fontSize: '0.875rem' }}>
            Join the university portal with your student credentials
          </p>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: '32px' }}>
          {errors.api && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '11px 14px', marginBottom: 24, color: '#991b1b', fontSize: '0.85rem' }}>
              ⚠️ {errors.api}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Full Name" name="name" placeholder="John Smith" />
              <Field label="Student ID" name="studentId" placeholder="STU2024001" />
            </div>

            <Field label="University Email" name="universityEmail" type="email" placeholder="ABC@lgu.edu.pk" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Department" name="department">
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className={`input-field ${errors.department ? 'error' : ''}`}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p style={{ color: '#c53030', fontSize: '0.75rem', marginTop: 4 }}>⚠ {errors.department}</p>}
              </Field>

              <Field label="Year of Study" name="year">
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="input-field"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Password" name="password" type="password" placeholder="Min. 6 characters" />
              <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter password" />
            </div>

            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#8a6f30' }}>
              Only LGU email addresses ending in @cs.lgu.edu.pk are accepted
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}
            >
              {loading ? <><Spinner size={16} color="#e8c97a" /> Creating account...</> : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#718096', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#8a6f30', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}