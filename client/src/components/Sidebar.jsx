import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { key: 'home',          label: 'Home',               icon: '🏠' },
  { key: 'clubs',         label: 'Societies & Clubs',  icon: '🏛️' },
  { key: 'events',        label: 'Upcoming Events',    icon: '📅' },
  { key: 'studygroups',   label: 'Study Groups',       icon: '📚' },
  { key: 'messages',      label: 'Messages',           icon: '💬' },
  { key: 'resource-pool', label: 'Resource Pool',      icon: '📚' },
  { key: 'profile',       label: 'My Profile',         icon: '👤' },
];

export default function Sidebar({ activeTab, onTabChange, mobileOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: 'linear-gradient(180deg, #0f1b2d 0%, #1a2d4a 100%)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          borderRight: '1px solid rgba(201,168,76,0.15)',
          transition: 'transform 0.3s ease',
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className={`${!mobileOpen ? 'hidden md:flex' : 'flex'} flex-col`}
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', padding: 2, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              <img src="/lgulogo.png" alt="LGU" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h2 style={{ color: '#e8c97a', fontFamily: 'Playfair Display, serif', fontSize: '1rem', lineHeight: 1.2 }}>
                UniVerse
              </h2>
              <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Student Gateway
              </p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c9a84c, #8a6f30)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f1b2d',
                fontWeight: 700,
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#f5f0e8', fontSize: '0.83rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </p>
              <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '0.7rem' }}>
                {user?.department}
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          <p style={{ color: 'rgba(245,240,232,0.3)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 4px', marginBottom: 4 }}>
            Navigation
          </p>
          {navItems.map((item) => {
            return (
              <button
                key={item.key}
                className={`nav-item w-full text-left ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => { onTabChange(item.key); onClose && onClose(); }}
                style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', marginBottom: 2 }}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p style={{ color: 'rgba(245,240,232,0.25)', fontSize: '0.68rem', textAlign: 'center' }}>
            © 2025 University Portal
          </p>
        </div>
      </aside>
    </>
  );
}