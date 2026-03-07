/**
 * JarvisHeader - Clean dark topbar
 */
import { useState, useEffect, useRef } from 'react';

export default function JarvisHeader({ user, onLogout, sidebarCollapsed, onToggleSidebar, onOpenDrawer, onClearChat, notifications = [], onNotifDismiss }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const unreadCount = notifications.length;

  return (
    <header className="jarvis-header" style={headerStyle}>
      {/* Left — toggle + title */}
      <div style={leftStyle}>
        <button
          type="button"
          onClick={sidebarCollapsed ? onOpenDrawer : onToggleSidebar}
          title={sidebarCollapsed ? 'Open navigation' : 'Collapse Sidebar'}
          style={toggleBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#B8C4D8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A5568'; }}
        >
          {sidebarCollapsed
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={titleStyle} className="jarvis-title-text">Jarvis AI Assistant</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Center — AI status badge */}
      <div style={centerStyle}>
        <div style={aiBadgeStyle} className="jarvis-ai-badge">
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#4ADE80',
            display: 'inline-block', boxShadow: '0 0 7px #4ADE80',
            animation: 'pulseOnline 2s infinite',
          }} />
          <span className="jarvis-ai-badge-text">AI Enabled</span>
        </div>
      </div>

      {/* Right — bell + clear chat + logout */}
      <div style={rightStyle}>

        {/* Notification Bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setNotifOpen(o => !o)}
            title={unreadCount > 0 ? `${unreadCount} notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}
            style={{
              width: 34, height: 34, borderRadius: 9,
              border: `1px solid ${notifOpen ? 'rgba(200,216,240,0.30)' : 'rgba(180,196,220,0.10)'}`,
              background: notifOpen ? 'rgba(184,196,216,0.10)' : 'transparent',
              color: notifOpen ? '#EEF2FF' : '#2E3545',
              cursor: 'pointer', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.18s, color 0.18s, border-color 0.18s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.color = '#EEF2FF'; e.currentTarget.style.borderColor = 'rgba(200,216,240,0.28)'; }}
            onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2E3545'; e.currentTarget.style.borderColor = 'rgba(180,196,220,0.10)'; } }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                minWidth: 16, height: 16, borderRadius: 999,
                background: '#EF4444', color: '#fff',
                fontSize: 9, fontWeight: 700, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', pointerEvents: 'none',
                boxShadow: '0 0 6px rgba(239,68,68,0.55)',
                border: '1.5px solid #060709',
                fontFamily: "'DM Mono', monospace",
                animation: 'bellBadgePop 0.3s ease',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="notif-dropdown" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 300, maxHeight: 360,
              background: 'rgba(10, 12, 18, 0.98)',
              border: '1px solid rgba(180, 196, 220, 0.10)',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.60), 0 0 0 1px rgba(160,190,230,0.06)',
              zIndex: 200, overflow: 'hidden',
              fontFamily: "'Rajdhani', sans-serif",
            }}>
              <div style={{
                padding: '11px 14px 10px',
                borderBottom: '1px solid rgba(180, 196, 220, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#EEF2FF', fontFamily: "'Orbitron', monospace", letterSpacing: '0.10em' }}>NOTIFICATIONS</span>
                {unreadCount > 0 && (
                  <span style={{
                    background: 'rgba(239,68,68,0.12)', color: '#F87171',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 999, padding: '1px 8px', fontSize: 10.5, fontWeight: 600,
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '22px 14px', textAlign: 'center', color: '#475569', fontSize: 12.5 }}>
                  <div style={{ fontSize: 22, marginBottom: 7 }}>✓</div>
                  All clear — no pending alerts.
                </div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
                  {notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(180, 196, 220, 0.06)',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🔔</span>
                      <span style={{ flex: 1, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.5 }}>{n.text}</span>
                      <button
                        type="button"
                        onClick={() => onNotifDismiss?.(n.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 13, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <style>{`@keyframes bellBadgePop { 0% { transform: scale(0.5); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }`}</style>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClearChat}
          style={clearChatBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.12)'; e.currentTarget.style.borderColor = 'rgba(200,216,240,0.32)'; e.currentTarget.style.color = '#EEF2FF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.06)'; e.currentTarget.style.borderColor = 'rgba(180,200,230,0.18)'; e.currentTarget.style.color = '#B8C4D8'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
          Clear Chat
        </button>
        <button
          type="button"
          onClick={onLogout}
          style={logoutBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#B8C4D8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2E3545'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
  height: '64px',
  position: 'sticky',
  top: 0,
  zIndex: 50,
  flexShrink: 0,
  background: 'rgba(8, 10, 16, 0.82)',
  borderBottom: '1px solid rgba(180, 196, 220, 0.09)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const leftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const toggleBtnStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: '#4A5568',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.18s, color 0.18s',
  flexShrink: 0,
};

const titleStyle = {
  fontFamily: "'Orbitron', monospace",
  fontWeight: 700,
  fontSize: '13px',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #B8C4D8 55%, #7A90B0 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  letterSpacing: '0.10em',
};

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const aiBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(34, 197, 94, 0.08)',
  border: '1px solid rgba(34, 197, 94, 0.22)',
  borderRadius: '999px',
  padding: '4px 12px',
  fontSize: '11px',
  color: '#4ADE80',
  fontWeight: 600,
  fontFamily: "'DM Mono', monospace",
  letterSpacing: '0.06em',
};

const rightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const clearChatBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(184, 196, 216, 0.06)',
  border: '1px solid rgba(180, 200, 230, 0.18)',
  borderRadius: '8px',
  cursor: 'pointer',
  color: '#B8C4D8',
  fontSize: '12px',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 500,
  padding: '6px 12px',
  letterSpacing: '0.05em',
  transition: 'background 0.18s, border-color 0.18s, color 0.18s',
};

const logoutBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#2E3545',
  fontSize: '13px',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 500,
  padding: '6px 10px',
  borderRadius: '8px',
  transition: 'background 0.18s, color 0.18s',
};
