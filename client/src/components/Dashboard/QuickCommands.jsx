/**
 * QuickCommands — 4 holographic hex command buttons.
 * Each fires a callback so the parent can navigate or run a system action.
 */

const COMMANDS = [
  {
    id: 'cpu',
    label: 'Check CPU',
    icon: '⬡',
    sub: 'System',
    color: '#B8C4D8',
    shadow: 'rgba(184,196,216,0.35)',
  },
  {
    id: 'diagnostics',
    label: 'Run Diagnostics',
    icon: '⚙',
    sub: 'System',
    color: '#B8C4D8',
    shadow: 'rgba(184,196,216,0.35)',
  },
  {
    id: 'analytics',
    label: 'View Analytics',
    icon: '◈',
    sub: 'Reports',
    color: '#B8C4D8',
    shadow: 'rgba(184,196,216,0.35)',
  },
  {
    id: 'memories',
    label: 'Search Memories',
    icon: '◉',
    sub: 'Memory',
    color: '#B8C4D8',
    shadow: 'rgba(184,196,216,0.35)',
  },
];

export default function QuickCommands({ onCommand }) {
  return (
    <div style={wrapStyle}>
      <div style={titleStyle}>
        <span style={titleDotStyle} />
        QUICK COMMANDS
      </div>
      <div style={gridStyle}>
        {COMMANDS.map((cmd) => (
          <HexButton key={cmd.id} cmd={cmd} onClick={() => onCommand?.(cmd.id)} />
        ))}
      </div>
    </div>
  );
}

function HexButton({ cmd, onClick }) {
  return (
    <button
      type="button"
      className="hex-btn"
      style={hexBtnStyle(cmd.color, cmd.shadow)}
      onClick={onClick}
      title={cmd.label}
    >
      {/* Hex clip overlay */}
      <span style={hexClipStyle(cmd.color)} />
      {/* Corner accent dots */}
      <span style={{ ...cornerDot, top: 4, left: 4, background: cmd.color }} />
      <span style={{ ...cornerDot, top: 4, right: 4, background: cmd.color }} />
      <span style={{ ...cornerDot, bottom: 4, left: 4, background: cmd.color }} />
      <span style={{ ...cornerDot, bottom: 4, right: 4, background: cmd.color }} />
      {/* Content */}
      <span style={iconStyle(cmd.color)}>{cmd.icon}</span>
      <span style={labelStyle(cmd.color)}>{cmd.label}</span>
      <span style={subStyle}>{cmd.sub}</span>
    </button>
  );
}

/* ── Styles ─────────────────────────────────────────────── */

const wrapStyle = {
  marginTop: '1.5rem',
};

const titleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '1.5px',
  color: 'var(--jarvis-text-muted)',
  marginBottom: '0.85rem',
  textTransform: 'uppercase',
};

const titleDotStyle = {
  display: 'inline-block',
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#B8C4D8',
  boxShadow: '0 0 6px rgba(184,196,216,0.5)',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
};

const hexBtnStyle = (color, shadow) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '14px 8px',
  background: 'rgba(10, 12, 18, 0.80)',
  border: `1px solid rgba(184,196,216,0.16)`,
  borderRadius: '10px',
  cursor: 'pointer',
  overflow: 'hidden',
  transition: 'all 0.25s ease',
  boxShadow: `0 0 14px rgba(184,196,216,0.06), inset 0 0 12px rgba(184,196,216,0.03)`,
  backdropFilter: 'blur(8px)',
});

const hexClipStyle = (color) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
  boxShadow: `0 0 6px ${color}`,
  borderRadius: '2px',
});

const cornerDot = {
  position: 'absolute',
  width: 4,
  height: 4,
  borderRadius: '50%',
  opacity: 0.7,
};

const iconStyle = (color) => ({
  fontSize: '1.4rem',
  color: color,
  lineHeight: 1,
  filter: `drop-shadow(0 0 6px ${color})`,
});

const labelStyle = (color) => ({
  fontSize: '0.7rem',
  fontWeight: 700,
  color: color,
  textAlign: 'center',
  letterSpacing: '0.5px',
  lineHeight: 1.3,
});

const subStyle = {
  fontSize: '0.62rem',
  color: 'var(--jarvis-text-muted)',
  letterSpacing: '0.5px',
};
