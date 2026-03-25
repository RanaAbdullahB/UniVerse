import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { InlineLoader } from '../../components/LoadingSpinner';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid rgb(222,226,230)',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(1,8,24)', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.82rem', color: 'rgb(88,85,94)', marginTop: 3, fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ fontSize: '0.72rem', color: 'rgb(126,126,126)', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/stats');
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <InlineLoader text="Loading stats..." />;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100 }} className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'rgb(1,8,24)', marginBottom: 4 }}>
          📊 Admin Overview
        </h2>
        <p style={{ color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>
          University portal at a glance
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon="👥" label="Registered Students" value={data?.stats?.totalUsers ?? 0} color="rgb(231,237,254)" sub="Total accounts" />
        <StatCard icon="🏛️" label="Active Clubs" value={data?.stats?.totalClubs ?? 0} color="rgb(209,231,221)" sub="Student societies" />
        <StatCard icon="📅" label="Total Events" value={data?.stats?.totalEvents ?? 0} color="rgb(255,243,205)" sub={`${data?.stats?.upcomingEvents ?? 0} upcoming`} />
        <StatCard icon="📚" label="Study Groups" value={data?.stats?.totalGroups ?? 0} color="rgb(244,240,250)" sub="Active groups" />
      </div>

      {/* Recent signups */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgb(222,226,230)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgb(233,236,239)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: 'rgb(1,8,24)' }}>
            🆕 Recent Student Signups
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'rgb(126,126,126)' }}>Last 5 registrations</span>
        </div>
        <div>
          {data?.recentUsers?.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgb(126,126,126)', fontSize: '0.875rem' }}>
              No students registered yet
            </div>
          ) : (
            data?.recentUsers?.map((u, i) => (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                borderBottom: i < data.recentUsers.length - 1 ? '1px solid rgb(233,236,239)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(248,249,250)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgb(13,110,253), rgb(29,47,111))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'rgb(33,37,41)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(126,126,126)' }}>{u.universityEmail}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(88,85,94)', fontWeight: 500 }}>{u.department}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgb(126,126,126)' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}