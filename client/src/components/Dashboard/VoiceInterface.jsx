/**
 * VoiceInterface — Microphone button + animated silver waveform.
 * Can be used standalone or embedded anywhere.
 *
 * Props:
 *   listening  {boolean}  — is mic currently active?
 *   onStart    {fn}       — called when mic button pressed to start
 *   onStop     {fn}       — called when mic button pressed to stop
 *   transcript {string}   — live partial text (optional)
 *   disabled   {boolean}
 */
import { useEffect, useRef, useState } from 'react';

const BAR_COUNT = 16;

function randomHeights() {
  return Array.from({ length: BAR_COUNT }, () => Math.random() * 28 + 4);
}

export default function VoiceInterface({ listening, onStart, onStop, transcript = '', disabled = false }) {
  const [bars, setBars] = useState(() => Array(BAR_COUNT).fill(6));
  const frameRef = useRef(null);

  /* Animate bars while listening */
  useEffect(() => {
    if (listening) {
      const tick = () => {
        setBars(randomHeights());
        frameRef.current = setTimeout(tick, 120);
      };
      tick();
    } else {
      clearTimeout(frameRef.current);
      setBars(Array(BAR_COUNT).fill(6));
    }
    return () => clearTimeout(frameRef.current);
  }, [listening]);

  const toggle = () => {
    if (disabled) return;
    listening ? onStop?.() : onStart?.();
  };

  return (
    <div style={containerStyle}>
      {/* Section title */}
      <div style={titleStyle}>
        <span style={titleDotStyle} />
        VOICE COMMAND
      </div>

      {/* Central mic button */}
      <div style={centerStyle}>
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          style={micBtnStyle(listening, disabled)}
          aria-label={listening ? 'Stop voice command' : 'Start voice command'}
        >
          {/* Outer pulse ring — only when listening */}
          {listening && <span style={pulseRingStyle} />}
          {/* Mic SVG icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', zIndex: 1 }}>
            <rect x="9" y="2" width="6" height="12" rx="3"
              fill={listening ? '#EF4444' : '#B8C4D8'}
              filter={`drop-shadow(0 0 4px ${listening ? '#EF4444' : '#B8C4D8'})`}
            />
            <path
              d="M5 11c0 3.866 3.134 7 7 7s7-3.134 7-7"
              stroke={listening ? '#EF4444' : '#B8C4D8'}
              strokeWidth="2" strokeLinecap="round"
              filter={`drop-shadow(0 0 3px ${listening ? '#EF4444' : '#B8C4D8'})`}
            />
            <line x1="12" y1="18" x2="12" y2="22"
              stroke={listening ? '#EF4444' : '#B8C4D8'}
              strokeWidth="2" strokeLinecap="round" />
            <line x1="9" y1="22" x2="15" y2="22"
              stroke={listening ? '#EF4444' : '#B8C4D8'}
              strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Status text */}
        <div style={statusTextStyle(listening)}>
          {listening ? '● LISTENING...' : disabled ? 'UNAVAILABLE' : 'TAP TO SPEAK'}
        </div>
      </div>

      {/* Waveform visualizer */}
      <div style={waveContainerStyle}>
        <div style={waveRowStyle}>
          {bars.map((h, i) => (
            <span
              key={i}
              style={barStyle(h, i, listening)}
            />
          ))}
        </div>
        {/* Reflection */}
        <div style={{ ...waveRowStyle, ...reflectionStyle }}>
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ ...barStyle(h * 0.35, i, listening), opacity: 0.25 }}
            />
          ))}
        </div>
      </div>

      {/* Live transcript */}
      {transcript && (
        <div style={transcriptStyle}>
          <span style={{ color: '#B8C4D8', marginRight: '6px' }}>▶</span>
          {transcript}
        </div>
      )}
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────── */

const containerStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  background: 'rgba(10,12,18,0.90)',
  border: '1px solid rgba(184,196,216,0.10)',
  borderRadius: '12px',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
};

const titleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '1.5px',
  color: 'var(--jarvis-text-muted)',
  marginBottom: '1rem',
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

const centerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '1rem',
};

const micBtnStyle = (listening, disabled) => ({
  position: 'relative',
  width: 64,
  height: 64,
  borderRadius: '50%',
  border: listening
    ? '2px solid rgba(239,68,68,0.7)'
    : '2px solid rgba(184,196,216,0.30)',
  background: listening
    ? 'radial-gradient(circle, rgba(239,68,68,0.2), rgba(10,12,18,0.92))'
    : 'radial-gradient(circle, rgba(184,196,216,0.07), rgba(10,12,18,0.92))',
  boxShadow: listening
    ? '0 0 24px rgba(239,68,68,0.4), inset 0 0 12px rgba(239,68,68,0.15)'
    : '0 0 20px rgba(184,196,216,0.10), inset 0 0 10px rgba(184,196,216,0.04)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.45 : 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  overflow: 'visible',
});

const pulseRingStyle = {
  position: 'absolute',
  width: 80,
  height: 80,
  borderRadius: '50%',
  border: '1.5px solid rgba(239,68,68,0.4)',
  animation: 'statusPulse 1.4s ease-out infinite',
  pointerEvents: 'none',
};

const statusTextStyle = (listening) => ({
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '1.5px',
  color: listening ? '#EF4444' : '#B8C4D8',
  textShadow: listening
    ? '0 0 8px rgba(239,68,68,0.7)'
    : '0 0 8px rgba(184,196,216,0.45)',
  animation: listening ? 'statusPulse 1.4s ease infinite' : 'none',
});

const waveContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
  padding: '0.5rem 0',
};

const waveRowStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: '3px',
  height: '40px',
};

const reflectionStyle = {
  transform: 'scaleY(-1)',
  height: '16px',
  overflow: 'hidden',
  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
};

const barStyle = (h, i, active) => {
  /* Uniform arctic silver bars */
  const color = '#B8C4D8';
  const glow = 'rgba(184,196,216,0.55)';
  return {
    display: 'inline-block',
    width: '5px',
    height: `${h}px`,
    borderRadius: '3px',
    background: active
      ? `linear-gradient(to top, ${color}88, ${color})`
      : 'rgba(184,196,216,0.12)',
    boxShadow: active ? `0 0 6px ${glow}` : 'none',
    transition: 'height 0.1s ease, box-shadow 0.15s ease',
    flexShrink: 0,
  };
};

const transcriptStyle = {
  marginTop: '0.75rem',
  padding: '0.6rem 0.8rem',
  background: 'rgba(184,196,216,0.05)',
  border: '1px solid rgba(184,196,216,0.10)',
  borderRadius: '8px',
  fontSize: '0.83rem',
  color: 'var(--text)',
  lineHeight: 1.45,
  minHeight: '2.2rem',
  boxShadow: 'none',
};
