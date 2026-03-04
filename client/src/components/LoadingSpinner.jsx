import React from 'react';

export const Spinner = ({ size = 24, color = '#c9a84c' }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2.5px solid rgba(201, 168, 76, 0.2)`,
      borderTop: `2.5px solid ${color}`,
      borderRadius: '50%',
    }}
    className="animate-spin"
  />
);

export const PageLoader = () => (
  <div className="loading-overlay">
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          border: '3px solid rgba(201, 168, 76, 0.2)',
          borderTop: '3px solid #c9a84c',
          borderRadius: '50%',
        }}
        className="animate-spin"
      />
      <p style={{ color: '#8a6f30', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}>
        Loading...
      </p>
    </div>
  </div>
);

export const InlineLoader = ({ text = 'Loading...' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 0', color: '#8a6f30' }}>
    <Spinner />
    <span style={{ fontSize: '0.875rem' }}>{text}</span>
  </div>
);
