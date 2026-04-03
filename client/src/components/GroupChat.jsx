// client/src/components/GroupChat.jsx
// Real-time group chat for study groups using Socket.io
//
// Install in /client:  npm install socket.io-client
//
// Usage inside StudyGroups.jsx:
//   import GroupChat from '../components/GroupChat';
//   <GroupChat group={selectedGroup} currentUser={user} onClose={() => setSelectedGroup(null)} />

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const SOCKET_URL = 'http://localhost:5000';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function shouldShowDivider(messages, index) {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  const curr = new Date(messages[index].createdAt).toDateString();
  return prev !== curr;
}

export default function GroupChat({ group, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const socketRef   = useRef(null);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const typingTimer = useRef(null);
  const isTyping    = useRef(false);

  const token = localStorage.getItem('uni_token');
  const myId  = currentUser?._id || currentUser?.id;

  // ── Load history ──────────────────────────────────────────
  const loadHistory = useCallback(async (before = null) => {
    try {
      const params = before ? `?limit=40&before=${before}` : '?limit=40';
      const res = await api.get(`/messages/${group._id}${params}`);
      const data = res.data.data || [];
      if (before) {
        setMessages(prev => [...data, ...prev]);
        setHasMore(data.length === 40);
      } else {
        setMessages(data);
        setHasMore(data.length === 40);
      }
    } catch {
      // silently fail — user sees empty chat
    } finally {
      setLoading(false);
    }
  }, [group._id]);

  // ── Socket.io setup ───────────────────────────────────────
  useEffect(() => {
    loadHistory();

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_group', { groupId: group._id });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('user_typing', ({ userId, userName }) => {
      if (userId === myId) return;
      setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
    });

    socket.on('user_stopped_typing', ({ userId }) => {
      // Remove by checking all messages for that user's name — simpler approach
      setTypingUsers(prev => prev.filter((_, i) => i !== 0));
    });

    socket.on('error', (err) => console.error('Socket error:', err.message));

    return () => {
      socket.emit('leave_group', { groupId: group._id });
      socket.disconnect();
    };
  }, [group._id, token, loadHistory, myId]);

  // ── Auto-scroll to bottom on new messages ─────────────────
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // ── Send message ──────────────────────────────────────────
  const sendMessage = () => {
    const content = input.trim();
    if (!content || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', { groupId: group._id, content });
    setInput('');
    stopTyping();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Typing indicators ─────────────────────────────────────
  const startTyping = () => {
    if (!isTyping.current) {
      isTyping.current = true;
      socketRef.current?.emit('typing_start', { groupId: group._id });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    if (isTyping.current) {
      isTyping.current = false;
      socketRef.current?.emit('typing_stop', { groupId: group._id });
    }
    clearTimeout(typingTimer.current);
  };

  // ── Load older messages ───────────────────────────────────
  const loadMore = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    await loadHistory(messages[0].createdAt);
    setLoadingMore(false);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(1,8,24,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '1rem', backdropFilter: 'blur(4px)',
    }}
      onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
        height: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 70px rgba(1,8,24,0.3)', overflow: 'hidden',
      }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg, var(--dark-primary), var(--dark-accent))', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
            📚
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {group.name}
            </h3>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              {group.subject} · {group.members?.length || 0} members
              <span style={{ marginLeft: '0.5rem', color: connected ? '#4ade80' : '#f87171' }}>
                ● {connected ? 'Connected' : 'Reconnecting...'}
              </span>
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgb(248,249,250)' }}>
          {/* Load more */}
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <button onClick={loadMore} disabled={loadingMore}
                style={{ padding: '4px 14px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {loadingMore ? 'Loading...' : '↑ Load older messages'}
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>💬</div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>No messages yet</p>
              <p style={{ margin: 0, fontSize: '0.78rem' }}>Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender?.toString() === myId?.toString();
              const showDivider = shouldShowDivider(messages, i);
              const showAvatar = !isMe && (i === 0 || messages[i - 1].sender?.toString() !== msg.sender?.toString() || showDivider);
              const showName = showAvatar;

              return (
                <div key={msg._id || i}>
                  {/* Date divider */}
                  {showDivider && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
                      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgb(248,249,250)', padding: '0 0.5rem', whiteSpace: 'nowrap' }}>
                        {formatDateDivider(msg.createdAt)}
                      </span>
                      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '2px' }}>
                    {/* Avatar (other users only) */}
                    {!isMe && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: showAvatar ? 'linear-gradient(135deg, var(--dark-accent), var(--blue-primary))' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0, overflow: 'hidden' }}>
                        {showAvatar && (msg.senderPhoto
                          ? <img src={msg.senderPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : msg.senderName?.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}

                    <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {/* Sender name */}
                      {showName && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 600 }}>
                          {msg.senderName}{msg.senderYear ? ` · Yr ${msg.senderYear}` : ''}
                        </span>
                      )}

                      {/* Bubble */}
                      <div style={{
                        background: isMe ? 'var(--blue-primary)' : '#fff',
                        color: isMe ? '#fff' : 'var(--text-primary)',
                        padding: '0.5rem 0.875rem',
                        borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        border: isMe ? 'none' : '1px solid var(--border)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content}
                      </div>

                      {/* Timestamp */}
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', padding: '0.5rem 0.875rem', display: 'flex', gap: 3, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {typingUsers[0]} is typing...
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); startTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                flex: 1, padding: '0.625rem 0.875rem',
                border: '1.5px solid var(--border)', borderRadius: 10,
                fontSize: '0.875rem', outline: 'none', resize: 'none',
                fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)',
                background: '#fff', maxHeight: 100, lineHeight: 1.5,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--blue-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !connected}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: input.trim() && connected ? 'var(--blue-primary)' : 'var(--border)',
                color: input.trim() && connected ? '#fff' : 'var(--text-muted)',
                cursor: input.trim() && connected ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0, transition: 'all 0.15s',
              }}>
              ➤
            </button>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}