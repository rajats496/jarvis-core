/**
 * MessageBubble — Jarvis HUD-styled chat bubbles with neon glow.
 */
const wrapStyle = (role) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: role === 'user' ? 'flex-end' : 'flex-start',
  marginBottom: '1rem',
  maxWidth: '88%',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  animation: 'messageSlideIn 0.3s ease-out',
});

const bubbleStyle = (role) => ({
  padding: '0.85rem 1.1rem',
  borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  lineHeight: 1.55,
  fontSize: '0.95rem',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  ...(role === 'user'
    ? {
      background: 'linear-gradient(135deg, rgba(26,30,42,0.70), rgba(18,22,32,0.80))',
      border: '1px solid rgba(180,200,230,0.14)',
      color: '#EEF2FF',
      boxShadow: '0 2px 20px rgba(140,170,220,0.07)',
    }
    : {
      background: 'rgba(18,22,32,0.90)',
      border: '1px solid rgba(160,180,220,0.12)',
      color: '#EEF2FF',
      boxShadow: '0 2px 20px rgba(0,0,0,0.35)',
    }),
});

const sourcePillStyle = (source) => ({
  fontSize: '0.7rem',
  marginTop: '0.45rem',
  padding: '0.18rem 0.55rem',
  borderRadius: 8,
  display: 'inline-block',
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  ...(source === 'ai'
    ? { background: 'rgba(184,196,216,0.10)', color: '#B8C4D8', border: '1px solid rgba(180,200,230,0.22)', boxShadow: '0 0 8px rgba(180,200,240,0.12)' }
    : source === 'memory'
      ? { background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.4)' }
      : source === 'suggestions'
        ? { background: 'rgba(138,43,226,0.15)', color: '#A78BFA', border: '1px solid rgba(138,43,226,0.4)' }
        : { background: 'rgba(184,196,216,0.08)', color: '#B8C4D8', border: '1px solid rgba(180,200,230,0.18)' }),
});

const memoryListStyle = {
  marginTop: '0.5rem',
  paddingLeft: '1rem',
  fontSize: '0.85rem',
  color: '#9CA3AF',
  lineHeight: 1.5,
};

const actionBtnStyle = (color) => ({
  marginTop: '0.5rem',
  marginRight: '0.4rem',
  padding: '0.28rem 0.65rem',
  fontSize: '0.75rem',
  borderRadius: 8,
  background: 'transparent',
  border: `1px solid ${color}`,
  color: color,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

// ── ContentRenderer ──────────────────────────────────────────────────────────
// Parses content for markdown image data URIs and renders them as real <img> tags
const IMG_REGEX = /!\[([^\]]*)\]\((data:[^)]+)\)/g;

function ContentRenderer({ content }) {
  if (!content) return null;

  // Check if there's any data URI image in the content
  if (!content.includes('data:')) {
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>;
  }

  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(IMG_REGEX.source, 'g');

  while ((match = regex.exec(content)) !== null) {
    // Text before image
    if (match.index > lastIndex) {
      parts.push(
        <div key={`text-${lastIndex}`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 8 }}>
          {content.slice(lastIndex, match.index)}
        </div>
      );
    }
    // The image itself
    const [, alt, src] = match;
    parts.push(
      <div key={`img-${match.index}`} style={{ marginTop: 6, marginBottom: 6 }}>
        <img
          src={src}
          alt={alt || 'Screenshot'}
          onClick={() => window.open(src, '_blank')}
          style={{
            maxWidth: '100%',
            maxHeight: 420,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            cursor: 'zoom-in',
            display: 'block',
          }}
          title="Click to open full size"
        />
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
          📸 Click to open full size
        </div>
      </div>
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last image
  if (lastIndex < content.length) {
    parts.push(
      <div key={`text-${lastIndex}`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 4 }}>
        {content.slice(lastIndex)}
      </div>
    );
  }

  return <>{parts}</>;
}

export default function MessageBubble({ role, content, source, memories, isFailedSend, lastUserText, onRetry, onReadAloud, readAloudEnabled }) {
  return (
    <div style={wrapStyle(role)}>
      {/* Role label removed — name already shown in header */}
      <div style={bubbleStyle(role)}>
        <ContentRenderer content={content} />
        {role === 'assistant' && Array.isArray(memories) && memories.length > 0 && (
          <ul style={memoryListStyle}>
            {memories.map((m, i) => (
              <li key={i}>
                {m.type}{m.category ? ` (${m.category})` : ''}: {typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {role === 'assistant' && source && (
            <div style={sourcePillStyle(source)}>
              {source === 'ai' ? '⚡ AI' : source === 'memory' ? '🧠 Memory' : source === 'suggestions' ? '✨ Suggest' : '⚠ Fallback'}
            </div>
          )}
          {role === 'assistant' && isFailedSend && typeof onRetry === 'function' && lastUserText && (
            <button type="button" style={actionBtnStyle('#EF4444')} onClick={() => onRetry(lastUserText)}>Retry</button>
          )}
          {role === 'assistant' && readAloudEnabled && typeof onReadAloud === 'function' && content && (
            <button type="button" style={actionBtnStyle('#9CA3AF')} onClick={() => onReadAloud(content)}>🔊</button>
          )}
        </div>
      </div>
    </div>
  );
}
