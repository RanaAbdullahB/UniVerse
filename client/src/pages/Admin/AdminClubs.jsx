import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { InlineLoader, Spinner } from '../../components/LoadingSpinner';
import { exportClubMembers } from '../../utils/csvExport';

const CATEGORIES = ['Technical', 'Sports', 'Arts', 'Cultural', 'Academic', 'Social'];
const catColors = {
  Technical: { bg: 'rgb(231,237,254)', text: 'rgb(29,47,111)' },
  Sports:    { bg: 'rgb(209,231,221)', text: 'rgb(13,62,2)' },
  Arts:      { bg: 'rgb(244,240,250)', text: 'rgb(72,39,40)' },
  Cultural:  { bg: 'rgb(255,243,205)', text: 'rgb(102,77,3)' },
  Academic:  { bg: 'rgb(210,224,255)', text: 'rgb(29,47,111)' },
  Social:    { bg: 'rgb(233,236,239)', text: 'rgb(51,51,51)' },
};

const emptyForm = { name: '', description: '', category: 'Technical', presidentName: '', presidentEmail: '', coverImage: '' };

// ── Create / Edit Modal ───────────────────────────────────────
function ClubModal({ club, onClose, onSave }) {
  const [form, setForm] = useState(club || emptyForm);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.presidentName || !form.presidentEmail) {
      addToast('Please fill in all required fields', 'error'); return;
    }
    setLoading(true);
    try {
      let data;
      if (club?._id) {
        const res = await api.put(`/admin/clubs/${club._id}`, form);
        data = res.data;
        addToast('Club updated successfully', 'success');
      } else {
        const res = await api.post('/admin/clubs', form);
        data = res.data;
        addToast('Club created successfully', 'success');
      }
      onSave(data.club, !!club?._id);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save club', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(233,236,239)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'rgb(1,8,24)', fontSize: '1.1rem' }}>
            {club?._id ? 'Edit Club' : '+ Create New Club'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'rgb(126,126,126)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Club Name *',       name: 'name',          placeholder: 'e.g. CS Programming Club' },
            { label: 'Cover Image URL',   name: 'coverImage',    placeholder: 'https://...' },
            { label: 'President Name *',  name: 'presidentName', placeholder: 'Full name' },
            { label: 'President Email *', name: 'presidentEmail', placeholder: 'president@lgu.edu.pk', type: 'email' },
          ].map(({ label, name, placeholder, type }) => (
            <div key={name}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>{label}</label>
              <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} type={type || 'text'}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Category *</label>
            <select name="category" value={form.category} onChange={handleChange}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the club..." rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'rgb(13,110,253)', color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading ? <Spinner size={14} color="#fff" /> : null}
              {club?._id ? 'Save Changes' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Inline Member Panel ───────────────────────────────────────
function MemberPanel({ club }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    api.get(`/admin/clubs/${club._id}/members`)
      .then(res => setMembers(res.data.data?.members || []))
      .catch(() => addToast('Failed to load members', 'error'))
      .finally(() => setLoading(false));
  }, [club._id]);

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name?.toLowerCase().includes(q) ||
           m.universityEmail?.toLowerCase().includes(q) ||
           m.department?.toLowerCase().includes(q);
  });

  return (
    <div style={{
      borderTop: '1px solid rgb(222,226,230)',
      background: 'rgb(248,249,250)',
      animation: 'expandDown 0.2s ease',
    }}>
      <style>{`@keyframes expandDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Panel header */}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid rgb(222,226,230)' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgb(29,47,111)' }}>
          👥 {members.length} Member{members.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '4px 10px', border: '1.5px solid rgb(222,226,230)', borderRadius: 6, fontSize: '0.75rem', outline: 'none', background: '#fff', minWidth: 120 }}
            onFocus={e => (e.target.style.borderColor = 'rgb(13,110,253)')}
            onBlur={e => (e.target.style.borderColor = 'rgb(222,226,230)')}
          />
          {members.length > 0 && (
            <button
              onClick={() => exportClubMembers(filtered, club.name)}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1.5px solid rgb(222,226,230)', background: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 500, color: 'rgb(88,85,94)', whiteSpace: 'nowrap', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgb(13,110,253)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgb(222,226,230)')}>
              ⬇️ CSV
            </button>
          )}
        </div>
      </div>

      {/* Member list */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
            <InlineLoader text="Loading members..." />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgb(126,126,126)', fontSize: '0.8rem' }}>
            {members.length === 0 ? 'No members yet' : 'No members match your search'}
          </div>
        ) : (
          filtered.map((member, i) => (
            <div key={member._id || i}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: i < filtered.length - 1 ? '1px solid rgb(233,236,239)' : 'none', background: '#fff', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgb(248,249,250)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>

              {/* Avatar */}
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, rgb(29,47,111), rgb(13,110,253))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                {member.name?.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'rgb(33,37,41)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgb(126,126,126)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.universityEmail}</div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {member.year && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgb(231,237,254)', color: 'rgb(29,47,111)' }}>
                    Yr {member.year}
                  </span>
                )}
                {member.department && (
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgb(233,236,239)', color: 'rgb(88,85,94)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.department}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClub, setEditClub] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedClub, setExpandedClub] = useState(null); // club._id of open panel
  const { addToast } = useToast();

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clubs');
      setClubs(data.clubs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClubs(); }, [fetchClubs]);

  const handleSave = (club, isEdit) => {
    if (isEdit) setClubs(prev => prev.map(c => c._id === club._id ? club : c));
    else setClubs(prev => [club, ...prev]);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/clubs/${deleteConfirm._id}`);
      setClubs(prev => prev.filter(c => c._id !== deleteConfirm._id));
      if (expandedClub === deleteConfirm._id) setExpandedClub(null);
      addToast('Club deleted', 'success');
      setDeleteConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete', 'error');
    } finally { setDeleteLoading(false); }
  };

  const toggleMembers = (clubId) => {
    setExpandedClub(prev => prev === clubId ? null : clubId);
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100 }} className="animate-fade-in">
      {showModal && (
        <ClubModal
          club={editClub}
          onClose={() => { setShowModal(false); setEditClub(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'rgb(1,8,24)', marginBottom: 12 }}>Delete Club?</h3>
            <p style={{ color: 'rgb(88,85,94)', fontSize: '0.875rem', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? All members will be removed.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'rgb(220,53,69)', color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>🏛️ Manage Clubs</h2>
          <p style={{ color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>Create, edit, remove clubs and view their members</p>
        </div>
        <button onClick={() => { setEditClub(null); setShowModal(true); }}
          style={{ padding: '10px 20px', background: 'rgb(13,110,253)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
          + Create Club
        </button>
      </div>

      {loading ? (
        <InlineLoader text="Loading clubs..." />
      ) : clubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgb(126,126,126)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏛️</div>
          <p>No clubs yet. Create the first one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {clubs.map((club) => {
            const c = catColors[club.category] || { bg: 'rgb(233,236,239)', text: 'rgb(51,51,51)' };
            const isExpanded = expandedClub === club._id;

            return (
              <div key={club._id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${isExpanded ? 'rgb(13,110,253)' : 'rgb(222,226,230)'}`, overflow: 'hidden', boxShadow: isExpanded ? '0 4px 20px rgba(13,110,253,0.12)' : '0 1px 4px rgba(0,0,0,0.06)', transition: 'border-color 0.2s, box-shadow 0.2s' }}>

                {/* Cover image */}
                <div style={{ height: 100, overflow: 'hidden', background: 'rgb(239,243,249)', position: 'relative' }}>
                  {club.coverImage
                    ? <img src={club.coverImage} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏛️</div>
                  }
                  <span style={{ position: 'absolute', top: 8, left: 8, background: c.bg, color: c.text, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {club.category}
                  </span>
                </div>

                {/* Club info */}
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>{club.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)', marginBottom: 2 }}>👤 {club.presidentName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)', marginBottom: 12 }}>👥 {club.totalMembers} members</p>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Members toggle */}
                    <button
                      onClick={() => toggleMembers(club._id)}
                      style={{
                        flex: 1, padding: '7px 6px', borderRadius: 7,
                        border: `1.5px solid ${isExpanded ? 'rgb(13,110,253)' : 'rgb(222,226,230)'}`,
                        background: isExpanded ? 'rgb(13,110,253)' : 'rgb(248,249,250)',
                        color: isExpanded ? '#fff' : 'rgb(88,85,94)',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                      onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.background = 'rgb(231,237,254)'; e.currentTarget.style.borderColor = 'rgb(13,110,253)'; e.currentTarget.style.color = 'rgb(29,47,111)'; } }}
                      onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.background = 'rgb(248,249,250)'; e.currentTarget.style.borderColor = 'rgb(222,226,230)'; e.currentTarget.style.color = 'rgb(88,85,94)'; } }}>
                      {isExpanded ? '▲ Hide Members' : `👥 Members (${club.totalMembers})`}
                    </button>

                    {/* Edit */}
                    <button onClick={() => { setEditClub(club); setShowModal(true); }}
                      style={{ padding: '7px 10px', borderRadius: 7, border: '1.5px solid rgb(210,224,255)', background: 'rgb(231,237,254)', color: 'rgb(29,47,111)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      ✏️
                    </button>

                    {/* Delete */}
                    <button onClick={() => setDeleteConfirm(club)}
                      style={{ padding: '7px 10px', borderRadius: 7, border: '1.5px solid rgba(220,53,69,0.3)', background: '#fef2f2', color: 'rgb(220,53,69)', fontSize: '0.78rem', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Inline member panel — expands below */}
                {isExpanded && <MemberPanel club={club} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}