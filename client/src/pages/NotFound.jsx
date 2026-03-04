import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f7f5f0', flexDirection: 'column', textAlign: 'center', padding: 24,
    }}>
      <div className="animate-fade-in">
        <div style={{ fontSize: '5rem', marginBottom: 20 }}>🎓</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '5rem', color: '#0f1b2d', lineHeight: 1, marginBottom: 8 }}>
          404
        </h1>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#4a5568', marginBottom: 12 }}>
          Page Not Found
        </h2>
        <p style={{ color: '#718096', fontSize: '0.95rem', maxWidth: 360, margin: '0 auto 32px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #1a2d4a, #0f1b2d)',
            color: '#e8c97a', border: '1px solid rgba(201,168,76,0.3)',
            padding: '12px 24px', borderRadius: 10, textDecoration: 'none',
            fontSize: '0.9rem', fontWeight: 600,
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
