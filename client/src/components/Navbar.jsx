import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMobileMenuToggle, activeTab }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const tabTitles = {
    home: 'Dashboard',
    clubs: 'Societies & Clubs',
    events: 'Upcoming Events',
    studygroups: 'Study Groups',
    profile: 'My Profile',
  };

  return (
    <header
      style={{
        height: 60,
        background: '#fff',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 4px rgba(15,27,45,0.06)',
      }}
    >
      {/* Left: mobile menu + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onMobileMenuToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4a5568', padding: 4 }}
          className="md:hidden"
        >
          ☰
        </button>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.1rem',
            color: '#0f1b2d',
            fontWeight: 600,
          }}
        >
          {tabTitles[activeTab] || 'Dashboard'}
        </h1>
      </div>

      {/* Right: notifications + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Notification bell */}
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '6px',
            borderRadius: 8,
            color: '#4a5568',
            transition: 'background 0.15s',
            position: 'relative',
          }}
          title="Notifications"
        >
          🔔
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              background: '#c9a84c',
              borderRadius: '50%',
              border: '1.5px solid white',
            }}
          />
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: '1.5px solid rgba(201,168,76,0.2)',
              borderRadius: 8,
              padding: '5px 10px 5px 5px',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c9a84c, #8a6f30)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f1b2d',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span style={{ fontSize: '0.83rem', color: '#0f1b2d', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <span style={{ color: '#718096', fontSize: '0.7rem' }}>▾</span>
          </button>

          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                background: '#fff',
                border: '1px solid rgba(201,168,76,0.15)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(15,27,45,0.12)',
                minWidth: 180,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0ebe2' }}>
                <p style={{ fontWeight: 500, fontSize: '0.85rem', color: '#0f1b2d' }}>{user?.name}</p>
                <p style={{ fontSize: '0.72rem', color: '#718096', marginTop: 2 }}>{user?.universityEmail}</p>
              </div>
              <div style={{ padding: 6 }}>
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: '#c53030',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.target.style.background = 'none')}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {showDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
}
