import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { InlineLoader, Spinner } from '../components/LoadingSpinner';

const EVENT_TYPES = ['All', 'Workshop', 'Seminar', 'Competition', 'Social', 'Sports', 'Cultural'];
const typeColors = {
  Workshop: { bg: '#dbeafe', text: '#1e40af' },
  Seminar: { bg: '#ede9fe', text: '#5b21b6' },
  Competition: { bg: '#fce7f3', text: '#9d174d' },
  Social: { bg: '#ffedd5', text: '#9a3412' },
  Sports: { bg: '#dcfce7', text: '#166534' },
  Cultural: { bg: '#fef3c7', text: '#92400e' },
};

function CountdownTimer({ date }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(date) - new Date();
      if (diff <= 0) { setTimeLeft('Event passed'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else {
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`${h}h ${m}m`);
      }
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [date]);
  return <span>{timeLeft}</span>;
}

function EventCard({ event, onRegister }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const isPast = new Date(event.date) < new Date();
  const seatsLeft = event.maxCapacity - (event.registeredStudents?.length || 0);
  const fillPct = Math.min(100, ((event.registeredStudents?.length || 0) / event.maxCapacity) * 100);
  const c = typeColors[event.eventType] || { bg: '#f0ebe2', text: '#4a5568' };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const endpoint = event.isRegistered
        ? `/events/${event._id}/unregister`
        : `/events/${event._id}/register`;
      const { data } = await api.post(endpoint);
      addToast(data.message, 'success');
      onRegister(event._id, !event.isRegistered);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: isPast ? 0.65 : 1 }}>
      <div style={{ height: 150, overflow: 'hidden', background: '#f0ebe2', position: 'relative' }}>
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isPast ? 'grayscale(0.5)' : 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📅</div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <span className="badge" style={{ background: c.bg, color: c.text }}>{event.eventType}</span>
          {isPast && <span className="badge" style={{ background: '#f0ebe2', color: '#718096' }}>Past</span>}
        </div>
        {event.isRegistered && !isPast && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: '#0f1b2d', color: '#c9a84c', fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
            ✓ REGISTERED
          </div>
        )}
        {!isPast && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 12px 8px', color: '#fff', fontSize: '0.72rem' }}>
            ⏱ <CountdownTimer date={event.date} />
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', color: '#0f1b2d', marginBottom: 8, lineHeight: 1.3 }}>
          {event.title}
        </h3>
        <div style={{ fontSize: '0.75rem', color: '#4a5568', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          <span>📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}</span>
          <span>📍 {event.venue}</span>
          <span>🏛️ {event.organizerName || (event.organizer?.name) || 'University'}</span>
        </div>

        {/* Capacity bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#718096', marginBottom: 4 }}>
            <span>{event.registeredStudents?.length || 0} registered</span>
            <span className={seatsLeft === 0 ? 'capacity-full' : seatsLeft <= 10 ? 'capacity-low' : 'capacity-ok'}>
              {seatsLeft === 0 ? 'Full' : `${seatsLeft} seats left`}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${fillPct}%`, background: seatsLeft === 0 ? '#fca5a5' : seatsLeft <= 10 ? '#fcd34d' : undefined }} />
          </div>
        </div>

        {!isPast && (
          <button
            onClick={handleRegister}
            disabled={loading || (seatsLeft === 0 && !event.isRegistered)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: event.isRegistered ? '1.5px solid #fca5a5' : '1.5px solid rgba(201,168,76,0.3)',
              background: seatsLeft === 0 && !event.isRegistered ? '#f0ebe2' : event.isRegistered ? '#fef2f2' : 'linear-gradient(135deg, #1a2d4a, #0f1b2d)',
              color: seatsLeft === 0 && !event.isRegistered ? '#718096' : event.isRegistered ? '#c53030' : '#e8c97a',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: seatsLeft === 0 && !event.isRegistered ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
            }}
          >
            {loading ? <Spinner size={12} /> : null}
            {seatsLeft === 0 && !event.isRegistered ? 'Event Full' : event.isRegistered ? 'Cancel Registration' : 'Register Now'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('All');
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventType !== 'All') params.append('eventType', eventType);
      if (search) params.append('search', search);
      if (activeTab === 'upcoming') params.append('upcoming', 'true');
      const { data } = await api.get(`/events?${params}`);
      setEvents(data.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventType, search, activeTab]);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 300);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  const handleRegister = (eventId, isRegistered) => {
    setEvents((prev) => prev.map((e) => {
      if (e._id !== eventId) return e;
      const newStudents = isRegistered
        ? [...(e.registeredStudents || []), 'me']
        : (e.registeredStudents || []).slice(0, -1);
      return { ...e, isRegistered, registeredStudents: newStudents };
    }));
  };

  const myEvents = events.filter((e) => e.isRegistered);

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1200 }} className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.7rem', color: '#0f1b2d', marginBottom: 4 }}>
          📅 Upcoming Events
        </h2>
        <p style={{ color: '#718096', fontSize: '0.875rem' }}>Register for workshops, seminars, competitions, and more</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0ebe2', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'mine', label: `My Events (${myEvents.length})` },
          { key: 'all', label: 'All Events' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 16px', borderRadius: 7, border: 'none',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#0f1b2d' : '#718096',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ maxWidth: 260 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EVENT_TYPES.map((type) => {
            const active = eventType === type;
            const c = typeColors[type];
            return (
              <button
                key={type}
                onClick={() => setEventType(type)}
                style={{
                  padding: '6px 14px', borderRadius: 20,
                  border: active ? 'none' : '1.5px solid #e2ddd5',
                  background: active ? (c ? c.bg : '#0f1b2d') : 'transparent',
                  color: active ? (c ? c.text : '#fff') : '#718096',
                  fontSize: '0.8rem', fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <InlineLoader text="Loading events..." />
      ) : (activeTab === 'mine' ? myEvents : events).length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📅</span>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#0f1b2d', marginBottom: 8 }}>
            {activeTab === 'mine' ? "You haven't registered for any events" : 'No events found'}
          </h3>
          <p style={{ fontSize: '0.85rem' }}>
            {activeTab === 'mine' ? 'Explore upcoming events and register today' : 'Try different filters'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }} className="stagger-children">
          {(activeTab === 'mine' ? myEvents : events).map((event) => (
            <EventCard key={event._id} event={event} onRegister={handleRegister} />
          ))}
        </div>
      )}
    </div>
  );
}
