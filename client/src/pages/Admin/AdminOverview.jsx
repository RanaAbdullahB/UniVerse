import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { InlineLoader } from '../../components/LoadingSpinner';

// ── Student Profile Modal ──────────────────────────────────────────────────
function StudentProfileModal({ student, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/admin/users?search=${student.universityEmail}`);
        // Find the exact user from results
        const found = data.users.find((u) => u._id === student._id);
        setProfile(found || student);
      } catch {
        setProfile(student);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [student]);

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgb(233,236,239)' }}>
      <span style={{ fontSize: '0.8rem', color: 'rgb(126,126,126)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'rgb(33,37,41)', fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, rgb(1,8,24), rgb(29,47,111))', borderRadius: '20px 20px 0 0', padding: '28px 28px 24px', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgb(131,144,250), rgb(13,110,253))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.6rem', flexShrink: 0, border: '3px solid rgba(255,255,255,0.25)' }}>
              {student.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', marginBottom: 4 }}>{student.name}</h2>
              <span style={{ background: 'rgba(131,144,250,0.25)', color: 'rgb(152,197,255)', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                🎓 Student
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>
              Loading profile...
            </div>
          ) : (
            <>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: 'rgb(88,85,94)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Account Details
              </h3>
              <InfoRow label="Full Name" value={profile?.name} />
              <InfoRow label="University Email" value={profile?.universityEmail} />
              <InfoRow label="Student ID" value={profile?.studentId} />
              <InfoRow label="Department" value={profile?.department} />
              <InfoRow label="Year of Study" value={profile?.year ? `Year ${profile.year}` : null} />
              <InfoRow label="Role" value={profile?.role === 'admin' ? '👑 Admin' : '🎓 Student'} />
              <InfoRow
                label="Joined"
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null}
              />

              {/* Activity stats */}
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', color: 'rgb(88,85,94)', margin: '20px 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Activity
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { icon: '🏛️', label: 'Clubs', value: profile?.joinedClubs?.length ?? 0 },
                  { icon: '📅', label: 'Events', value: profile?.registeredEvents?.length ?? 0 },
                  { icon: '📚', label: 'Groups', value: profile?.joinedStudyGroups?.length ?? 0 },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'rgb(248,249,250)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgb(233,236,239)' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'rgb(1,8,24)', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgb(126,126,126)', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid rgb(233,236,239)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 24px', borderRadius: 8, border: '1.5px solid rgb(222,226,230)', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '0.875rem', color: 'rgb(51,51,51)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Clickable Stat Card ────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 12,
        border: `1.5px solid ${hovered ? 'rgb(13,110,253)' : 'rgb(222,226,230)'}`,
        padding: '20px 24px',
        boxShadow: hovered ? '0 4px 16px rgba(13,110,253,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(1,8,24)', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.82rem', color: 'rgb(88,85,94)', marginTop: 3, fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ fontSize: '0.72rem', color: 'rgb(126,126,126)', marginTop: 2 }}>{sub}</p>}
      </div>
      <span style={{ fontSize: '1.1rem', color: hovered ? 'rgb(13,110,253)' : 'rgb(222,226,230)', transition: 'color 0.15s' }}>→</span>
    </button>
  );
}

// ── Main AdminOverview Component ───────────────────────────────────────────
export default function AdminOverview({ onTabChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <InlineLoader text="Loading stats..." />;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100 }} className="animate-fade-in">

      {/* Student profile modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>
          📊 Admin Overview
        </h2>
        <p style={{ color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>
          Click any card to navigate to that section
        </p>
      </div>

      {/* Clickable stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard
          icon="👥" label="Registered Students"
          value={data?.stats?.totalUsers ?? 0}
          color="rgb(231,237,254)" sub="Click to manage users"
          onClick={() => onTabChange('users')}
        />
        <StatCard
          icon="🏛️" label="Active Clubs"
          value={data?.stats?.totalClubs ?? 0}
          color="rgb(209,231,221)" sub="Click to manage clubs"
          onClick={() => onTabChange('clubs')}
        />
        <StatCard
          icon="📅" label="Total Events"
          value={data?.stats?.totalEvents ?? 0}
          color="rgb(255,243,205)" sub={`${data?.stats?.upcomingEvents ?? 0} upcoming`}
          onClick={() => onTabChange('events')}
        />
        <StatCard
          icon="📚" label="Study Groups"
          value={data?.stats?.totalGroups ?? 0}
          color="rgb(244,240,250)" sub="Active groups"
          onClick={() => onTabChange('users')}
        />
      </div>

      {/* Recent signups table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgb(222,226,230)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgb(233,236,239)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: 'rgb(1,8,24)' }}>
            🆕 Recent Student Signups
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)' }}>Click a student to view their profile</span>
            <button
              onClick={() => onTabChange('users')}
              style={{ fontSize: '0.78rem', color: 'rgb(13,110,253)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}
            >
              View all →
            </button>
          </div>
        </div>

        {data?.recentUsers?.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>
            No students registered yet
          </div>
        ) : (
          data?.recentUsers?.map((u, i) => (
            <button
              key={u._id}
              onClick={() => setSelectedStudent(u)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px', width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: i < data.recentUsers.length - 1 ? '1px solid rgb(233,236,239)' : 'none',
                transition: 'background 0.15s', fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(231,237,254)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar */}
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, rgb(13,110,253), rgb(29,47,111))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                {u.name?.charAt(0)?.toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'rgb(13,110,253)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)' }}>{u.universityEmail}</p>
              </div>

              {/* Right side */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'rgb(88,85,94)', fontWeight: 500 }}>{u.department}</p>
                <p style={{ fontSize: '0.7rem', color: 'rgb(126,126,126)' }}>
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Arrow hint */}
              <span style={{ color: 'rgb(210,224,255)', fontSize: '0.9rem', marginLeft: 8 }}>👁️</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}