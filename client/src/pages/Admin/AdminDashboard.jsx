import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminClubs from './AdminClubs';
import AdminEvents from './AdminEvents';

const navItems = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'users', label: 'Manage Users', icon: '👥' },
  { key: 'clubs', label: 'Manage Clubs', icon: '🏛️' },
  { key: 'events', label: 'Manage Events', icon: '📅' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview />;
      case 'users': return <AdminUsers />;
      case 'clubs': return <AdminClubs />;
      case 'events': return <AdminEvents />;
      default: return <AdminOverview />;
    }
  };

  const tabTitles = {
    overview: 'Admin Overview',
    users: 'Manage Users',
    clubs: 'Manage Clubs',
    events: 'Manage Events',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(248,249,250)' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Admin Sidebar ── */}
      <aside style={{
        width: 240,
        background: 'linear-gradient(180deg, rgb(1,8,24) 0%, rgb(25,24,27) 100%)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: 0, top: 0,
        zIndex: 50, borderRight: '1px solid rgba(131,144,250,0.2)',
        transition: 'transform 0.3s ease',
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
        className={`${!mobileOpen ? 'hidden md:flex' : 'flex'} flex-col`}
      >
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(131,144,250,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', overflow: 'hidden', padding: 2, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <img src="/lgulogo.png" alt="LGU" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h2 style={{ color: 'rgb(131,144,250)', fontFamily: 'Playfair Display, serif', fontSize: '1rem', lineHeight: 1.2 }}>
                UniVerse
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* Admin badge */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(131,144,250,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, rgb(131,144,250), rgb(29,47,111))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </p>
              <span style={{ background: 'rgba(131,144,250,0.2)', color: 'rgb(131,144,250)', fontSize: '0.65rem', fontWeight: 700, padding: '1px 8px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                👑 Admin
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 4px', marginBottom: 4 }}>
            Admin Controls
          </p>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setMobileOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 8, width: '100%',
                border: 'none', background: activeTab === item.key
                  ? 'rgba(13,110,253,0.2)' : 'transparent',
                color: activeTab === item.key ? '#fff' : 'rgb(136,152,170)',
                fontWeight: activeTab === item.key ? 600 : 400,
                fontSize: '0.875rem', cursor: 'pointer',
                borderLeft: activeTab === item.key ? '3px solid rgb(13,110,253)' : '3px solid transparent',
                marginBottom: 2, transition: 'all 0.15s',
                fontFamily: 'DM Sans, sans-serif',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(131,144,250,0.1)' }}>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '10px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 8, color: '#ff8080', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="admin-main">

        {/* Top bar */}
        <header style={{ height: 60, background: '#fff', borderBottom: '1px solid rgb(222,226,230)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4a5568' }}
              className="md:hidden"
            >
              ☰
            </button>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'rgb(1,8,24)', fontWeight: 600 }}>
              {tabTitles[activeTab]}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'rgb(231,237,254)', color: 'rgb(29,47,111)', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>
              👑 ADMIN
            </span>
            <span style={{ fontSize: '0.82rem', color: 'rgb(88,85,94)' }}>{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) { .admin-main { margin-left: 0 !important; } }
      `}</style>
    </div>
  );
}