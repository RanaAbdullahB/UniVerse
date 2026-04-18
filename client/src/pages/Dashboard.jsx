import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import DashboardHome from './DashboardHome';
import Clubs from './Clubs';
import Events from './Events';
import StudyGroups from './StudyGroups';
import Profile from './Profile';
import Messages from './Messages';
import ResourcePool from './ResourcePool';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
  switch (activeTab) {
    case 'home': return <DashboardHome onTabChange={setActiveTab} />;
    case 'clubs': return <Clubs />;
    case 'events': return <Events />;
    case 'studygroups': return <StudyGroups />;
    case 'profile': return <Profile />;
    case 'messages': return <Messages />;
    case 'resource-pool': return <ResourcePool />;
    default: return <DashboardHome onTabChange={setActiveTab} />;
  }
};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f5f0' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="main-content">
        <Navbar
          activeTab={activeTab}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}