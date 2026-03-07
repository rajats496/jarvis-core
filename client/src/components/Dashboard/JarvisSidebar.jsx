/**
 * JarvisSidebar - Dark Indigo navigation panel
 */
import { useState } from 'react';

/* SVG icon path helper */
const NavIcon = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const navItems = [
  { id: 'chat', label: 'Chat', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'memory', label: 'Memory', d: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z' },
  { id: 'tasks', label: 'Tasks', d: 'M3 13l2-2 4 4 8-8 4 4' },
  { id: 'goals', label: 'Goals', d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'reminders', label: 'Reminders', d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  { id: 'activity', label: 'Activity', d: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'commands', label: 'Desktop Control', d: 'M2 20h20M5 20V10l7-7 7 7v10' },
  { id: 'analytics', label: 'Analytics', d: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'settings', label: 'Settings', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
];

export default function JarvisSidebar({ activeTab, onTabChange, user }) {
  return (
    <div className="jarvis-sidebar" style={sidebarStyle}>
      {/* Brand */}
      <div style={brandStyle}>
        <div style={brandLogoStyle}>
          {/* AI Core Hex emblem — arctic */}
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 0 4px rgba(200,220,255,0.55))' }}>
            <polygon points="50,6 88,28 88,72 50,94 12,72 12,28"
              stroke="#B8C4D8" strokeWidth="2" fill="none" strokeLinejoin="round"/>
            <polygon points="50,20 74,34 74,66 50,80 26,66 26,34"
              stroke="#7A8A9E" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.55"/>
            <polygon points="50,32 64,50 50,68 36,50"
              stroke="#D0DCEF" strokeWidth="1.8" fill="rgba(200,220,255,0.05)" strokeLinejoin="round"/>
            <circle cx="50" cy="50" r="4.5" fill="#EEF4FF" opacity="0.90"/>
            <circle cx="50" cy="50" r="2" fill="#FFFFFF"/>
          </svg>
        </div>
        <div>
          <span style={brandTextStyle}>J.A.R.V.I.S</span>
          <div style={brandSubStyle}>v4.1 · AI CORE ONLINE</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={navStyle}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`jarvis-nav-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
            style={{ margin: '1px 0' }}
          >
            <NavIcon d={item.d} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div style={profileCardStyle}>
        <div style={avatarStyle}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={profileInfoStyle}>
          <div style={profileNameStyle}>{user?.email?.split('@')[0] || 'User'}</div>
          <div style={profileEmailStyle}>
            <span style={statusDotStyle} />
            SYSTEM ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}

const sidebarStyle = {
  width: '260px',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
  background: 'rgba(8, 10, 16, 0.96)',
  borderRight: '1px solid rgba(180, 196, 220, 0.09)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

const brandStyle = {
  padding: '22px 18px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderBottom: '1px solid rgba(180, 196, 220, 0.09)',
  flexShrink: 0,
};

const brandLogoStyle = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
  background: 'rgba(160, 185, 220, 0.06)',
  border: '1px solid rgba(200, 216, 240, 0.22)',
  animation: 'skull-pulse 4s ease-in-out infinite',
};

const brandTextStyle = {
  fontFamily: "'Orbitron', monospace",
  fontWeight: 700,
  fontSize: '13.5px',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #B8C4D8 55%, #7A90B0 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  letterSpacing: '0.14em',
  display: 'block',
};

const brandSubStyle = {
  fontSize: '9px',
  color: '#2E3545',
  fontFamily: "'DM Mono', monospace",
  letterSpacing: '0.12em',
  marginTop: '3px',
};

const navStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  scrollbarWidth: 'none',
};

const profileCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 16px',
  borderTop: '1px solid rgba(180, 196, 220, 0.09)',
  cursor: 'pointer',
  transition: 'background 0.18s',
};

const avatarStyle = {
  width: '30px',
  height: '30px',
  flexShrink: 0,
  clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
  background: 'linear-gradient(135deg, #1A1E28, #262D3A)',
  border: '1px solid rgba(180, 200, 230, 0.20)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Orbitron', monospace",
  fontSize: '9px',
  fontWeight: 700,
  color: '#B8C4D8',
};

const profileInfoStyle = {
  flex: 1,
  minWidth: 0,
};

const profileNameStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6E7A90',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: "'Rajdhani', sans-serif",
};

const profileEmailStyle = {
  fontSize: '9px',
  color: '#2E3545',
  fontFamily: "'DM Mono', monospace",
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  marginTop: '2px',
  letterSpacing: '0.06em',
};

const statusDotStyle = {
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  background: '#C8D8F0',
  boxShadow: '0 0 6px rgba(200, 220, 255, 0.90)',
  display: 'inline-block',
  animation: 'blink 3s ease-in-out infinite',
  flexShrink: 0,
};
