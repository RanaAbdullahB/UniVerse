import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { InlineLoader, Spinner } from '../../components/LoadingSpinner';

const CATEGORIES = ['Technical', 'Sports', 'Arts', 'Cultural', 'Academic', 'Social'];
const catColors = {
  Technical: { bg: 'rgb(231,237,254)', text: 'rgb(29,47,111)' },
  Sports: { bg: 'rgb(209,231,221)', text: 'rgb(13,62,2)' },
  Arts: { bg: 'rgb(244,240,250)', text: 'rgb(72,39,40)' },
  Cultural: { bg: 'rgb(255,243,205)', text: 'rgb(102,77,3)' },
  Academic: { bg: 'rgb(210,224,255)', text: 'rgb(29,47,111)' },
  Social: { bg: 'rgb(233,236,239)', text: 'rgb(51,51,51)' },
};

const emptyForm = { name: '', description: '', category: 'Technical', presidentName: '', presidentEmail: '', coverImage: '' };

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
            { label: 'Club Name *', name: 'name', placeholder: 'e.g. CS Programming Club' },
            { label: 'Cover Image URL', name: 'coverImage', placeholder: 'https://...' },
            { label: 'President Name *', name: 'presidentName', placeholder: 'Full name' },
            { label: 'President Email *', name: 'presidentEmail', placeholder: 'president@lgu.edu.pk', type: 'email' },
          ].map(({ label, name, placeholder, type }) => (
            <div key={name}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>{label}</label>
              <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} type={type || 'text'}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Category *</label>
            <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', appearance: 'none' }}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'rgb(88,85,94)', marginBottom: 5 }}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the club..." rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid rgb(222,226,230)', borderRadius: 8, fontSize: '0.875rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'rgb(13,110,253)', color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading ? <Spinner size={14} color="#fff" /> : null}
              {club?._id ? 'Save Changes' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClub, setEditClub] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    if (isEdit) setClubs((prev) => prev.map((c) => c._id === club._id ? club : c));
    else setClubs((prev) => [club, ...prev]);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/clubs/${deleteConfirm._id}`);
      setClubs((prev) => prev.filter((c) => c._id !== deleteConfirm._id));
      addToast('Club deleted', 'success');
      setDeleteConfirm(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete', 'error');
    } finally { setDeleteLoading(false); }
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100 }} className="animate-fade-in">
      {showModal && <ClubModal club={editClub} onClose={() => { setShowModal(false); setEditClub(null); }} onSave={handleSave} />}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'rgb(1,8,24)', marginBottom: 12 }}>Delete Club?</h3>
            <p style={{ color: 'rgb(88,85,94)', fontSize: '0.875rem', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? All members will be removed.
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
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>🏛️ Manage Clubs</h2>
          <p style={{ color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>Create, edit and remove student clubs</p>
        </div>
        <button onClick={() => { setEditClub(null); setShowModal(true); }} style={{ padding: '10px 20px', background: 'rgb(13,110,253)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
          + Create Club
        </button>
      </div>

      {loading ? <InlineLoader text="Loading clubs..." /> : clubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgb(126,126,126)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏛️</div>
          <p>No clubs yet. Create the first one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {clubs.map((club) => {
            const c = catColors[club.category] || { bg: 'rgb(233,236,239)', text: 'rgb(51,51,51)' };
            return (
              <div key={club._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid rgb(222,226,230)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ height: 100, overflow: 'hidden', background: 'rgb(239,243,249)', position: 'relative' }}>
                  {club.coverImage
                    ? <img src={club.coverImage} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏛️</div>
                  }
                  <span style={{ position: 'absolute', top: 8, left: 8, background: c.bg, color: c.text, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {club.category}
                  </span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>{club.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)', marginBottom: 4 }}>👤 {club.presidentName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)', marginBottom: 12 }}>👥 {club.totalMembers} members</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditClub(club); setShowModal(true); }}
                      style={{ flex: 1, padding: '7px', borderRadius: 7, border: '1.5px solid rgb(210,224,255)', background: 'rgb(231,237,254)', color: 'rgb(29,47,111)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(club)}
                      style={{ padding: '7px 12px', borderRadius: 7, border: '1.5px solid rgba(220,53,69,0.3)', background: '#fef2f2', color: 'rgb(220,53,69)', fontSize: '0.78rem', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}