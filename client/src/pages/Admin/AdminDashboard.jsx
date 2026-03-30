// client/src/pages/admin/AdminDashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminOverview       from './AdminOverview';
import AdminUsers          from './AdminUsers';
import AdminClubs          from './AdminClubs';
import AdminEvents         from './AdminEvents';
import AdminStudyGroups    from './AdminStudyGroups';
import AdminAnnouncements  from './AdminAnnouncements';
import AdminActivityLog    from './AdminActivityLog';

const TABS = [
  { id: 'overview',      label: 'Overview',       icon: '📊' },
  { id: 'users',         label: 'Users',           icon: '👥' },
  { id: 'clubs',         label: 'Clubs',           icon: '🏛️' },
  { id: 'events',        label: 'Events',          icon: '📅' },
  { id: 'studyGroups',   label: 'Study Groups',    icon: '📚' },
  { id: 'announcements', label: 'Announcements',   icon: '📢' },
  { id: 'activityLog',   label: 'Activity Log',    icon: '📋' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':      return <AdminOverview onTabChange={setActiveTab} />;
      case 'users':         return <AdminUsers />;
      case 'clubs':         return <AdminClubs />;
      case 'events':        return <AdminEvents />;
      case 'studyGroups':   return <AdminStudyGroups />;
      case 'announcements': return <AdminAnnouncements />;
      case 'activityLog':   return <AdminActivityLog />;
      default:              return <AdminOverview onTabChange={setActiveTab} />;
    }
  };

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <aside style={{ width: 240, background: 'linear-gradient(180deg, var(--dark-primary) 0%, rgb(18,30,80) 100%)', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, boxShadow: '4px 0 20px rgba(1,8,24,0.2)' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/lgulogo.png" alt="LGU Logo" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', color: '#fff', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>UniVerse</div>
              <div style={{ color: 'rgba(152,197,255,0.7)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.1rem' }}>Admin Portal</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '0.875rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.875rem', borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: isActive ? 'rgba(13,110,253,0.2)' : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: isActive ? 600 : 400, fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', position: 'relative', outline: 'none', transition: 'all 0.15s ease' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}>
                {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: '0 2px 2px 0', background: 'var(--blue-primary)' }} />}
                <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '0.875rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem', padding: '0.625rem 0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue-primary), var(--blue-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{user?.name?.charAt(0).toUpperCase() || 'A'}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(220,53,69,0.3)', background: 'rgba(220,53,69,0.12)', color: 'rgba(255,190,190,0.9)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.3)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.12)'; e.currentTarget.style.color = 'rgba(255,190,190,0.9)'; }}>
            Sign Out
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 240, flex: 1, minWidth: 0, padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: 'var(--dark-primary)', margin: 0, lineHeight: 1.2 }}>{currentTab?.icon} {currentTab?.label}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0', fontSize: '0.82rem' }}>Lahore Garrison University — Admin Portal</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '0.5rem 0.875rem', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}