// client/src/pages/admin/AdminOverview.jsx
// IMPORTANT: Run in /client before using: npm install chart.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart } from 'chart.js/auto';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, InlineLoader } from '../../components/LoadingSpinner';

// ── Month helper ──────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildMonthlyData(rawData) {
  const now = new Date();
  const labels = [];
  const values = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTH_NAMES[d.getMonth()]);
    const found = rawData.find(r => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1);
    values.push(found ? found.count : 0);
  }
  return { labels, values };
}

// ── Chart palette ─────────────────────────────────────────────
const PALETTE = [
  'rgba(13,110,253,0.82)',
  'rgba(29,47,111,0.82)',
  'rgba(131,144,250,0.82)',
  'rgba(25,135,84,0.82)',
  'rgba(253,126,20,0.82)',
  'rgba(111,66,193,0.82)',
  'rgba(13,202,240,0.82)',
  'rgba(255,193,7,0.82)',
];

const PALETTE_BORDER = PALETTE.map(c => c.replace('0.82', '1'));

// ── Chart defaults ────────────────────────────────────────────
Chart.defaults.font.family = 'DM Sans, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = '#7e7e7e';

// ─────────────────────────────────────────────────────────────
// Analytics Section (Chart.js charts)
// ─────────────────────────────────────────────────────────────
function AnalyticsSection() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // canvas refs
  const deptRef    = useRef(null);
  const monthRef   = useRef(null);
  const clubRef    = useRef(null);
  const eventRef   = useRef(null);

  // chart instance refs (for cleanup)
  const deptInst   = useRef(null);
  const monthInst  = useRef(null);
  const clubInst   = useRef(null);
  const eventInst  = useRef(null);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => setAnalytics(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Chart 1: Students by Department (horizontal bar) ──
  useEffect(() => {
    if (!analytics?.deptDistribution?.length || !deptRef.current) return;
    if (deptInst.current) deptInst.current.destroy();

    const data = analytics.deptDistribution;
    deptInst.current = new Chart(deptRef.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d._id || 'Unknown'),
        datasets: [{
          label: 'Students',
          data: data.map(d => d.count),
          backgroundColor: PALETTE,
          borderColor: PALETTE_BORDER,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} students` } },
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 }, border: { display: false } },
          y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });

    return () => { if (deptInst.current) deptInst.current.destroy(); };
  }, [analytics]);

  // ── Chart 2: Monthly Registrations (line) ──
  useEffect(() => {
    if (!analytics?.monthlyRegistrations || !monthRef.current) return;
    if (monthInst.current) monthInst.current.destroy();

    const { labels, values } = buildMonthlyData(analytics.monthlyRegistrations);
    monthInst.current = new Chart(monthRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'New Students',
          data: values,
          borderColor: 'rgba(13,110,253,1)',
          backgroundColor: 'rgba(13,110,253,0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(13,110,253,1)',
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} new students` } },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false }, ticks: { precision: 0 } },
        },
      },
    });

    return () => { if (monthInst.current) monthInst.current.destroy(); };
  }, [analytics]);

  // ── Chart 3: Club Members by Category (doughnut) ──
  useEffect(() => {
    if (!analytics?.clubsByCategory?.length || !clubRef.current) return;
    if (clubInst.current) clubInst.current.destroy();

    const data = analytics.clubsByCategory;
    clubInst.current = new Chart(clubRef.current, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d._id),
        datasets: [{
          data: data.map(d => d.totalMembers),
          backgroundColor: PALETTE,
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } },
          },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} members` } },
        },
      },
    });

    return () => { if (clubInst.current) clubInst.current.destroy(); };
  }, [analytics]);

  // ── Chart 4: Event Registrations by Type (bar) ──
  useEffect(() => {
    if (!analytics?.eventsByType?.length || !eventRef.current) return;
    if (eventInst.current) eventInst.current.destroy();

    const data = analytics.eventsByType;
    eventInst.current = new Chart(eventRef.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d._id),
        datasets: [
          {
            label: 'Registrations',
            data: data.map(d => d.totalRegistrations),
            backgroundColor: 'rgba(13,110,253,0.82)',
            borderColor: 'rgba(13,110,253,1)',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Events',
            data: data.map(d => d.eventCount),
            backgroundColor: 'rgba(131,144,250,0.82)',
            borderColor: 'rgba(131,144,250,1)',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false }, ticks: { precision: 0 } },
        },
      },
    });

    return () => { if (eventInst.current) eventInst.current.destroy(); };
  }, [analytics]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <InlineLoader />
        <span style={{ marginLeft: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <p>Analytics data unavailable. Make sure the /api/admin/analytics endpoint is added to the backend.</p>
      </div>
    );
  }

  const chartCard = (title, subtitle, children, height = 260) => (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.375rem', overflow: 'hidden' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-primary)' }}>{title}</h4>
        {subtitle && <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      <div style={{ height, position: 'relative' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* Section heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ height: 2, flex: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          📊 Analytics Dashboard
        </span>
        <div style={{ height: 2, flex: 1, background: 'var(--border)' }} />
      </div>

      {/* 2×2 chart grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
        {chartCard(
          'Students by Department',
          'Distribution of enrolled students across departments',
          <canvas ref={deptRef} />,
          analytics.deptDistribution.length > 5 ? 320 : 240
        )}

        {chartCard(
          'Monthly Student Registrations',
          'New student sign-ups over the last 6 months',
          <canvas ref={monthRef} />,
          240
        )}

        {chartCard(
          'Club Membership by Category',
          'Total members across club categories',
          <canvas ref={clubRef} />,
          280
        )}

        {chartCard(
          'Event Registrations by Type',
          'Events held vs. total registrations per event type',
          <canvas ref={eventRef} />,
          240
        )}
      </div>

      {/* Year distribution mini stat strip */}
      {analytics.yearDistribution?.length > 0 && (
        <div style={{ marginTop: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-primary)' }}>
            Students by Academic Year
          </h4>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {analytics.yearDistribution.map(y => {
              const total = analytics.yearDistribution.reduce((a, b) => a + b.count, 0);
              const pct = total ? Math.round((y.count / total) * 100) : 0;
              return (
                <div key={y._id} style={{ flex: '1 1 80px', background: 'var(--bg-page)', borderRadius: '10px', padding: '0.875rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--blue-primary)', fontFamily: 'Playfair Display, serif' }}>{y.count}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>Year {y._id}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--dark-accent)' }}>{pct}%</div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: '99px', marginTop: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--blue-primary)', borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main AdminOverview Component
// ─────────────────────────────────────────────────────────────
export default function AdminOverview({ onTabChange }) {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileModal, setProfileModal] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data || res.data);
    } catch {
      showToast('Failed to load stats', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <PageLoader />;

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: '🎓',
      color: 'var(--blue-primary)',
      bg: 'rgba(13,110,253,0.08)',
      tab: 'users',
      trend: '+12% this month',
    },
    {
      label: 'Active Clubs',
      value: stats?.totalClubs ?? 0,
      icon: '🏛️',
      color: 'var(--dark-accent)',
      bg: 'rgba(29,47,111,0.08)',
      tab: 'clubs',
      trend: 'Across 6 categories',
    },
    {
      label: 'Events',
      value: stats?.totalEvents ?? 0,
      icon: '📅',
      color: '#198754',
      bg: 'rgba(25,135,84,0.08)',
      tab: 'events',
      trend: 'This semester',
    },
    {
      label: 'Study Groups',
      value: stats?.totalStudyGroups ?? 0,
      icon: '📚',
      color: '#fd7e14',
      bg: 'rgba(253,126,20,0.08)',
      tab: 'studyGroups',
      trend: 'Student-created',
    },
  ];

  return (
    <div>
      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(card => (
          <button
            key={card.label}
            onClick={() => onTabChange && onTabChange(card.tab)}
            style={{
              background: '#fff', borderRadius: '14px', padding: '1.375rem 1.25rem',
              border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '0.875rem',
              outline: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(1,8,24,0.09)'; e.currentTarget.style.borderColor = card.color; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-page)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                →
              </span>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: card.color, fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>
                {card.value.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.3rem' }}>{card.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{card.trend}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Recent Signups ── */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--dark-primary)' }}>
              Recent Signups
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest students to join UniVerse</p>
          </div>
          <button onClick={() => onTabChange && onTabChange('users')}
            style={{ padding: '0.4rem 0.875rem', borderRadius: '7px', border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: 'var(--blue-primary)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-tint)'; e.currentTarget.style.borderColor = 'var(--blue-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            View All →
          </button>
        </div>

        {!stats?.recentUsers?.length ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent signups</p>
        ) : (
          stats.recentUsers.map((user, i) => (
            <div key={user._id || i}
              style={{ padding: '0.875rem 1.5rem', borderBottom: i < stats.recentUsers.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', transition: 'background 0.12s' }}
              onClick={() => setProfileModal(user)}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-page)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>

              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.universityEmail}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                {user.department && (
                  <span style={{ background: 'var(--blue-tint)', color: 'var(--dark-accent)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                    {user.department}
                  </span>
                )}
                {user.year && (
                  <span style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid var(--border)' }}>
                    Year {user.year}
                  </span>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Chart.js Analytics Section ── */}
      <AnalyticsSection />

      {/* ── Profile Modal ── */}
      {profileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setProfileModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(1,8,24,0.25)' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue-primary), var(--blue-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.5rem', border: '3px solid rgba(255,255,255,0.25)', marginBottom: '0.875rem' }}>
                {profileModal.name?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 0.25rem', fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: '1.2rem' }}>{profileModal.name}</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>{profileModal.universityEmail}</p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Student ID', value: profileModal.studentId || '—' },
                  { label: 'Department', value: profileModal.department || '—' },
                  { label: 'Academic Year', value: profileModal.year ? `Year ${profileModal.year}` : '—' },
                  { label: 'Role', value: profileModal.role === 'admin' ? '👑 Admin' : '🎓 Student' },
                  { label: 'Clubs Joined', value: profileModal.joinedClubs?.length ?? 0 },
                  { label: 'Events Registered', value: profileModal.registeredEvents?.length ?? 0 },
                  { label: 'Study Groups', value: profileModal.joinedStudyGroups?.length ?? 0 },
                  { label: 'Member Since', value: profileModal.createdAt ? new Date(profileModal.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--bg-page)', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setProfileModal(null)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: 'none', background: 'var(--blue-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}