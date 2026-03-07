/**
 * MobileNavDrawer — Slide-in navigation drawer for mobile/small tablet.
 * Visible only on screens < 768px via CSS.
 * Mirrors JarvisSidebar tabs + user profile in the JARVIS theme.
 */
import { useEffect } from 'react';

/* ── SVG icon helper (same as JarvisSidebar) ── */
const NavIcon = ({ d, size = 16 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

const navItems = [
  { id: 'chat',      label: 'Chat',            d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'memory',    label: 'Memory',           d: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z' },
  { id: 'tasks',     label: 'Tasks',            d: 'M3 13l2-2 4 4 8-8 4 4' },
  { id: 'goals',     label: 'Goals',            d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'reminders', label: 'Reminders',        d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  { id: 'activity',  label: 'Activity',         d: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'commands',  label: 'Desktop Control',  d: 'M2 20h20M5 20V10l7-7 7 7v10' },
  { id: 'search',    label: 'Search',           d: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' },
  { id: 'analytics', label: 'Analytics',        d: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'status',    label: 'System Status',    d: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'settings',  label: 'Settings',         d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
];

export default function MobileNavDrawer({ open, onClose, activeTab, onTabChange, user, onLogout }) {
  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleTabSelect = (id) => {
    onTabChange(id);
    onClose();
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="mobile-drawer-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
        onClick={onClose}
      />

      {/* ── Drawer panel ── */}
      <div
        className="mobile-drawer-panel"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 'min(280px, 82vw)',
          zIndex: 999,
          display: 'flex', flexDirection: 'column',
          background: 'rgba(8, 10, 16, 0.98)',
          borderRight: '1px solid rgba(180, 196, 220, 0.10)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.30s cubic-bezier(0.32, 0.72, 0, 1)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* ── Header row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 16px 14px',
          borderBottom: '1px solid rgba(180,196,220,0.07)',
          flexShrink: 0,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none"
              style={{ filter: 'drop-shadow(0 0 4px rgba(200,220,255,0.55))', flexShrink: 0 }}>
              <polygon points="50,6 88,28 88,72 50,94 12,72 12,28"
                stroke="#B8C4D8" strokeWidth="2" fill="none" strokeLinejoin="round"/>
              <polygon points="50,20 74,34 74,66 50,80 26,66 26,34"
                stroke="#7A8A9E" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.55"/>
              <circle cx="50" cy="50" r="4.5" fill="#EEF4FF" opacity="0.90"/>
              <circle cx="50" cy="50" r="2" fill="#FFFFFF"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em',
                fontFamily: "'Orbitron', sans-serif", color: '#EEF2FF' }}>J.A.R.V.I.S</div>
              <div style={{ fontSize: 9.5, color: '#2E3D52', fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.08em', marginTop: 1 }}>AI CORE ONLINE</div>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(180,196,220,0.10)',
              background: 'transparent', cursor: 'pointer', color: '#4A5568',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s', flexShrink: 0,
            }}
            onTouchStart={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.color = '#EEF2FF'; }}
            onTouchEnd={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A5568'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`jarvis-nav-item${isActive ? ' active' : ''}`}
                onClick={() => handleTabSelect(item.id)}
                style={{ width: '100%', margin: '1px 0', fontSize: 13 }}
              >
                <NavIcon d={item.d} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ── User card + logout ── */}
        <div style={{
          padding: '12px 12px 20px',
          borderTop: '1px solid rgba(180,196,220,0.07)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', borderRadius: 10,
            background: 'rgba(184,196,216,0.04)',
            border: '1px solid rgba(180,196,220,0.07)',
            marginBottom: 8,
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, rgba(180,196,216,0.15), rgba(100,130,170,0.20))',
              border: '1px solid rgba(180,196,220,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#B8C4D8',
              fontFamily: "'Orbitron', sans-serif", flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#B8C4D8',
                fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email?.split('@')[0] || 'User'}
              </div>
              <div style={{ fontSize: 10, color: '#22C55E', fontFamily: "'DM Mono', monospace",
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E',
                  boxShadow: '0 0 5px #22C55E', display: 'inline-block', flexShrink: 0 }} />
                SYSTEM ACTIVE
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => { onLogout(); onClose(); }}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.18)',
              background: 'rgba(239,68,68,0.06)', color: '#F87171',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onTouchStart={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}
            onTouchEnd={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            LOGOUT
          </button>
        </div>
      </div>
    </>
  );
}
