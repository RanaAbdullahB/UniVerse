import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '#22c55e' },
  error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', icon: '#f59e0b' },
  info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', icon: '#3b82f6' },
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {toasts.map((toast) => {
      const c = colors[toast.type] || colors.info;
      return (
        <div
          key={toast.id}
          className="animate-toast"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 260,
            maxWidth: 380,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          <span style={{ color: c.icon, fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
            {icons[toast.type]}
          </span>
          <span style={{ color: c.text, fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>
            {toast.message}
          </span>
          <button
            onClick={() => onRemove(toast.id)}
            style={{ color: c.text, opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      );
    })}
  </div>
);
