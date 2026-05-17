import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BOT_NAME = 'UniVerse Assistant';

function parseMarkdownBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 600 }}>{part}</strong>
      : part
  );
}

function FormattedMessage({ text }) {
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {parseMarkdownBold(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ChatBot({ activeTab }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([{
        id: Date.now(),
        role: 'bot',
        text: `Hello ${user?.name || 'there'}! 👋 I'm the UniVerse Assistant. I can help you navigate the portal.\n\nTry asking about **clubs**, **events**, **study groups**, or say **"tour"** for a full walkthrough!`,
      }]);
      setSuggestions(['Give me a tour', 'How do I join a club?', 'Help']);
    }
  }, [isOpen, user?.name]);

  useEffect(() => {
    if (isOpen) {
      api.get('/chatbot/suggestions', { params: { activeTab } })
        .then(({ data }) => {
          if (data.success) setSuggestions(data.suggestions);
        })
        .catch(() => {});
    }
  }, [activeTab, isOpen]);

  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg) return;

    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/message', { message: userMsg, activeTab });
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: data.reply }]);
      if (data.suggestions) setSuggestions(data.suggestions);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: 'Sorry, I encountered an error. Please try again!',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating action button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat assistant"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f1b2d 0%, #1a2d4a 100%)',
            border: '2px solid rgba(201,168,76,0.4)',
            color: '#e8c97a',
            fontSize: '1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(15,27,45,0.4)',
            zIndex: 1000,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(15,27,45,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,27,45,0.4)';
          }}
        >
          🤖
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window" style={{
          position: 'fixed',
          background: '#fff',
          border: '1px solid rgba(15,27,45,0.12)',
          boxShadow: '0 12px 48px rgba(15,27,45,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000,
          animation: 'chatbotSlideUp 0.25s ease-out',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0f1b2d 0%, #1a2d4a 100%)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '2px solid rgba(201,168,76,0.3)',
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(232,200,122,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                color: '#e8c97a',
                fontFamily: 'Playfair Display, serif',
                fontSize: '0.95rem',
                fontWeight: 600,
                lineHeight: 1.2,
              }}>
                {BOT_NAME}
              </p>
              <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.7rem' }}>
                Your portal guide
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'rgba(245,240,232,0.7)',
                width: 30,
                height: 30,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#f8f9fa',
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'chatMsgFade 0.2s ease-out',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '14px 14px 4px 14px'
                    : '14px 14px 14px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #0f1b2d, #1a2d4a)'
                    : '#ffffff',
                  color: msg.role === 'user' ? '#f5f0e8' : '#333',
                  fontSize: '0.84rem',
                  lineHeight: 1.55,
                  boxShadow: msg.role === 'user'
                    ? 'none'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  border: msg.role === 'user'
                    ? 'none'
                    : '1px solid rgba(0,0,0,0.06)',
                }}>
                  <FormattedMessage text={msg.text} />
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 18px',
                  borderRadius: '14px 14px 14px 4px',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  gap: 5,
                  alignItems: 'center',
                }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#c9a84c',
                        opacity: 0.5,
                        animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div style={{
              padding: '6px 14px 2px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              background: '#fff',
              borderTop: '1px solid rgba(0,0,0,0.05)',
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: '1px solid rgba(201,168,76,0.35)',
                    background: 'rgba(201,168,76,0.06)',
                    color: '#0f1b2d',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              gap: 8,
              background: '#fff',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the portal..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 24,
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: '0.84rem',
                outline: 'none',
                transition: 'border-color 0.15s',
                background: '#f8f9fa',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: input.trim()
                  ? 'linear-gradient(135deg, #0f1b2d, #1a2d4a)'
                  : '#e0e0e0',
                border: input.trim()
                  ? '1px solid rgba(201,168,76,0.3)'
                  : '1px solid transparent',
                color: input.trim() ? '#e8c97a' : '#999',
                fontSize: '1rem',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <style>{`
        .chatbot-window {
          bottom: 24px;
          right: 24px;
          width: 380px;
          max-width: calc(100vw - 48px);
          height: 520px;
          max-height: calc(100vh - 48px);
          border-radius: 16px;
        }
        @media (max-width: 480px) {
          .chatbot-window {
            bottom: 0;
            right: 0;
            width: 100vw;
            max-width: 100vw;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }
        }
        @keyframes chatbotSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatMsgFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30%            { opacity: 1;   transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
