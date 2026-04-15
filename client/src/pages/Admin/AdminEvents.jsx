// client/src/pages/admin/AdminEvents.jsx
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, InlineLoader } from '../../components/LoadingSpinner';
import EventQRModal from '../../components/EventQRModal';

const EVENT_TYPES = ['Workshop', 'Seminar', 'Competition', 'Social', 'Sports', 'Cultural'];

const TYPE_COLORS = {
  Workshop:    { bg: 'rgba(13,110,253,0.1)',  color: '#0d6efd' },
  Seminar:     { bg: 'rgba(29,47,111,0.1)',   color: '#1d2f6f' },
  Competition: { bg: 'rgba(220,53,69,0.1)',   color: '#dc3545' },
  Social:      { bg: 'rgba(25,135,84,0.1)',   color: '#198754' },
  Sports:      { bg: 'rgba(253,126,20,0.1)',  color: '#fd7e14' },
  Cultural:    { bg: 'rgba(111,66,193,0.1)',  color: '#6f42c1' },
};

const EMPTY_FORM = {
  title: '', description: '', organizerName: '', eventType: 'Workshop',
  date: '', time: '', venue: '', maxCapacity: '', isRegistrationOpen: true,
};

export default function AdminEvents() {
  const { showToast } = useToast();

  const [qrEvent, setQrEvent] = useState(null);           // ← QR modal state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Registrations modal
  const [regModal, setRegModal] = useState(null);
  const [regData, setRegData] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regSearch, setRegSearch] = useState('');

  // ── Fetch all events — FIX: handle all response shapes ──
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      const list = res.data.events || res.data.data || res.data;
      setEvents(Array.isArray(list) ? list : []);
    } catch {
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Open registrations modal ──
  const openRegistrations = async (event) => {
    setRegModal({ eventId: event._id, eventTitle: event.title });
    setRegData(null);
    setRegSearch('');
    setRegLoading(true);
    try {
      const res = await api.get(`/admin/events/${event._id}/registrations`);
      setRegData(res.data.data);
    } catch {
      showToast('Failed to load registrations', 'error');
      setRegModal(null);
    } finally {
      setRegLoading(false);
    }
  };

  // ── Open create modal ──
  const openCreate = () => {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  // ── Open edit modal ──
  const openEdit = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || '',
      description: event.description || '',
      organizerName: event.organizerName || '',
      eventType: event.eventType || 'Workshop',
      date: event.date ? event.date.split('T')[0] : '',
      time: event.time || '',
      venue: event.venue || '',
      maxCapacity: event.maxCapacity || '',
      isRegistrationOpen: event.isRegistrationOpen ?? true,
    });
    setModalOpen(true);
  };

  // ── Save (create / edit) — FIX: removed misplaced QR modal JSX ──
  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.venue.trim()) {
      showToast('Title, date, and venue are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingEvent) {
        const res = await api.put(`/admin/events/${editingEvent._id}`, form);
        setEvents(prev => prev.map(e => e._id === editingEvent._id ? (res.data.data || res.data) : e));
        showToast('Event updated successfully', 'success');
      } else {
        const res = await api.post('/admin/events', form);
        const newEvent = res.data.event || res.data.data || res.data;
        setEvents(prev => [newEvent, ...prev]);
        showToast('Event created successfully', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save event', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/events/${deleteId}`);
      setEvents(prev => prev.filter(e => e._id !== deleteId));
      showToast('Event deleted', 'success');
      setDeleteId(null);
    } catch {
      showToast('Failed to delete event', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtered events ──
  const now = new Date();
  const filtered = events.filter(e => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || e.title.toLowerCase().includes(q) || (e.organizerName && e.organizerName.toLowerCase().includes(q)) || e.venue.toLowerCase().includes(q);
    const matchType = !filterType || e.eventType === filterType;
    const isPast = new Date(e.date) < now;
    const matchStatus = !filterStatus ? true : filterStatus === 'upcoming' ? !isPast : isPast;
    return matchSearch && matchType && matchStatus;
  });

  if (loading) return <PageLoader />;

  // ── Filtered registrations ──
  const filteredReg = (regData?.registrations || []).filter(s => {
    if (!regSearch) return true;
    const q = regSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.universityEmail.toLowerCase().includes(q) || (s.department && s.department.toLowerCase().includes(q));
  });

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <input type="text" placeholder="Search events..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: '1 1 200px', padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)', background: '#fff' }}
            onFocus={e => (e.target.style.borderColor = 'var(--blue-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />

          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
            <option value="">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>

        <button onClick={openCreate}
          style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
          + New Event
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.875rem' }}>
        {filtered.length} event{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📅</div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No events found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map(event => {
            const isPast = new Date(event.date) < now;
            const tc = TYPE_COLORS[event.eventType] || TYPE_COLORS.Workshop;
            const regCount = event.registeredStudents?.length || 0;
            const capacity = event.maxCapacity;
            const pct = capacity ? Math.round((regCount / capacity) * 100) : 0;

            return (
              <div key={event._id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(1,8,24,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                {/* Card top accent */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${tc.color}, ${tc.color}88)` }} />

                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Type badge + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ background: tc.bg, color: tc.color, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {event.eventType}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isPast ? 'var(--text-muted)' : 'var(--success)', background: isPast ? 'var(--bg-page)' : 'rgba(25,135,84,0.08)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                      {isPast ? 'Past' : 'Upcoming'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--dark-primary)', margin: '0 0 0.5rem', lineHeight: 1.3 }}>
                    {event.title}
                  </h3>

                  {/* Meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📅 {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {event.time && ` · ${event.time}`}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {event.venue}</span>
                    {event.organizerName && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🏛️ {event.organizerName}</span>
                    )}
                  </div>

                  {/* Registration progress */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registrations</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {regCount}{capacity ? ` / ${capacity}` : ''}
                      </span>
                    </div>
                    {capacity > 0 && (
                      <div style={{ height: 5, background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct >= 90 ? 'var(--error)' : pct >= 60 ? '#fd7e14' : 'var(--blue-primary)', borderRadius: '99px', transition: 'width 0.4s' }} />
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openRegistrations(event)}
                      style={{ flex: 1, padding: '0.5rem 0.5rem', borderRadius: '7px', border: '1.5px solid var(--blue-primary)', background: 'var(--blue-tint)', color: 'var(--blue-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-primary)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue-tint)'; e.currentTarget.style.color = 'var(--blue-primary)'; }}>
                      👥 Registrations ({regCount})
                    </button>
                    <button onClick={() => openEdit(event)}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1.5px solid var(--border)', background: '#fff', color: 'var(--text-body)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-primary)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(event._id)}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1.5px solid rgba(220,53,69,0.25)', background: 'rgba(220,53,69,0.06)', color: 'var(--error)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,53,69,0.06)'; e.currentTarget.style.color = 'var(--error)'; }}>
                      Delete
                    </button>
                    {/* ── QR Button ── */}
                    <button
                      onClick={() => setQrEvent(event)}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1.5px solid var(--blue-primary)', background: 'var(--blue-tint)', color: 'var(--blue-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-primary)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue-tint)'; e.currentTarget.style.color = 'var(--blue-primary)'; }}>
                      📲 QR
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── QR Modal — FIX: moved here from inside handleSave ── */}
      {qrEvent && (
        <EventQRModal
          event={qrEvent}
          onClose={() => setQrEvent(null)}
        />
      )}

      {/* ── Registrations Modal ── */}
      {regModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setRegModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#fff' }}>
                  {regData?.eventTitle || regModal.eventTitle}
                </h3>
                {regData?.eventDate && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                    📅 {new Date(regData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <button onClick={() => setRegModal(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ×
              </button>
            </div>

            {/* Search within registrations */}
            {!regLoading && regData && (
              <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-page)' }}>
                <input type="text" placeholder="Search registered students..."
                  value={regSearch} onChange={e => setRegSearch(e.target.value)}
                  style={{ flex: 1, padding: '0.45rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: '7px', fontSize: '0.82rem', outline: 'none', background: '#fff', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue-primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {filteredReg.length} / {regData.registrations.length} students
                </span>
              </div>
            )}

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {regLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                  <InlineLoader />
                </div>
              ) : !regData?.registrations?.length ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.625rem' }}>🎟️</div>
                  <p style={{ margin: 0, fontWeight: 500 }}>No registrations yet</p>
                </div>
              ) : filteredReg.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No students match your search</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                      {['#', 'Student', 'Department', 'Year', 'Student ID'].map(h => (
                        <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReg.map((student, i) => (
                      <tr key={student._id || i}
                        style={{ borderBottom: i < filteredReg.length - 1 ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-page)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{student.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student.universityEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: 'var(--blue-tint)', color: 'var(--dark-accent)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {student.department || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-body)' }}>
                          {student.year ? `Year ${student.year}` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {student.studentId || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-page)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setRegModal(null)}
                style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Event Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !saving && setModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: '1.1rem' }}>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button onClick={() => !saving && setModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Event Title *">
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Spring Tech Expo" style={inputStyle} />
                  </FormField>
                </div>

                <FormField label="Event Type">
                  <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} style={inputStyle}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>

                <FormField label="Organizer Name">
                  <input value={form.organizerName} onChange={e => setForm(f => ({ ...f, organizerName: e.target.value }))}
                    placeholder="e.g. CS Department" style={inputStyle} />
                </FormField>

                <FormField label="Date *">
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </FormField>

                <FormField label="Time">
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
                </FormField>

                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Venue *">
                    <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                      placeholder="e.g. Auditorium Block B" style={inputStyle} />
                  </FormField>
                </div>

                <FormField label="Max Capacity">
                  <input type="number" min="1" value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))}
                    placeholder="Leave blank for unlimited" style={inputStyle} />
                </FormField>

                <FormField label="Registration Status">
                  <select value={form.isRegistrationOpen} onChange={e => setForm(f => ({ ...f, isRegistrationOpen: e.target.value === 'true' }))} style={inputStyle}>
                    <option value="true">Open</option>
                    <option value="false">Closed</option>
                  </select>
                </FormField>

                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Description">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Event description..." rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }} />
                  </FormField>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'var(--bg-page)' }}>
              <button onClick={() => !saving && setModalOpen(false)} disabled={saving}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500, color: 'var(--text-body)', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => !deleting && setDeleteId(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,53,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem' }}>🗑️</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 0.5rem', color: 'var(--dark-primary)', fontSize: '1.2rem' }}>Delete Event?</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              This will permanently delete the event and all registration data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} disabled={deleting}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500, color: 'var(--text-body)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '0.625rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--error)', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ───────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.375rem' }}>{label}</label>
      {children}
    </div>
  );
}

const selectStyle = {
  padding: '0.55rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px',
  fontSize: '0.875rem', background: '#fff', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
};

const inputStyle = {
  width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid var(--border)',
  borderRadius: '8px', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)',
  background: '#fff', boxSizing: 'border-box',
};