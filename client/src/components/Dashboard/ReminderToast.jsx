/**
 * ReminderToast — shows triggered reminders as dismissible toasts in the bottom-right corner.
 * Keyframes injected at module load so animation always plays correctly.
 */

import { useEffect } from 'react';

/* ── inject keyframes immediately at module load (before any render) ── */
(function injectKeyframes() {
  if (typeof document === 'undefined') return;
  const STYLE_ID = 'reminder-toast-keyframes';
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0);    }
    }
    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateX(0);    }
      to   { opacity: 0; transform: translateX(40px); }
    }
  `;
  document.head.appendChild(s);
})();

/* ── styles ─────────────────────────────────────────────────────────── */
const containerStyle = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  pointerEvents: 'none',
  maxWidth: 360,
  minWidth: 300,
};

function toastStyle(idx) {
  return {
    pointerEvents: 'all',
    background: 'rgba(10,12,20,0.97)',
    border: '1px solid rgba(184,196,216,0.25)',
    borderLeft: '4px solid #B8C4D8',
    borderRadius: 10,
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(12px)',
    /* animation fills forward — stays at opacity:1 after completing */
    animation: `toastSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) ${idx * 80}ms both`,
  };
}

const iconStyle = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'rgba(184,196,216,0.10)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const bodyStyle = { flex: 1, minWidth: 0 };

const labelStyle = {
  fontWeight: 600,
  fontSize: '0.75rem',
  color: '#B8C4D8',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '0.2rem',
};

const textStyle = {
  fontSize: '0.92rem',
  color: '#F1F5F9',
  lineHeight: 1.45,
  wordBreak: 'break-word',
};

const timeStyle = {
  fontSize: '0.72rem',
  color: 'rgba(184,196,216,0.60)',
  marginTop: '0.28rem',
  fontFamily: 'monospace',
};

const dismissBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(148,163,184,0.7)',
  padding: '2px',
  lineHeight: 1,
  flexShrink: 0,
  borderRadius: 4,
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch { return dateStr; }
}

/* ── component ──────────────────────────────────────────────────────── */
export default function ReminderToast({ notifications, onDismiss }) {
  // Auto-dismiss each toast after 15 seconds
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const timers = notifications.map((n) =>
      setTimeout(() => onDismiss(n.id), 15000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, onDismiss]);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div style={containerStyle} aria-live="assertive" aria-label="Reminder notifications">
      {notifications.map((n, idx) => (
        <div key={n.id} style={toastStyle(idx)} role="alert">
          <div style={iconStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div style={bodyStyle}>
            <div style={labelStyle}>🔔 Reminder</div>
            <div style={textStyle}>{n.text}</div>
            {n.triggerAt && <div style={timeStyle}>{formatTime(n.triggerAt)}</div>}
          </div>
          <button
            style={dismissBtnStyle}
            title="Dismiss"
            aria-label="Dismiss reminder"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(148,163,184,0.7)')}
            onClick={() => onDismiss(n.id)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
