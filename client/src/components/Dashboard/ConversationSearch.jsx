/**
 * Conversation Search – JARVIS-themed chat history search.
 * Matches the dark glass design of all other tabs.
 */
import { useState } from 'react';
import * as conversationsApi from '../../api/conversations.api';

/* ── palette ── */
const C = {
  bg:     'rgba(10,12,18,0.96)',
  sidebar:'rgba(8,10,16,0.98)',
  card:   'rgba(12,15,22,0.96)',
  cardHov:'rgba(18,22,32,0.98)',
  border: 'rgba(184,196,216,0.09)',
  borderH:'rgba(184,196,216,0.18)',
  accent: '#B8C4D8',
  green:  '#22C55E',
  amber:  '#F59E0B',
  text:   '#EEF2FF',
  muted:  '#8899B0',
  faint:  '#4A5568',
};

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ResultCard({ msg }) {
  const isUser = msg.role === 'user';
  const color  = isUser ? C.accent : C.green;

  const sendToChat = () => {
    window.dispatchEvent(new CustomEvent('jarvis:quickchat', { detail: { text: msg.content } }));
  };

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`, borderRadius: 10,
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'border-color 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, fontFamily: "'DM Mono', monospace" }}>
            {isUser ? 'You' : 'Jarvis'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {msg.timestamp && (
            <span style={{ fontSize: 10, color: C.faint, fontFamily: "'DM Mono', monospace" }}>
              {new Date(msg.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
          {isUser && (
            <button onClick={sendToChat} title="Send to chat" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: 'rgba(184,196,216,0.08)', border: `1px solid ${C.border}`,
              color: C.muted, cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.15)'; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.color = C.muted; }}
            >
              <SendIcon /> Send
            </button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function ConversationSearch() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [inputFoc, setInputFoc] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const matches = await conversationsApi.search(query.trim(), 30);
      setResults(matches);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { setQuery(''); setResults([]); setSearched(false); };

  return (
    <div className="search-panel" style={{
      display: 'flex', flexDirection: 'row',
      height: '100%', minHeight: 0,
      borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${C.border}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ══ LEFT SIDEBAR ══ */}
      <div className="search-sidebar" style={{
        width: 210, minWidth: 210,
        background: C.sidebar, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '18px 14px', overflow: 'hidden',
      }}>

        {/* icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(184,196,216,0.08)', border: '1px solid rgba(184,196,216,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14, flexShrink: 0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: '#B8C4D8', letterSpacing: '0.04em', marginBottom: 3 }}>
          Search
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 18 }}>Search chat history</div>

        {/* stats */}
        {searched && (
          <div style={{ background: 'rgba(184,196,216,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Results</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: results.length > 0 ? C.accent : C.faint }}>{results.length}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>message{results.length !== 1 ? 's' : ''} found</div>
          </div>
        )}

        {/* tips */}
        <div style={{ background: 'rgba(184,196,216,0.06)', border: '1px solid rgba(184,196,216,0.14)', borderRadius: 8, padding: '9px 11px', fontSize: 11, color: C.muted, lineHeight: 1.7, flexShrink: 0 }}>
          <div style={{ color: '#B8C4D8', fontWeight: 600, marginBottom: 4 }}>💡 Tips</div>
          <div style={{ marginBottom: 2 }}>• Search by keyword or topic</div>
          <div style={{ marginBottom: 2 }}>• Try <span style={{ color: '#CBD5E1' }}>MongoDB</span>, <span style={{ color: '#CBD5E1' }}>Python</span></div>
          <div style={{ marginBottom: 2 }}>• Click <strong>Send</strong> to re-ask any past message</div>
          <div>• Up to 30 results shown</div>
        </div>

        <div style={{ flex: 1 }} />

        {searched && results.length > 0 && (
          <button onClick={handleClear} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '8px 0', borderRadius: 8,
            background: 'rgba(184,196,216,0.06)', border: `1px solid ${C.border}`,
            color: C.muted, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.12)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.06)'; e.currentTarget.style.color = C.muted; }}
          >
            Clear results
          </button>
        )}
      </div>

      {/* ══ RIGHT MAIN ══ */}
      <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* search bar */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(184,196,216,0.05)',
              border: `1px solid ${inputFoc ? 'rgba(184,196,216,0.28)' : C.border}`,
              borderRadius: 9, padding: '9px 12px',
              transition: 'border-color 0.15s',
            }}>
              <span style={{ color: C.faint, flexShrink: 0 }}><SearchIcon /></span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setInputFoc(true)}
                onBlur={() => setInputFoc(false)}
                placeholder="Search your chat history — try MongoDB, Python, API…"
                disabled={loading}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text,
                  padding: 0,
                }}
              />
              {query && (
                <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', padding: '0 2px', fontSize: 14, lineHeight: 1 }}>✕</button>
              )}
            </div>
            <button type="submit" disabled={loading || !query.trim()} style={{
              padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 12.5,
              background: loading || !query.trim() ? 'rgba(184,196,216,0.08)' : 'rgba(184,196,216,0.14)',
              border: `1px solid ${loading || !query.trim() ? C.border : 'rgba(184,196,216,0.30)'}`,
              color: loading || !query.trim() ? C.faint : C.text,
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>

        {/* results list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.faint, fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Searching…
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!loading && !searched && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, color: C.faint }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.6, color: C.faint }}>
                Type a keyword to search<br />your conversation history
              </div>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div style={{ fontSize: 13, color: C.faint, textAlign: 'center' }}>
                No messages found for <span style={{ color: C.accent }}>"{query}"</span><br />
                <span style={{ fontSize: 11 }}>Try a different keyword</span>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </div>
              {results.map((msg, i) => <ResultCard key={i} msg={msg} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
