/**
 * Conversation Search - Search chat history by keyword
 */
import { useState } from 'react';
import * as conversationsApi from '../../api/conversations.api';

export default function ConversationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const matches = await conversationsApi.search(query.trim(), 30);
      setResults(matches);
    } catch (err) {
      setResults([]);
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Search Conversations</h2>
      <form onSubmit={handleSearch} style={formStyle}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your chat history (e.g., MongoDB, Python, API design)"
          style={inputStyle}
          disabled={loading}
        />
        <button type="submit" style={buttonStyle} disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searched && !loading && (
        <div style={resultsStyle}>
          {results.length === 0 ? (
            <div style={emptyStyle}>
              No messages found matching "{query}". Try a different keyword.
            </div>
          ) : (
            <>
              <div style={countStyle}>Found {results.length} message(s)</div>
              {results.map((msg, i) => (
                <div key={i} style={messageStyle(msg.role)}>
                  <div style={roleStyle}>{msg.role === 'user' ? 'You' : 'Jarvis'}</div>
                  <div style={contentStyle}>{msg.content}</div>
                  {msg.timestamp && (
                    <div style={timeStyle}>{new Date(msg.timestamp).toLocaleString()}</div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  padding: '1rem',
};

const titleStyle = {
  fontSize: '1.2rem',
  fontWeight: 700,
  marginBottom: '1rem',
  color: 'var(--text)',
};

const formStyle = {
  display: 'flex',
  gap: '0.75rem',
  marginBottom: '1.5rem',
};

const inputStyle = {
  flex: 1,
  padding: '0.65rem 1rem',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '0.95rem',
};

const buttonStyle = {
  padding: '0.65rem 1.5rem',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.95rem',
};

const resultsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const emptyStyle = {
  padding: '2rem 1rem',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: '0.95rem',
};

const countStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  fontWeight: 600,
  marginBottom: '0.5rem',
};

const messageStyle = (role) => ({
  padding: '0.75rem 1rem',
  background: role === 'user' ? 'var(--bg)' : 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderLeft: `3px solid ${role === 'user' ? 'var(--accent)' : 'var(--success)'}`,
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

const roleStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.5px',
};

const contentStyle = {
  fontSize: '0.9rem',
  color: 'var(--text)',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const timeStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};
