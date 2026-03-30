import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { InlineLoader } from '../components/LoadingSpinner';
import AnnouncementBanner from '../components/AnnouncementBanner'; 

const categoryColors = {
  Technical: '#dbeafe', Sports: '#dcfce7', Arts: '#fce7f3',
  Cultural: '#fef3c7', Academic: '#ede9fe', Social: '#ffedd5',
};
const categoryText = {
  Technical: '#1e40af', Sports: '#166534', Arts: '#9d174d',
  Cultural: '#92400e', Academic: '#5b21b6', Social: '#9a3412',
};
const eventTypeColor = {
  Competition: '#fce7f3', Workshop: '#dbeafe', Seminar: '#ede9fe',
  Social: '#ffedd5', Sports: '#dcfce7', Cultural: '#fef3c7',
};
const eventTypeText = {
  Competition: '#9d174d', Workshop: '#1e40af', Seminar: '#5b21b6',
  Social: '#9a3412', Sports: '#166534', Cultural: '#92400e',
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#e8c97a', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'rgba(245,240,232,0.9)', fontSize: '0.82rem', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ color: 'rgba(245,240,232,0.4)', fontSize: '0.72rem', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardHome({ onTabChange }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, clRes] = await Promise.all([
          api.get('/events?upcoming=true'),
          api.get('/clubs'),
        ]);
        setEvents(evRes.data.events.slice(0, 3));
        setClubs(clRes.data.clubs.slice(0, 4));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <InlineLoader text="Loading dashboard..." />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in" style={{ padding: '28px 24px', maxWidth: 1100 }}>
       <AnnouncementBanner userDepartment={user?.department} />
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: '#8a6f30', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {greeting} 👋
        </p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#0f1b2d', lineHeight: 1.2 }}>
          Welcome back, <span style={{ color: '#c9a84c' }}>{user?.name?.split(' ')[0]}</span>
        </h2>
        <p style={{ color: '#718096', marginTop: 6, fontSize: '0.875rem' }}>
          {user?.department} · Year {user?.year} · ID: {user?.studentId}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard icon="🏛️" label="Clubs Joined" value={user?.joinedClubs?.length || 0} sub="Active memberships" />
        <StatCard icon="📅" label="Events Registered" value={user?.registeredEvents?.length || 0} sub="Upcoming activities" />
        <StatCard icon="📚" label="Study Groups" value={user?.joinedStudyGroups?.length || 0} sub="Current groups" />
        <StatCard icon="🎓" label="Year" value={user?.year || 1} sub={user?.department} />
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="grid-cols-1 lg:grid-cols-2">
        {/* Upcoming Events */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#0f1b2d' }}>
              📅 Upcoming Events
            </h3>
            <button
              onClick={() => onTabChange('events')}
              style={{ fontSize: '0.78rem', color: '#8a6f30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="stagger-children">
            {events.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <span className="empty-state-icon">📅</span>
                <p>No upcoming events</p>
              </div>
            ) : events.map((event) => (
              <div key={event._id} className="card" style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f0ebe2' }}>
                  {event.coverImage ? (
                    <img src={event.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📅</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f1b2d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
                  <p style={{ fontSize: '0.75rem', color: '#718096', marginTop: 2 }}>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {event.venue}
                  </p>
                  <span className="badge" style={{ marginTop: 6, background: eventTypeColor[event.eventType] || '#f0ebe2', color: eventTypeText[event.eventType] || '#4a5568' }}>
                    {event.eventType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Clubs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: '#0f1b2d' }}>
              🏛️ Discover Clubs
            </h3>
            <button
              onClick={() => onTabChange('clubs')}
              style={{ fontSize: '0.78rem', color: '#8a6f30', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="stagger-children">
            {clubs.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <span className="empty-state-icon">🏛️</span>
                <p>No clubs available</p>
              </div>
            ) : clubs.map((club) => (
              <div key={club._id} className="card" style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f0ebe2' }}>
                  {club.coverImage ? (
                    <img src={club.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏛️</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f1b2d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{club.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#718096', marginTop: 2 }}>{club.totalMembers} members</p>
                </div>
                <span className="badge" style={{ background: categoryColors[club.category] || '#f0ebe2', color: categoryText[club.category] || '#4a5568', flexShrink: 0 }}>
                  {club.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 28, background: 'linear-gradient(135deg, #0f1b2d, #1a2d4a)', borderRadius: 16, padding: '24px', border: '1px solid rgba(201,168,76,0.2)' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#e8c97a', fontSize: '1.1rem', marginBottom: 16 }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Browse Clubs', icon: '🏛️', tab: 'clubs' },
            { label: 'View Events', icon: '📅', tab: 'events' },
            { label: 'Study Groups', icon: '📚', tab: 'studygroups' },
            { label: 'My Profile', icon: '👤', tab: 'profile' },
          ].map((action) => (
            <button
              key={action.tab}
              onClick={() => onTabChange(action.tab)}
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 10,
                padding: '10px 18px',
                color: '#e8c97a',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 500,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.18)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.1)')}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
