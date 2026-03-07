/**
 * JarvisAvatar — Arctic hexagonal AI Core emblem for the chat empty state.
 * Matches the J.A.R.V.I.S arctic precision design — no indigo, pure silver/ice.
 */
export default function JarvisAvatar({ size = 180 }) {
  return (
    <div className="jarvis-avatar-wrap" style={{ ...wrapStyle, width: size, height: size }}>
      {/* Outer octagon clip frame — pulsing */}
      <div style={outerFrameStyle} />

      {/* AI Core SVG emblem */}
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={svgStyle}
      >
        <defs>
          <filter id="av-glow">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="av-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#B8C4D8" stopOpacity="0.70" />
          </linearGradient>
        </defs>

        {/* Outer hexagon frame */}
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          stroke="#B8C4D8" strokeWidth="2" fill="none" strokeLinejoin="round"
          filter="url(#av-glow)"
          opacity="0.9"
        />
        {/* Mid hexagon rotated */}
        <polygon
          points="50,18 76,33 76,67 50,82 24,67 24,33"
          stroke="#7A8A9E" strokeWidth="1.2" fill="none" strokeLinejoin="round"
          opacity="0.55"
        />
        {/* Radial tick marks */}
        <line x1="50" y1="6"  x2="50" y2="18"  stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
        <line x1="88" y1="28" x2="76" y2="33"  stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
        <line x1="88" y1="72" x2="76" y2="67"  stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
        <line x1="50" y1="94" x2="50" y2="82"  stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
        <line x1="12" y1="72" x2="24" y2="67"  stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
        <line x1="12" y1="28" x2="24" y2="33"  stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55" />
        {/* Inner diamond iris */}
        <polygon
          points="50,30 64,50 50,70 36,50"
          stroke="#D0DCEF" strokeWidth="1.8" fill="rgba(200,220,255,0.05)" strokeLinejoin="round"
          filter="url(#av-glow)"
        />
        {/* Crosshair */}
        <line x1="36" y1="50" x2="30" y2="50" stroke="#5A6A80" strokeWidth="1" opacity="0.45" />
        <line x1="64" y1="50" x2="70" y2="50" stroke="#5A6A80" strokeWidth="1" opacity="0.45" />
        <line x1="50" y1="30" x2="50" y2="24" stroke="#5A6A80" strokeWidth="1" opacity="0.45" />
        <line x1="50" y1="70" x2="50" y2="76" stroke="#5A6A80" strokeWidth="1" opacity="0.45" />
        {/* Core dot — animated */}
        <circle cx="50" cy="50" r="5" fill="#EEF4FF" opacity="0.90">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="2.5" fill="#FFFFFF">
          <animate attributeName="r" values="2.5;3.2;2.5" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

const wrapStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1.5rem',
};

const outerFrameStyle = {
  position: 'absolute',
  inset: 0,
  clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
  border: '1px solid rgba(200, 216, 240, 0.22)',
  background: 'rgba(160, 185, 220, 0.04)',
  animation: 'skull-pulse 4s ease-in-out infinite',
};

const svgStyle = {
  position: 'relative',
  zIndex: 1,
  filter: 'drop-shadow(0 0 6px rgba(200,220,255,0.45))',
  animation: 'skull-glow 4s ease-in-out infinite',
};
