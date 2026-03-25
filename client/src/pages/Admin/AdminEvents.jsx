import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { InlineLoader, Spinner } from '../../components/LoadingSpinner';

const EVENT_TYPES = ['Workshop', 'Seminar', 'Competition', 'Social', 'Sports', 'Cultural'];
const typeColors = {
  Workshop: { bg: 'rgb(231,237,254)', text: 'rgb(29,47,111)' },
  Seminar: { bg: 'rgb(210,224,255)', text: 'rgb(29,47,111)' },
  Competition: { bg: 'rgb(244,240,250)', text: 'rgb(72,39,40)' },
  Social: { bg: 'rgb(233,236,239)', text: 'rgb(51,51,51)' },
  Sports: { bg: 'rgb(209,231,221)', text: 'rgb(13,62,2)' },
  Cultural: { bg: 'rgb(255,243,205)', text: 'rgb(102,77,3)' },
};

const emptyForm = {
  title: '', description: '', eventType: 'Workshop',
  date: '', time: '', venue: '', maxCapacity: 50,
  coverImage: '', organizerName: '', isRegistrationOpen: true,
};

function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState(event ? {
    ...event,
    date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
  } : emptyForm);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.venue) {
      addToast('Please fill in all required fields', 'error'); return;
    }
    setLoading(true);
    try {
      let data;
      if (event?._id) {
        const res = await api.put(`/admin/events/${event._id}`, form);
        data = res.data;
        addToast('Event updated successfully', 'success');
      } else {
        const res = await api.post('/admin/events', form);
        data = res.data;
        addToast('Event created successfully', 'success');
      }
      onSave(data.event, !!event?._id);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save event', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(233,236,239)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'rgb(1,8,24)', fontSize: '1.1rem' }}>
            {event?._id ? 'Edit Event' : '+ Create New Event'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'rgb(126,126,126)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Event Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Annual Hackathon 2025"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Event Type *</label>
              <select name="eventType" value={form.eventType} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', appearance: 'none' }}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Max Capacity *</label>
              <input type="number" name="maxCapacity" value={form.maxCapacity} onChange={handleChange} min={1}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Date *</label>
              <input type="date" name="date" value={form.date} onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Time *</label>
              <input name="time" value={form.time} onChange={handleChange} placeholder="e.g. 10:00 AM"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Venue *</label>
            <input name="venue" value={form.venue} onChange={handleChange} placeholder="e.g. Main Auditorium"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Organizer Name</label>
            <input name="organizerName" value={form.organizerName} onChange={handleChange} placeholder="Club or department name"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Cover Image URL</label>
            <input name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="https://..."
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Event details..." rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', resize: 'none' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: 'rgb(51,51,51)' }}>
            <input type="checkbox" name="isRegistrationOpen" checked={form.isRegistrationOpen} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'rgb(13,110,253)' }} />
            Registration is open
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'rgb(13,110,253)', color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading ? <Spinner size={14} color="#fff" /> : null}
              {event?._id ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { addToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events');
      setEvents(data.events);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSave = (event, isEdit) => {
    if (isEdit) setEvents((prev) => prev.map((e) => e._id === event._id ? event : e));
    else setEvents((prev) => [event, ...prev]);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/events/${deleteConfirm._id}`);
      setEvents((prev) => prev.filter((e) => e._id !== deleteConfirm._id));
      addToast('Event deleted', 'success');
      setDeleteConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete', 'error');
    } finally { setDeleteLoading(false); }
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100 }} className="animate-fade-in">
      {showModal && <EventModal event={editEvent} onClose={() => { setShowModal(false); setEditEvent(null); }} onSave={handleSave} />}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'rgb(1,8,24)', marginBottom: 12 }}>Delete Event?</h3>
            <p style={{ color: 'rgb(88,85,94)', fontSize: '0.875rem', marginBottom: 24 }}>
              Delete <strong>{deleteConfirm.title}</strong>? All registrations will be removed.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'rgb(220,53,69)', color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>📅 Manage Events</h2>
          <p style={{ color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>Create, edit and remove university events</p>
        </div>
        <button onClick={() => { setEditEvent(null); setShowModal(true); }} style={{ padding: '10px 20px', background: 'rgb(13,110,253)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
          + Create Event
        </button>
      </div>

      {loading ? <InlineLoader text="Loading events..." /> : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgb(126,126,126)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📅</div>
          <p>No events yet. Create the first one!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((event) => {
            const c = typeColors[event.eventType] || { bg: 'rgb(233,236,239)', text: 'rgb(51,51,51)' };
            const isPast = new Date(event.date) < new Date();
            return (
              <div key={event._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid rgb(222,226,230)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: isPast ? 0.7 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgb(239,243,249)' }}>
                  {event.coverImage
                    ? <img src={event.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📅</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', color: 'rgb(1,8,24)' }}>{event.title}</h3>
                    <span style={{ background: c.bg, color: c.text, fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>{event.eventType}</span>
                    {isPast && <span style={{ background: 'rgb(233,236,239)', color: 'rgb(88,85,94)', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>PAST</span>}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'rgb(126,126,126)' }}>
                    📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {event.time} · 📍 {event.venue}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)', marginTop: 2 }}>
                    👥 {event.registeredStudents?.length || 0}/{event.maxCapacity} registered
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => { setEditEvent(event); setShowModal(true); }}
                    style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid rgb(210,224,255)', background: 'rgb(231,237,254)', color: 'rgb(29,47,111)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(event)}
                    style={{ padding: '7px 10px', borderRadius: 7, border: '1.5px solid rgba(220,53,69,0.3)', background: '#fef2f2', color: 'rgb(220,53,69)', fontSize: '0.78rem', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}