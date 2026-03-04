import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { InlineLoader, Spinner } from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Technical', 'Sports', 'Arts', 'Cultural', 'Academic', 'Social'];
const catColors = {
  Technical: { bg: '#dbeafe', text: '#1e40af' }, Sports: { bg: '#dcfce7', text: '#166534' },
  Arts: { bg: '#fce7f3', text: '#9d174d' }, Cultural: { bg: '#fef3c7', text: '#92400e' },
  Academic: { bg: '#ede9fe', text: '#5b21b6' }, Social: { bg: '#ffedd5', text: '#9a3412' },
};

function ClubCard({ club, onJoinLeave }) {
  const [actionLoading, setActionLoading] = useState(false);
  const { addToast } = useToast();
  const c = catColors[club.category] || { bg: '#f0ebe2', text: '#4a5568' };

  const handleAction = async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const endpoint = club.isMember ? `/clubs/${club._id}/leave` : `/clubs/${club._id}/join`;
      const { data } = await api.post(endpoint);
      addToast(data.message, 'success');
      onJoinLeave(club._id, !club.isMember, data.totalMembers);
    } catch (err) {
      addToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Cover image */}
      <div style={{ height: 140, overflow: 'hidden', background: '#f0ebe2', position: 'relative' }}>
        {club.coverImage ? (
          <img src={club.coverImage} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'linear-gradient(135deg, #e8e0d0, #d4c9b4)' }}>🏛️</div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span className="badge" style={{ background: c.bg, color: c.text }}>{club.category}</span>
        </div>
        {club.isMember && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: '#0f1b2d', color: '#c9a84c', fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>
            ✓ MEMBER
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: '#0f1b2d', marginBottom: 6, lineHeight: 1.3 }}>
          {club.name}
        </h3>
        <p style={{ color: '#718096', fontSize: '0.8rem', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {club.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <div style={{ fontSize: '0.78rem', color: '#4a5568' }}>
            👥 <strong>{club.totalMembers}</strong> members
          </div>
          <button
            onClick={handleAction}
            disabled={actionLoading}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: club.isMember ? '1.5px solid #fca5a5' : '1.5px solid rgba(201,168,76,0.3)',
              background: club.isMember ? '#fef2f2' : 'linear-gradient(135deg, #1a2d4a, #0f1b2d)',
              color: club.isMember ? '#c53030' : '#e8c97a',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {actionLoading ? <Spinner size={12} color={club.isMember ? '#c53030' : '#e8c97a'} /> : null}
            {club.isMember ? 'Leave Club' : 'Join Club'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      const { data } = await api.get(`/clubs?${params}`);
      setClubs(data.clubs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(fetchClubs, 300);
    return () => clearTimeout(timer);
  }, [fetchClubs]);

  const handleJoinLeave = (clubId, isMember, totalMembers) => {
    setClubs((prev) =>
      prev.map((c) => c._id === clubId ? { ...c, isMember, totalMembers } : c)
    );
  };

  const displayedClubs = activeTab === 'mine' ? clubs.filter((c) => c.isMember) : clubs;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1200 }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.7rem', color: '#0f1b2d', marginBottom: 4 }}>
          🏛️ Societies & Clubs
        </h2>
        <p style={{ color: '#718096', fontSize: '0.875rem' }}>
          Discover student organizations and expand your university experience
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0ebe2', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ key: 'all', label: `All Clubs (${clubs.length})` }, { key: 'mine', label: `My Clubs (${clubs.filter((c) => c.isMember).length})` }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#0f1b2d' : '#718096',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
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
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ maxWidth: 260 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            const c = catColors[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: active ? 'none' : '1.5px solid #e2ddd5',
                  background: active ? (c ? c.bg : '#0f1b2d') : 'transparent',
                  color: active ? (c ? c.text : '#fff') : '#718096',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <InlineLoader text="Loading clubs..." />
      ) : displayedClubs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🏛️</span>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: '#0f1b2d', marginBottom: 8 }}>
            {activeTab === 'mine' ? 'You haven\'t joined any clubs yet' : 'No clubs found'}
          </h3>
          <p style={{ fontSize: '0.85rem' }}>
            {activeTab === 'mine' ? 'Browse all clubs and find something you\'re passionate about' : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }} className="stagger-children">
          {displayedClubs.map((club) => (
            <ClubCard key={club._id} club={club} onJoinLeave={handleJoinLeave} />
          ))}
        </div>
      )}
    </div>
  );
}
