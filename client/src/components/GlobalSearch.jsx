// client/src/components/GlobalSearch.jsx
// Global search modal — searches clubs, events, study groups, students
//
// Usage: Add a search button/icon to Navbar.jsx that toggles this modal.
// Pass onTabChange so clicking a result navigates to the right section.
//
// Example in Navbar.jsx:
//   import GlobalSearch from './GlobalSearch';
//   const [searchOpen, setSearchOpen] = useState(false);
//   <button onClick={() => setSearchOpen(true)}>🔍 Search</button>
//   {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} onTabChange={onTabChange} />}

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

const TYPE_CONFIG = {
  clubs:    { icon: '🏛️', label: 'Club',        color: 'var(--dark-accent)',  bg: 'rgba(29,47,111,0.08)',  tab: 'clubs' },
  events:   { icon: '📅', label: 'Event',       color: 'var(--success)',       bg: 'rgba(25,135,84,0.08)', tab: 'events' },
  groups:   { icon: '📚', label: 'Study Group', color: 'var(--blue-primary)',  bg: 'rgba(13,110,253,0.08)', tab: 'studygroups' },
  students: { icon: '🎓', label: 'Student',     color: '#fd7e14',              bg: 'rgba(253,126,20,0.08)', tab: null },
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch({ onClose, onTabChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  // Auto-focus input on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(debouncedQuery)}&type=${activeFilter}`)
      .then(res => setResults(res.data.data))
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debouncedQuery, activeFilter]);

  const handleResultClick = (type) => {
    const tab = TYPE_CONFIG[type]?.tab;
    if (tab && onTabChange) onTabChange(tab);
    onClose();
  };

  const totalResults = results
    ? (results.clubs?.length || 0) + (results.events?.length || 0) + (results.groups?.length || 0) + (results.students?.length || 0)
    : 0;

  const hasResults = results && totalResults > 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000, padding: '4rem 1rem 1rem', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(1,8,24,0.35)' }}
        onClick={e => e.stopPropagation()}>

        {/* Search input */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clubs, events, study groups, students..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', background: 'transparent' }}
          />
          {loading && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Searching...</span>}
          {query && (
            <button onClick={() => setQuery('')}
              style={{ background: 'var(--border)', border: 'none', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ×
            </button>
          )}
          <button onClick={onClose}
            style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            Esc
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 1rem', background: 'var(--bg-page)' }}>
          {['all', 'clubs', 'events', 'groups', 'students'].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              style={{
                padding: '0.55rem 0.875rem', border: 'none', borderBottom: activeFilter === f ? '2px solid var(--blue-primary)' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer', fontSize: '0.78rem',
                fontWeight: activeFilter === f ? 700 : 400,
                color: activeFilter === f ? 'var(--blue-primary)' : 'var(--text-muted)',
                textTransform: 'capitalize', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
              {f === 'all' ? '✦ All' : `${TYPE_CONFIG[f]?.icon} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Results body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Empty state */}
          {!query || query.length < 2 ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.625rem' }}>🔍</div>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>Type to search across UniVerse</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {['Clubs', 'Events', 'Study Groups', 'Students'].map(s => (
                  <span key={s} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s}</span>
                ))}
              </div>
            </div>
          ) : !hasResults && !loading ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.625rem' }}>😕</div>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>No results for "{query}"</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>Try different keywords</p>
            </div>
          ) : hasResults ? (
            <div>
              {/* Clubs */}
              {results.clubs?.length > 0 && (activeFilter === 'all' || activeFilter === 'clubs') && (
                <ResultSection title="Clubs" icon="🏛️" color="var(--dark-accent)">
                  {results.clubs.map(club => (
                    <ResultRow key={club._id} onClick={() => handleResultClick('clubs')}
                      avatar={club.coverImage} avatarFallback="🏛️"
                      title={club.name}
                      subtitle={`${club.category} · ${club.totalMembers || 0} members`}
                      badge={club.category} badgeColor="var(--dark-accent)" badgeBg="rgba(29,47,111,0.08)" />
                  ))}
                </ResultSection>
              )}

              {/* Events */}
              {results.events?.length > 0 && (activeFilter === 'all' || activeFilter === 'events') && (
                <ResultSection title="Events" icon="📅" color="var(--success)">
                  {results.events.map(event => (
                    <ResultRow key={event._id} onClick={() => handleResultClick('events')}
                      avatarFallback="📅"
                      title={event.title}
                      subtitle={`${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${event.venue}`}
                      badge={event.eventType} badgeColor="var(--success)" badgeBg="rgba(25,135,84,0.08)" />
                  ))}
                </ResultSection>
              )}

              {/* Study Groups */}
              {results.groups?.length > 0 && (activeFilter === 'all' || activeFilter === 'groups') && (
                <ResultSection title="Study Groups" icon="📚" color="var(--blue-primary)">
                  {results.groups.map(group => (
                    <ResultRow key={group._id} onClick={() => handleResultClick('groups')}
                      avatarFallback="📚"
                      title={group.name}
                      subtitle={`${group.subject} · ${group.department} · ${group.members?.length || 0}/${group.maxMembers} members`}
                      badge={group.semester} badgeColor="var(--blue-primary)" badgeBg="rgba(13,110,253,0.08)" />
                  ))}
                </ResultSection>
              )}

              {/* Students */}
              {results.students?.length > 0 && (activeFilter === 'all' || activeFilter === 'students') && (
                <ResultSection title="Students" icon="🎓" color="#fd7e14">
                  {results.students.map((student, i) => (
                    <ResultRow key={student._id || i}
                      avatar={student.profilePhoto} avatarFallback={student.name?.charAt(0).toUpperCase()}
                      title={student.name}
                      subtitle={`${student.department || 'Unknown Dept'}${student.year ? ` · Year ${student.year}` : ''}`}
                      badge={student.department ? student.department.split(' ')[0] : null}
                      badgeColor="#fd7e14" badgeBg="rgba(253,126,20,0.08)" />
                  ))}
                </ResultSection>
              )}

              {/* Total */}
              <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-page)' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────
function ResultSection({ title, icon, color, children }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-page)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.85rem' }}>{icon}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({ onClick, avatar, avatarFallback, title, subtitle, badge, badgeColor, badgeBg }) {
  return (
    <div
      onClick={onClick}
      style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-page)')}
      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>

      {/* Avatar */}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--blue-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: '1rem' }}>
        {avatar
          ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : avatarFallback}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
      </div>

      {/* Badge */}
      {badge && (
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: badgeBg, color: badgeColor, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {badge}
        </span>
      )}

      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flexShrink: 0 }}>›</span>
    </div>
  );
}