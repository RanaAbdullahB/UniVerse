/**
 * ResourcePool.jsx
 * Place at: client/src/pages/ResourcePool.jsx
 *
 * Two tabs:
 *   📚 Resources  — browse & download shared files
 *   🙋 Requests   — ask for something / fulfill others' requests
 */

import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const RESOURCE_TYPES = ['PDF', 'Notes', 'Slides', 'Book', 'Assignment', 'Other'];

const DEPARTMENTS = [
  'General', 'Computer Science', 'Software Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Business Administration', 'Mathematics', 'Physics',
  'English', 'Management Sciences'
];

const TYPE_ICONS = {
  PDF: '📄', Notes: '📝', Slides: '📊', Book: '📚', Assignment: '📋', Other: '📁'
};

const TYPE_COLORS = {
  PDF:        { bg: 'rgba(220,53,69,0.08)',   color: '#dc3545' },
  Notes:      { bg: 'rgba(13,110,253,0.08)',  color: '#0d6efd' },
  Slides:     { bg: 'rgba(111,66,193,0.08)', color: '#6f42c1' },
  Book:       { bg: 'rgba(25,135,84,0.08)',  color: '#198754' },
  Assignment: { bg: 'rgba(253,126,20,0.08)', color: '#fd7e14' },
  Other:      { bg: 'rgba(108,117,125,0.08)',color: '#6c757d' }
};

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function timeAgo(date) {
  if (!date) return '';
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onUploaded, fulfillRequest = null }) {
  const [form, setForm] = useState({
    title:        fulfillRequest?.title || '',
    description:  '',
    resourceType: fulfillRequest?.resourceType || 'PDF',
    department:   fulfillRequest?.department   || 'General',
    course:       fulfillRequest?.course       || '',
  });
  const [file,     setFile]     = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required');
    if (!file)              return setError('Please select a file');
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file',         file);
      fd.append('title',        form.title.trim());
      fd.append('description',  form.description.trim());
      fd.append('resourceType', form.resourceType);
      fd.append('department',   form.department);
      fd.append('course',       form.course.trim());

      let res;
      if (fulfillRequest) {
        res = await api.post(`/resources/requests/${fulfillRequest._id}/fulfill`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/resources', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      if (res.data.success) {
        onUploaded(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={mStyles.header}>
          <h3 style={mStyles.title}>
            {fulfillRequest ? `✅ Fulfill: "${fulfillRequest.title}"` : '📤 Share a Resource'}
          </h3>
          <button onClick={onClose} style={mStyles.closeBtn}>✕</button>
        </div>

        <div style={mStyles.body}>
          {error && <div style={mStyles.error}>{error}</div>}

          <Field label="Title *">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Data Structures Complete Notes"
              style={inp}
              disabled={!!fulfillRequest}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type">
              <select value={form.resourceType} onChange={e => setForm(f => ({ ...f, resourceType: e.target.value }))} style={inp}>
                {RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inp}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Course / Subject">
            <input
              value={form.course}
              onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
              placeholder="e.g. CS301"
              style={inp}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description (optional)"
              rows={2}
              style={{ ...inp, resize: 'vertical' }}
            />
          </Field>

          {/* File picker */}
          <Field label="File * (max 20 MB)">
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border:        '2px dashed var(--border)',
                borderRadius:  10,
                padding:       '18px 14px',
                textAlign:     'center',
                cursor:        'pointer',
                background:    file ? 'rgba(25,135,84,0.05)' : 'var(--bg-page)',
                borderColor:   file ? 'var(--success)' : 'var(--border)',
                transition:    'all 0.2s'
              }}
            >
              {file ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--success)' }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{formatSize(file.size)}</div>
                  <div style={{ fontSize: 12, color: 'var(--blue-primary)', marginTop: 6 }}>Click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Click to select file</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>PDF, DOCX, PPTX, XLSX, TXT, ZIP</div>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0] || null)}
            />
          </Field>
        </div>

        <div style={mStyles.footer}>
          <button onClick={onClose} disabled={saving} style={mStyles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={mStyles.submitBtn}>
            {saving ? 'Uploading…' : fulfillRequest ? 'Fulfill Request' : 'Share Resource'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Request Modal ────────────────────────────────────────────────────────────

function RequestModal({ onClose, onRequested }) {
  const [form, setForm] = useState({
    title: '', description: '', resourceType: 'PDF', department: 'General', course: ''
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required');
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/resources/requests', form);
      if (res.data.success) {
        onRequested(res.data.request);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={mStyles.header}>
          <h3 style={mStyles.title}>🙋 Request a Resource</h3>
          <button onClick={onClose} style={mStyles.closeBtn}>✕</button>
        </div>

        <div style={mStyles.body}>
          {error && <div style={mStyles.error}>{error}</div>}

          <Field label="What do you need? *">
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Data Structures Handwritten Notes"
              style={inp}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type">
              <select value={form.resourceType} onChange={e => setForm(f => ({ ...f, resourceType: e.target.value }))} style={inp}>
                {RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inp}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Course / Subject">
            <input
              value={form.course}
              onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
              placeholder="e.g. CS301"
              style={inp}
            />
          </Field>

          <Field label="Details">
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any specific edition, chapter, or format preference?"
              rows={2}
              style={{ ...inp, resize: 'vertical' }}
            />
          </Field>
        </div>

        <div style={mStyles.footer}>
          <button onClick={onClose} disabled={saving} style={mStyles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={mStyles.submitBtn}>
            {saving ? 'Posting…' : 'Post Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResourcePool() {
  const { user } = useAuth();

  const [tab,        setTab]        = useState('resources'); // 'resources' | 'requests'

  // Resources state
  const [resources,        setResources]        = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resSearch,        setResSearch]        = useState('');
  const [resType,          setResType]          = useState('All');
  const [resDept,          setResDept]          = useState('All');

  // Requests state
  const [requests,        setRequests]        = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [reqStatus,       setReqStatus]       = useState('open');
  const [reqDept,         setReqDept]         = useState('All');

  // Modals
  const [showUpload,   setShowUpload]   = useState(false);
  const [showRequest,  setShowRequest]  = useState(false);
  const [fulfillTarget,setFulfillTarget]= useState(null); // request to fulfill

  // ── Fetch resources
  useEffect(() => {
    (async () => {
      setLoadingResources(true);
      try {
        const params = new URLSearchParams();
        if (resSearch) params.set('q',          resSearch);
        if (resType !== 'All') params.set('type',      resType);
        if (resDept !== 'All') params.set('department', resDept);
        const { data } = await api.get(`/resources?${params}`);
        if (data.success) setResources(data.resources);
      } catch { /* silent */ } finally {
        setLoadingResources(false);
      }
    })();
  }, [resSearch, resType, resDept]);

  // ── Fetch requests
  useEffect(() => {
    if (tab !== 'requests') return;
    (async () => {
      setLoadingRequests(true);
      try {
        const params = new URLSearchParams();
        if (reqStatus !== 'All') params.set('status',     reqStatus);
        if (reqDept   !== 'All') params.set('department', reqDept);
        const { data } = await api.get(`/resources/requests?${params}`);
        if (data.success) setRequests(data.requests);
      } catch { /* silent */ } finally {
        setLoadingRequests(false);
      }
    })();
  }, [tab, reqStatus, reqDept]);

  // ── Download
  const handleDownload = async (resource) => {
    try {
      const { data } = await api.get(`/resources/${resource._id}/download`);
      if (data.success) {
        window.open(data.fileUrl, '_blank');
        setResources(prev => prev.map(r =>
          r._id === resource._id ? { ...r, downloads: r.downloads + 1 } : r
        ));
      }
    } catch { /* silent */ }
  };

  // ── Delete resource
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/resources/${id}`);
      setResources(prev => prev.filter(r => r._id !== id));
    } catch { /* silent */ }
  };

  // ── Delete request
  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/resources/requests/${id}`);
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch { /* silent */ }
  };

  // ── After upload
  const handleUploaded = ({ resource, request }) => {
    setResources(prev => [resource, ...prev]);
    if (request) {
      setRequests(prev => prev.map(r => r._id === request._id ? request : r));
    }
  };

  // ── After new request posted
  const handleRequested = (request) => {
    setRequests(prev => [request, ...prev]);
    setTab('requests');
  };

  return (
    <div style={s.page}>

      {/* ── Page header ── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>📚 Resource Pool</h1>
          <p style={s.pageSubtitle}>Share study materials · Ask for what you need · Help each other succeed</p>
        </div>
        <div style={s.headerActions}>
          <button onClick={() => setShowRequest(true)} style={s.secondaryBtn}>
            🙋 Request
          </button>
          <button onClick={() => setShowUpload(true)} style={s.primaryBtn}>
            📤 Share Resource
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabs}>
        {[
          { key: 'resources', label: `📚 Resources (${resources.length})` },
          { key: 'requests',  label: `🙋 Requests` }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...s.tab,
              background:   tab === t.key ? 'var(--blue-primary)' : 'transparent',
              color:        tab === t.key ? '#fff' : 'var(--text-muted)',
              fontWeight:   tab === t.key ? 700 : 400
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          RESOURCES TAB
      ═══════════════════════════════════════ */}
      {tab === 'resources' && (
        <>
          {/* Filters */}
          <div style={s.filters}>
            <input
              type="text"
              placeholder="Search resources…"
              value={resSearch}
              onChange={e => setResSearch(e.target.value)}
              style={s.searchInput}
            />
            <select value={resType} onChange={e => setResType(e.target.value)} style={s.select}>
              <option value="All">All Types</option>
              {RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={resDept} onChange={e => setResDept(e.target.value)} style={s.select}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          {loadingResources ? (
            <div style={s.center}><div style={s.spinner} /></div>
          ) : resources.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No resources yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Be the first to share something!
              </div>
              <button onClick={() => setShowUpload(true)} style={{ ...s.primaryBtn, marginTop: 16 }}>
                📤 Share Resource
              </button>
            </div>
          ) : (
            <div style={s.grid}>
              {resources.map(resource => {
                const tc = TYPE_COLORS[resource.resourceType] || TYPE_COLORS.Other;
                const isOwner = resource.uploadedBy?._id === user._id || resource.uploadedBy === user._id;
                return (
                  <div key={resource._id} style={s.card}>
                    <div style={{ height: 4, background: tc.color, borderRadius: '12px 12px 0 0' }} />
                    <div style={s.cardBody}>
                      {/* Type badge */}
                      <div style={s.cardTop}>
                        <span style={{ ...s.badge, background: tc.bg, color: tc.color }}>
                          {TYPE_ICONS[resource.resourceType]} {resource.resourceType}
                        </span>
                        {resource.fulfilledRequest && (
                          <span style={{ ...s.badge, background: 'rgba(25,135,84,0.08)', color: 'var(--success)', fontSize: 11 }}>
                            ✅ Fulfilled
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div style={s.cardTitle}>{resource.title}</div>
                      {resource.description && (
                        <div style={s.cardDesc}>{resource.description}</div>
                      )}

                      {/* Meta */}
                      <div style={s.cardMeta}>
                        {resource.course && <span>📖 {resource.course}</span>}
                        <span>🏛️ {resource.department}</span>
                        <span>⬇️ {resource.downloads} downloads</span>
                        {resource.fileSize > 0 && <span>💾 {formatSize(resource.fileSize)}</span>}
                      </div>

                      {/* Footer */}
                      <div style={s.cardFooter}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          By <strong>{resource.uploaderName}</strong> · {timeAgo(resource.createdAt)}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(isOwner || user.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteResource(resource._id)}
                              style={s.deleteBtn}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(resource)}
                            style={s.downloadBtn}
                          >
                            ⬇️ Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════
          REQUESTS TAB
      ═══════════════════════════════════════ */}
      {tab === 'requests' && (
        <>
          {/* Filters */}
          <div style={s.filters}>
            <select value={reqStatus} onChange={e => setReqStatus(e.target.value)} style={s.select}>
              <option value="All">All Requests</option>
              <option value="open">Open</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
            <select value={reqDept} onChange={e => setReqDept(e.target.value)} style={s.select}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={() => setShowRequest(true)} style={{ ...s.primaryBtn, marginLeft: 'auto' }}>
              + New Request
            </button>
          </div>

          {loadingRequests ? (
            <div style={s.center}><div style={s.spinner} /></div>
          ) : requests.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🙋</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No requests yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Need something? Post a request and a fellow student might help!
              </div>
              <button onClick={() => setShowRequest(true)} style={{ ...s.primaryBtn, marginTop: 16 }}>
                + Post Request
              </button>
            </div>
          ) : (
            <div style={s.requestList}>
              {requests.map(req => {
                const isOwner   = req.requestedBy?._id === user._id || req.requestedBy === user._id;
                const isFulfilled = req.status === 'fulfilled';
                const tc = TYPE_COLORS[req.resourceType] || TYPE_COLORS.Other;
                return (
                  <div key={req._id} style={{ ...s.requestCard, opacity: isFulfilled ? 0.75 : 1 }}>
                    <div style={s.requestLeft}>
                      {/* Status dot */}
                      <div style={{
                        width:        10,
                        height:       10,
                        borderRadius: '50%',
                        background:   isFulfilled ? 'var(--success)' : '#fd7e14',
                        flexShrink:   0,
                        marginTop:    4
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.requestTitle}>{req.title}</div>
                        {req.description && (
                          <div style={s.requestDesc}>{req.description}</div>
                        )}
                        <div style={s.requestMeta}>
                          <span style={{ ...s.badge, background: tc.bg, color: tc.color, fontSize: 11 }}>
                            {TYPE_ICONS[req.resourceType]} {req.resourceType}
                          </span>
                          {req.course && <span>📖 {req.course}</span>}
                          <span>🏛️ {req.department}</span>
                          <span>By <strong>{req.requesterName}</strong> · {timeAgo(req.createdAt)}</span>
                        </div>
                        {isFulfilled && (
                          <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>
                            ✅ Fulfilled by {req.fulfilledByName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={s.requestActions}>
                      {isOwner && !isFulfilled && (
                        <button
                          onClick={() => handleDeleteRequest(req._id)}
                          style={s.deleteBtn}
                          title="Delete request"
                        >
                          🗑️
                        </button>
                      )}
                      {!isFulfilled && !isOwner && (
                        <button
                          onClick={() => { setFulfillTarget(req); setShowUpload(true); }}
                          style={s.fulfillBtn}
                        >
                          📤 I have this!
                        </button>
                      )}
                      {isFulfilled && (
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                          ✅ Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showUpload && (
        <UploadModal
          onClose={() => { setShowUpload(false); setFulfillTarget(null); }}
          onUploaded={handleUploaded}
          fulfillRequest={fulfillTarget}
        />
      )}
      {showRequest && (
        <RequestModal
          onClose={() => setShowRequest(false)}
          onRequested={handleRequested}
        />
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inp = {
  width:       '100%',
  padding:     '8px 12px',
  border:      '1.5px solid var(--border)',
  borderRadius: 8,
  fontSize:    14,
  outline:     'none',
  color:       'var(--text-primary)',
  background:  'var(--white)',
  boxSizing:   'border-box',
  fontFamily:  'DM Sans, sans-serif'
};

const overlay = {
  position:       'fixed',
  inset:          0,
  background:     'rgba(0,0,0,0.55)',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  zIndex:         1000,
  padding:        16
};

const modal = {
  background:    'var(--white)',
  borderRadius:  20,
  width:         '100%',
  maxWidth:      520,
  maxHeight:     '90vh',
  overflow:      'hidden',
  display:       'flex',
  flexDirection: 'column',
  boxShadow:     '0 20px 60px rgba(0,0,0,0.2)'
};

const mStyles = {
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '20px 24px',
    borderBottom:   '1px solid var(--border)',
    background:     'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))'
  },
  title: {
    fontFamily: 'Playfair Display, serif',
    fontSize:   17,
    fontWeight: 700,
    color:      '#fff',
    margin:     0
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)',
    border:     'none',
    color:      '#fff',
    width:      30,
    height:     30,
    borderRadius: '50%',
    cursor:     'pointer',
    fontSize:   14,
    display:    'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    padding:   '20px 24px',
    overflowY: 'auto',
    flex:      1,
    display:   'flex',
    flexDirection: 'column',
    gap:       14
  },
  footer: {
    padding:        '14px 24px',
    borderTop:      '1px solid var(--border)',
    display:        'flex',
    justifyContent: 'flex-end',
    gap:            10,
    background:     'var(--bg-page)'
  },
  error: {
    background:  'rgba(220,53,69,0.08)',
    border:      '1px solid rgba(220,53,69,0.25)',
    borderRadius: 8,
    padding:     '8px 12px',
    fontSize:    13,
    color:       'var(--error)'
  },
  cancelBtn: {
    padding:      '8px 20px',
    borderRadius: 8,
    border:       '1.5px solid var(--border)',
    background:   '#fff',
    cursor:       'pointer',
    fontWeight:   500,
    color:        'var(--text-body)',
    fontSize:     14
  },
  submitBtn: {
    padding:      '8px 22px',
    borderRadius: 8,
    border:       'none',
    background:   'var(--blue-primary)',
    color:        '#fff',
    cursor:       'pointer',
    fontWeight:   600,
    fontSize:     14
  }
};

const s = {
  page: {
    padding:   '24px 28px',
    maxWidth:  1200,
    margin:    '0 auto'
  },
  pageHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   24,
    flexWrap:       'wrap',
    gap:            12
  },
  pageTitle: {
    fontFamily: 'Playfair Display, serif',
    fontSize:   26,
    fontWeight: 700,
    color:      'var(--dark-primary)',
    margin:     0
  },
  pageSubtitle: {
    fontSize:   14,
    color:      'var(--text-muted)',
    margin:     '4px 0 0'
  },
  headerActions: {
    display: 'flex',
    gap:     10
  },
  primaryBtn: {
    padding:      '8px 18px',
    borderRadius: 8,
    border:       'none',
    background:   'var(--blue-primary)',
    color:        '#fff',
    cursor:       'pointer',
    fontWeight:   600,
    fontSize:     14,
    fontFamily:   'DM Sans, sans-serif'
  },
  secondaryBtn: {
    padding:      '8px 18px',
    borderRadius: 8,
    border:       '1.5px solid var(--blue-primary)',
    background:   'var(--blue-tint)',
    color:        'var(--blue-primary)',
    cursor:       'pointer',
    fontWeight:   600,
    fontSize:     14,
    fontFamily:   'DM Sans, sans-serif'
  },
  tabs: {
    display:      'flex',
    gap:          6,
    marginBottom: 20,
    background:   'var(--bg-page)',
    padding:      6,
    borderRadius: 10,
    width:        'fit-content'
  },
  tab: {
    padding:      '7px 20px',
    borderRadius: 7,
    border:       'none',
    cursor:       'pointer',
    fontSize:     14,
    fontFamily:   'DM Sans, sans-serif',
    transition:   'all 0.15s'
  },
  filters: {
    display:      'flex',
    gap:          10,
    marginBottom: 20,
    flexWrap:     'wrap',
    alignItems:   'center'
  },
  searchInput: {
    flex:         '1 1 200px',
    padding:      '8px 14px',
    border:       '1.5px solid var(--border)',
    borderRadius: 8,
    fontSize:     14,
    outline:      'none',
    background:   'var(--white)',
    color:        'var(--text-primary)',
    fontFamily:   'DM Sans, sans-serif'
  },
  select: {
    padding:      '8px 12px',
    border:       '1.5px solid var(--border)',
    borderRadius: 8,
    fontSize:     14,
    background:   'var(--white)',
    color:        'var(--text-primary)',
    cursor:       'pointer',
    outline:      'none'
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap:                 16
  },
  card: {
    background:   'var(--white)',
    borderRadius: 12,
    border:       '1px solid var(--border)',
    overflow:     'hidden',
    display:      'flex',
    flexDirection:'column',
    transition:   'box-shadow 0.15s'
  },
  cardBody: {
    padding:       16,
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           8
  },
  cardTop: {
    display:    'flex',
    gap:        6,
    flexWrap:   'wrap'
  },
  badge: {
    padding:      '3px 8px',
    borderRadius: 20,
    fontSize:     12,
    fontWeight:   600
  },
  cardTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: 700,
    fontSize:   15,
    color:      'var(--dark-primary)',
    lineHeight: 1.3
  },
  cardDesc: {
    fontSize:   13,
    color:      'var(--text-muted)',
    lineHeight: 1.5
  },
  cardMeta: {
    display:    'flex',
    flexWrap:   'wrap',
    gap:        8,
    fontSize:   12,
    color:      'var(--text-muted)',
    marginTop:  4
  },
  cardFooter: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      'auto',
    paddingTop:     10,
    borderTop:      '1px solid var(--border)'
  },
  downloadBtn: {
    padding:      '6px 14px',
    borderRadius: 7,
    border:       'none',
    background:   'var(--blue-primary)',
    color:        '#fff',
    cursor:       'pointer',
    fontSize:     13,
    fontWeight:   600,
    fontFamily:   'DM Sans, sans-serif'
  },
  deleteBtn: {
    padding:      '6px 10px',
    borderRadius: 7,
    border:       '1px solid rgba(220,53,69,0.2)',
    background:   'rgba(220,53,69,0.06)',
    color:        'var(--error)',
    cursor:       'pointer',
    fontSize:     13
  },
  requestList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           10
  },
  requestCard: {
    background:     'var(--white)',
    borderRadius:   12,
    border:         '1px solid var(--border)',
    padding:        '14px 16px',
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            12
  },
  requestLeft: {
    display: 'flex',
    gap:     10,
    flex:    1,
    minWidth: 0
  },
  requestTitle: {
    fontWeight:  600,
    fontSize:    15,
    color:       'var(--dark-primary)',
    marginBottom: 4
  },
  requestDesc: {
    fontSize:    13,
    color:       'var(--text-muted)',
    marginBottom: 6,
    lineHeight:  1.5
  },
  requestMeta: {
    display:  'flex',
    flexWrap: 'wrap',
    gap:      8,
    fontSize: 12,
    color:    'var(--text-muted)',
    alignItems: 'center'
  },
  requestActions: {
    display:    'flex',
    gap:        8,
    flexShrink: 0,
    alignItems: 'flex-start'
  },
  fulfillBtn: {
    padding:      '7px 14px',
    borderRadius: 8,
    border:       'none',
    background:   'var(--success)',
    color:        '#fff',
    cursor:       'pointer',
    fontSize:     13,
    fontWeight:   600,
    fontFamily:   'DM Sans, sans-serif',
    whiteSpace:   'nowrap'
  },
  emptyState: {
    textAlign:  'center',
    padding:    '60px 24px',
    color:      'var(--text-muted)',
    background: 'var(--white)',
    borderRadius: 12,
    border:     '1px solid var(--border)'
  },
  center: {
    display:        'flex',
    justifyContent: 'center',
    padding:        60
  },
  spinner: {
    width:        36,
    height:       36,
    border:       '3px solid var(--border)',
    borderTop:    '3px solid var(--blue-primary)',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite'
  }
};