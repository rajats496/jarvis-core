/**
 * ChatInput — Jarvis HUD-styled voice waveform + send input.
 */
import { useState, useRef } from 'react';

export default function ChatInput({ onSend, disabled, placeholder = 'Ask Jarvis anything...', voice, voiceEnabled = true }) {
  const [value, setValue] = useState(
    () => sessionStorage.getItem('jarvis_chatDraft') || ''
  );

  const updateValue = (v) => {
    setValue(v);
    if (v) sessionStorage.setItem('jarvis_chatDraft', v);
    else sessionStorage.removeItem('jarvis_chatDraft');
  };
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    updateValue('');
  };

  const hasVoice   = voiceEnabled && voice?.supported?.stt;
  const listening   = voice?.listening   ?? false;
  const isSpeaking  = voice?.isSpeaking  ?? false;

  return (
    <>
      <form onSubmit={handleSubmit} style={wrapStyle} className="chat-input-form">
        {/* Voice waveform OR mic button */}
        {hasVoice && (
          <button
            type="button"
            style={micBtnStyle(listening, disabled)}
            onClick={() => (listening ? voice.stopListening() : voice.startListening())}
            disabled={disabled}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            title={listening ? 'Stop' : 'Voice input'}
          >
            {listening ? (
              <span style={waveformStyle}>
                {[4,8,14,20,28,20,14,8,4,8,14].map((h, i) => (
                  <span key={i} className="wave-bar" style={{ height: h, animationDelay: `${i * 0.08}s` }} />
                ))}
              </span>
            ) : '🎤'}
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => updateValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') inputRef.current?.blur(); }}
          placeholder={placeholder}
          className="holo-input"
          style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}) }}
          disabled={disabled}
          aria-label="Chat message"
        />

        {isSpeaking && (
          <button
            type="button"
            style={stopSpeakBtnStyle}
            onClick={() => voice.stopSpeaking()}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.color = '#FCA5A5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,20,35,0.85)'; e.currentTarget.style.color = '#F87171'; }}
            aria-label="Stop speaking"
            title="Stop AI speaking"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            Stop
          </button>
        )}

        <button
          type="submit"
          className="holo-button"
          style={sendBtnStyle(disabled || !value.trim())}
          disabled={disabled || !value.trim()}
          aria-label="Send"
        >
          ▶
        </button>
      </form>
      {voice?.error && (
        <div style={errorStyle}>{voice.error}</div>
      )}
    </>
  );
}

const wrapStyle = {
  display: 'flex',
  gap: '0.6rem',
  padding: '0.85rem 1.1rem',
  background: 'rgba(8,10,18,0.92)',
  borderTop: '1px solid rgba(160,180,220,0.16)',
  backdropFilter: 'blur(14px)',
  alignItems: 'center',
};

const inputStyle = {
  flex: 1,
  background: 'transparent',
  border: '1px solid rgba(180,196,220,0.10)',
  borderRadius: '12px',
  color: 'var(--jarvis-text)',
  padding: '0 1rem',
  height: '48px',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const inputFocusStyle = {
  borderColor: 'rgba(200,218,245,0.40)',
  boxShadow: '0 0 0 2px rgba(160,190,230,0.06)',
};

const sendBtnStyle = (disabled) => ({
  padding: '0.75rem 1.1rem',
  fontSize: '1rem',
  opacity: disabled ? 0.4 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
  minWidth: 'auto',
});

const micBtnStyle = (listening, disabled) => ({
  padding: '0.6rem 0.75rem',
  border: listening ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(180,200,230,0.22)',
  borderRadius: '12px',
  background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(184,196,216,0.06)',
  color: listening ? '#EF4444' : '#B8C4D8',
  fontSize: '1rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  boxShadow: listening ? '0 0 12px rgba(239,68,68,0.3)' : 'none',
});

const waveformStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  height: '28px',
};

const stopSpeakBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '0 11px',
  height: 34,
  border: '1px solid rgba(239,68,68,0.28)',
  borderRadius: 20,
  background: 'rgba(15,20,35,0.85)',
  color: '#F87171',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Rajdhani', sans-serif",
  letterSpacing: '0.04em',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background 0.2s, color 0.2s',
  whiteSpace: 'nowrap',
};

const errorStyle = {
  padding: '0.3rem 1.1rem',
  fontSize: '0.8rem',
  color: 'var(--jarvis-error)',
};
