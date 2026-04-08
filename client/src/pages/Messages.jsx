import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatConvDate(date) {
  if (!date) return '';
  const d   = new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)       return 'Just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800)   return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages) {
  const groups = [];
  let lastDateStr = null;
  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toLocaleDateString([], {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    if (dateStr !== lastDateStr) {
      groups.push({ type: 'divider', label: dateStr, id: `div-${msg._id}` });
      lastDateStr = dateStr;
    }
    groups.push({ type: 'message', ...msg });
  }
  return groups;
}

function Avatar({ name = '', photo, size = 40 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--blue-wash)'
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--dark-accent)',
      color: 'var(--blue-pale)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
      border: '2px solid var(--blue-wash)'
    }}>
      {initials}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Messages() {
  const { user } = useAuth();

  // Conversations list
  const [conversations,    setConversations]    = useState([]);
  const [loadingConvos,    setLoadingConvos]    = useState(true);

  // Active chat
  const [activeConvo,      setActiveConvo]      = useState(null);
  const [messages,         setMessages]         = useState([]);
  const [loadingMessages,  setLoadingMessages]  = useState(false);
  const [hasMore,          setHasMore]          = useState(false);
  const [page,             setPage]             = useState(1);
  const [loadingMore,      setLoadingMore]      = useState(false);

  // Compose
  const [draft,            setDraft]            = useState('');
  const [sending,          setSending]          = useState(false);

  // New DM search
  const [newDmSearch,      setNewDmSearch]      = useState('');
  const [userResults,      setUserResults]      = useState([]);
  const [searchingUsers,   setSearchingUsers]   = useState(false);
  const [showNewDm,        setShowNewDm]        = useState(false);

  // Typing indicators
  const [theyTyping,       setTheyTyping]       = useState(false);

  // Notification badge (total unread)
  const [totalUnread,      setTotalUnread]      = useState(0);

  const socketRef       = useRef(null);
  const messagesEndRef  = useRef(null);
  const typingTimerRef  = useRef(null);
  const searchTimerRef  = useRef(null);
  const draftRef        = useRef(draft);
  const activeConvoRef  = useRef(activeConvo);
  draftRef.current      = draft;
  activeConvoRef.current = activeConvo;

  // ─── Socket setup ────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('uni_token');
    const socket = io('/', { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('receive_dm', (msg) => {
      const convoId = msg.conversation;

      // If this DM belongs to the active chat, append it
      if (activeConvoRef.current?._id === convoId) {
        setMessages(prev => {
          // Avoid duplicates (optimistic update may have already added it)
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTheyTyping(false);
        scrollToBottom();
      }

      // Update conversation list: bump to top + update last message
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c._id !== convoId) return c;
          const isActive = activeConvoRef.current?._id === convoId;
          return {
            ...c,
            lastMessage: { content: msg.content, sender: msg.sender, sentAt: msg.createdAt },
            myUnread:    isActive ? 0 : (c.myUnread || 0) + 1,
            updatedAt:   msg.createdAt
          };
        });
        // Sort: most recent first
        return [...updated].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });

    socket.on('dm_user_typing', ({ conversationId }) => {
      if (activeConvoRef.current?._id === conversationId) {
        setTheyTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTheyTyping(false), 3000);
      }
    });

    socket.on('dm_user_stopped_typing', ({ conversationId }) => {
      if (activeConvoRef.current?._id === conversationId) setTheyTyping(false);
    });

    socket.on('dm_notification', ({ conversationId, senderName, preview }) => {
      // If it's not the currently open convo, increment global unread badge
      if (activeConvoRef.current?._id !== conversationId) {
        setTotalUnread(n => n + 1);
      }
    });

    return () => socket.disconnect();
  }, []);

  // ─── Load conversations ───────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        setLoadingConvos(true);
        const { data } = await api.get('/api/conversations');
        if (data.success) {
          setConversations(data.conversations);
          const unread = data.conversations.reduce((s, c) => s + (c.myUnread || 0), 0);
          setTotalUnread(unread);
        }
      } catch {
        // silent
      } finally {
        setLoadingConvos(false);
      }
    })();
  }, []);

  // ─── Open conversation ────────────────────────────────────────────────────

  const openConversation = useCallback(async (convo) => {
    if (activeConvo?._id === convo._id) return;
    setActiveConvo(convo);
    setMessages([]);
    setPage(1);
    setHasMore(false);
    setTheyTyping(false);
    setDraft('');

    // Reset unread badge locally
    setConversations(prev =>
      prev.map(c => c._id === convo._id ? { ...c, myUnread: 0 } : c)
    );
    setTotalUnread(prev =>
      Math.max(0, prev - (convo.myUnread || 0))
    );

    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/api/conversations/${convo._id}/messages?page=1`);
      if (data.success) {
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setPage(1);
      }
    } catch {
      // silent
    } finally {
      setLoadingMessages(false);
    }
  }, [activeConvo]);

  // ─── Load more (older) messages ───────────────────────────────────────────

  const loadMore = async () => {
    if (!activeConvo || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const { data } = await api.get(
        `/api/conversations/${activeConvo._id}/messages?page=${nextPage}`
      );
      if (data.success) {
        setMessages(prev => [...data.messages, ...prev]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────

  const send = async () => {
    const content = draft.trim();
    if (!content || !activeConvo || sending) return;

    const recipient = activeConvo.participants.find(p => p._id !== user._id && p._id !== user?._id?.toString());
    const recipientId = recipient?._id?.toString?.() || recipient?._id;

    // Optimistic UI
    const optimistic = {
      _id:          `opt-${Date.now()}`,
      conversation: activeConvo._id,
      sender:       user._id,
      senderName:   user.name,
      content,
      createdAt:    new Date().toISOString()
    };
    setMessages(prev => [...prev, optimistic]);
    setDraft('');
    scrollToBottom();

    // Emit via socket (primary)
    socketRef.current?.emit('send_dm', {
      conversationId: activeConvo._id,
      recipientId,
      content
    });

    // Stop typing indicator
    socketRef.current?.emit('dm_typing_stop', {
      conversationId: activeConvo._id,
      recipientId
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleDraftChange = (e) => {
    setDraft(e.target.value);

    if (!activeConvo) return;
    const recipient = activeConvo.participants.find(p => p._id !== user._id);
    const recipientId = recipient?._id?.toString?.() || recipient?._id;

    // Emit typing
    socketRef.current?.emit('dm_typing_start', {
      conversationId: activeConvo._id,
      recipientId
    });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('dm_typing_stop', {
        conversationId: activeConvo._id,
        recipientId
      });
    }, 2000);
  };

  // ─── User search (new DM) ─────────────────────────────────────────────────

  const handleUserSearch = (e) => {
    const q = e.target.value;
    setNewDmSearch(q);
    clearTimeout(searchTimerRef.current);
    if (q.length < 2) { setUserResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { data } = await api.get(`/api/conversations/users/search?q=${encodeURIComponent(q)}`);
        if (data.success) setUserResults(data.users);
      } catch {
        // silent
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
  };

  const startDmWith = async (targetUser) => {
    setShowNewDm(false);
    setNewDmSearch('');
    setUserResults([]);

    try {
      const { data } = await api.post('/api/conversations', { userId: targetUser._id });
      if (data.success) {
        const convo = data.conversation;
        setConversations(prev => {
          const exists = prev.find(c => c._id === convo._id);
          return exists ? prev : [{ ...convo, myUnread: 0 }, ...prev];
        });
        openConversation({ ...convo, myUnread: 0 });
      }
    } catch {
      // silent
    }
  };

  // ─── Auto-scroll ─────────────────────────────────────────────────────────

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    if (!loadingMessages) scrollToBottom();
  }, [messages.length, loadingMessages]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getOtherParticipant = (convo) => {
    if (!convo) return null;
    return convo.participants?.find(p => {
      const pid = p._id?.toString?.() || p._id;
      const uid = user._id?.toString?.() || user._id;
      return pid !== uid;
    });
  };

  const grouped = groupMessagesByDate(messages);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>

      {/* ── LEFT PANEL ── */}
      <div style={styles.left}>

        {/* Header */}
        <div style={styles.leftHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={styles.leftTitle}>
              Messages
              {totalUnread > 0 && (
                <span style={styles.globalBadge}>{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
            </h2>
            <button
              onClick={() => setShowNewDm(s => !s)}
              title="New message"
              style={styles.newDmBtn}
            >
              ✏️
            </button>
          </div>

          {/* New DM search */}
          {showNewDm && (
            <div style={styles.newDmBox}>
              <input
                autoFocus
                type="text"
                placeholder="Search students…"
                value={newDmSearch}
                onChange={handleUserSearch}
                style={styles.newDmInput}
              />
              {searchingUsers && (
                <p style={styles.searchHint}>Searching…</p>
              )}
              {!searchingUsers && newDmSearch.length >= 2 && userResults.length === 0 && (
                <p style={styles.searchHint}>No students found</p>
              )}
              {userResults.map(u => (
                <button
                  key={u._id}
                  onClick={() => startDmWith(u)}
                  style={styles.userResult}
                >
                  <Avatar name={u.name} photo={u.profilePhoto} size={34} />
                  <div style={{ marginLeft: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {u.department} · Year {u.year}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div style={styles.convoList}>
          {loadingConvos ? (
            <div style={styles.emptyState}>Loading conversations…</div>
          ) : conversations.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No conversations yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Click ✏️ to message a student
              </div>
            </div>
          ) : (
            conversations.map(convo => {
              const other    = getOtherParticipant(convo);
              const isActive = activeConvo?._id === convo._id;
              const last     = convo.lastMessage;
              return (
                <button
                  key={convo._id}
                  onClick={() => openConversation(convo)}
                  style={{
                    ...styles.convoItem,
                    background: isActive ? 'var(--dark-accent)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--blue-primary)' : '3px solid transparent'
                  }}
                >
                  <Avatar name={other?.name} photo={other?.profilePhoto} size={44} />
                  <div style={styles.convoInfo}>
                    <div style={styles.convoTop}>
                      <span style={styles.convoName}>{other?.name || 'Unknown'}</span>
                      <span style={styles.convoTime}>{formatConvDate(last?.sentAt || convo.updatedAt)}</span>
                    </div>
                    <div style={styles.convoBottom}>
                      <span style={{
                        ...styles.convoPreview,
                        fontWeight: (convo.myUnread || 0) > 0 ? 600 : 400,
                        color:      (convo.myUnread || 0) > 0 ? 'var(--text-primary)' : 'var(--text-muted)'
                      }}>
                        {last?.content ? last.content.slice(0, 38) + (last.content.length > 38 ? '…' : '') : 'No messages yet'}
                      </span>
                      {(convo.myUnread || 0) > 0 && (
                        <span style={styles.unreadBadge}>
                          {convo.myUnread > 9 ? '9+' : convo.myUnread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={styles.right}>

        {/* No conversation selected */}
        {!activeConvo ? (
          <div style={styles.noChatState}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 8 }}>
              Your Messages
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 300, textAlign: 'center' }}>
              Select a conversation on the left, or click ✏️ to start a new one.
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            {(() => {
              const other = getOtherParticipant(activeConvo);
              return (
                <div style={styles.chatHeader}>
                  <Avatar name={other?.name} photo={other?.profilePhoto} size={40} />
                  <div style={{ marginLeft: 12 }}>
                    <div style={styles.chatName}>{other?.name}</div>
                    <div style={styles.chatSub}>
                      {other?.department} · Year {other?.year}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Messages body */}
            <div style={styles.messagesBody}>

              {/* Load more */}
              {hasMore && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    style={styles.loadMoreBtn}
                  >
                    {loadingMore ? 'Loading…' : 'Load older messages'}
                  </button>
                </div>
              )}

              {/* Loading state */}
              {loadingMessages && (
                <div style={styles.loadingMsg}>Loading messages…</div>
              )}

              {/* Empty state */}
              {!loadingMessages && messages.length === 0 && (
                <div style={styles.emptyChat}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                  <div>Say hello! This is the beginning of your conversation.</div>
                </div>
              )}

              {/* Grouped messages */}
              {grouped.map(item => {
                if (item.type === 'divider') {
                  return (
                    <div key={item.id} style={styles.dateDivider}>
                      <span style={styles.dateDividerLabel}>{item.label}</span>
                    </div>
                  );
                }

                const isMine  = (item.sender?._id || item.sender) === (user._id?.toString?.() || user._id)
                             || item.sender === user._id;
                const isOptimistic = item._id?.startsWith?.('opt-');

                return (
                  <div
                    key={item._id}
                    style={{
                      ...styles.msgRow,
                      justifyContent: isMine ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {!isMine && (
                      <Avatar
                        name={item.senderName}
                        photo={item.senderPhoto}
                        size={32}
                      />
                    )}
                    <div style={{
                      ...styles.bubble,
                      marginLeft:  isMine ? 0   : 8,
                      marginRight: isMine ? 0   : 0,
                      background:  isMine ? 'var(--blue-primary)'    : 'var(--white)',
                      color:       isMine ? '#fff'                   : 'var(--text-primary)',
                      borderRadius: isMine
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px',
                      opacity: isOptimistic ? 0.75 : 1
                    }}>
                      <div style={styles.bubbleContent}>{item.content}</div>
                      <div style={{
                        ...styles.bubbleTime,
                        color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
                      }}>
                        {formatTime(item.createdAt)}
                        {isMine && item.readAt && !isOptimistic && (
                          <span title="Seen" style={{ marginLeft: 4 }}>✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {theyTyping && (
                <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                  <div style={{ ...styles.bubble, background: 'var(--white)', borderRadius: '18px 18px 18px 4px' }}>
                    <div style={styles.typingDots}>
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Compose bar */}
            <div style={styles.composeBar}>
              <textarea
                value={draft}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={styles.composeInput}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                style={{
                  ...styles.sendBtn,
                  opacity: draft.trim() ? 1 : 0.5,
                  cursor:  draft.trim() ? 'pointer' : 'default'
                }}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display:       'flex',
    height:        'calc(100vh - 60px)', // subtract navbar height
    background:    'var(--bg-page)',
    overflow:      'hidden'
  },

  // ── Left panel
  left: {
    width:           320,
    minWidth:        260,
    display:         'flex',
    flexDirection:   'column',
    borderRight:     '1px solid var(--border)',
    background:      'var(--white)',
    overflow:        'hidden'
  },
  leftHeader: {
    padding:         '20px 16px 12px',
    borderBottom:    '1px solid var(--border)',
    background:      'var(--white)',
    flexShrink:      0
  },
  leftTitle: {
    fontFamily:      'Playfair Display, serif',
    fontSize:        22,
    fontWeight:      700,
    color:           'var(--dark-primary)',
    margin:          0,
    display:         'flex',
    alignItems:      'center',
    gap:             8
  },
  globalBadge: {
    background:      'var(--blue-primary)',
    color:           '#fff',
    borderRadius:    20,
    padding:         '1px 8px',
    fontSize:        12,
    fontWeight:      700
  },
  newDmBtn: {
    background:      'var(--blue-tint)',
    border:          'none',
    borderRadius:    8,
    padding:         '6px 10px',
    cursor:          'pointer',
    fontSize:        16
  },
  newDmBox: {
    marginTop:       12,
    display:         'flex',
    flexDirection:   'column',
    gap:             4
  },
  newDmInput: {
    width:           '100%',
    padding:         '8px 12px',
    borderRadius:    8,
    border:          '1.5px solid var(--border)',
    fontSize:        14,
    outline:         'none',
    boxSizing:       'border-box',
    fontFamily:      'DM Sans, sans-serif'
  },
  searchHint: {
    fontSize:        13,
    color:           'var(--text-muted)',
    padding:         '4px 2px',
    margin:          0
  },
  userResult: {
    display:         'flex',
    alignItems:      'center',
    width:           '100%',
    background:      'var(--bg-page)',
    border:          'none',
    borderRadius:    8,
    padding:         '8px 10px',
    cursor:          'pointer',
    textAlign:       'left',
    transition:      'background 0.15s'
  },
  convoList: {
    flex:            1,
    overflowY:       'auto',
    padding:         '8px 0'
  },
  convoItem: {
    display:         'flex',
    alignItems:      'center',
    width:           '100%',
    padding:         '12px 16px',
    border:          'none',
    cursor:          'pointer',
    textAlign:       'left',
    transition:      'background 0.15s',
    borderLeft:      '3px solid transparent'
  },
  convoInfo: {
    flex:            1,
    minWidth:        0,
    marginLeft:      10
  },
  convoTop: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center'
  },
  convoName: {
    fontWeight:      600,
    fontSize:        14,
    color:           'var(--text-primary)',
    whiteSpace:      'nowrap',
    overflow:        'hidden',
    textOverflow:    'ellipsis',
    maxWidth:        140
  },
  convoTime: {
    fontSize:        11,
    color:           'var(--text-muted)',
    flexShrink:      0,
    marginLeft:      6
  },
  convoBottom: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    marginTop:       2
  },
  convoPreview: {
    fontSize:        13,
    whiteSpace:      'nowrap',
    overflow:        'hidden',
    textOverflow:    'ellipsis',
    maxWidth:        170
  },
  unreadBadge: {
    background:      'var(--blue-primary)',
    color:           '#fff',
    borderRadius:    20,
    padding:         '1px 7px',
    fontSize:        11,
    fontWeight:      700,
    flexShrink:      0
  },
  emptyState: {
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    height:          '100%',
    color:           'var(--text-muted)',
    fontSize:        14,
    padding:         24,
    textAlign:       'center'
  },

  // ── Right panel
  right: {
    flex:            1,
    display:         'flex',
    flexDirection:   'column',
    overflow:        'hidden',
    background:      'var(--bg-page)'
  },
  noChatState: {
    flex:            1,
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    color:           'var(--text-body)',
    padding:         32
  },
  chatHeader: {
    display:         'flex',
    alignItems:      'center',
    padding:         '14px 20px',
    borderBottom:    '1px solid var(--border)',
    background:      'var(--white)',
    flexShrink:      0
  },
  chatName: {
    fontWeight:      700,
    fontSize:        16,
    color:           'var(--dark-primary)'
  },
  chatSub: {
    fontSize:        12,
    color:           'var(--text-muted)',
    marginTop:       1
  },
  messagesBody: {
    flex:            1,
    overflowY:       'auto',
    padding:         '16px 20px',
    display:         'flex',
    flexDirection:   'column',
    gap:             4
  },
  loadingMsg: {
    textAlign:       'center',
    color:           'var(--text-muted)',
    fontSize:        14,
    padding:         20
  },
  emptyChat: {
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    flex:            1,
    color:           'var(--text-muted)',
    fontSize:        14,
    gap:             4
  },
  dateDivider: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    margin:          '12px 0 8px'
  },
  dateDividerLabel: {
    background:      'var(--blue-tint)',
    color:           'var(--text-muted)',
    fontSize:        11,
    fontWeight:      600,
    padding:         '3px 12px',
    borderRadius:    20
  },
  msgRow: {
    display:         'flex',
    alignItems:      'flex-end',
    marginBottom:    4
  },
  bubble: {
    maxWidth:        '65%',
    padding:         '10px 14px',
    boxShadow:       '0 1px 3px rgba(0,0,0,0.08)'
  },
  bubbleContent: {
    fontSize:        14,
    lineHeight:      1.5,
    whiteSpace:      'pre-wrap',
    wordBreak:       'break-word'
  },
  bubbleTime: {
    fontSize:        10,
    marginTop:       4,
    textAlign:       'right'
  },
  typingDots: {
    display:         'flex',
    gap:             5,
    padding:         '4px 2px'
  },
  loadMoreBtn: {
    background:      'var(--blue-tint)',
    border:          'none',
    borderRadius:    8,
    padding:         '6px 16px',
    fontSize:        13,
    color:           'var(--blue-primary)',
    cursor:          'pointer',
    fontWeight:      600
  },
  composeBar: {
    display:         'flex',
    alignItems:      'flex-end',
    gap:             10,
    padding:         '12px 16px',
    borderTop:       '1px solid var(--border)',
    background:      'var(--white)',
    flexShrink:      0
  },
  composeInput: {
    flex:            1,
    resize:          'none',
    border:          '1.5px solid var(--border)',
    borderRadius:    12,
    padding:         '10px 14px',
    fontSize:        14,
    fontFamily:      'DM Sans, sans-serif',
    lineHeight:      1.5,
    outline:         'none',
    overflow:        'hidden',
    minHeight:       42,
    maxHeight:       120,
    transition:      'border-color 0.2s'
  },
  sendBtn: {
    width:           42,
    height:          42,
    borderRadius:    '50%',
    background:      'var(--blue-primary)',
    border:          'none',
    color:           '#fff',
    fontSize:        17,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    transition:      'opacity 0.2s'
  }
};