/**
 * Command history - last VM commands from API. "Show last 5 VM commands" in chat.
 */
import { useState, useEffect } from 'react';
import * as commandsApi from '../../api/commands.api';

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  overflow: 'hidden',
};
const headerStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '1rem', fontWeight: 600 };
const listStyle = { flex: 1, overflow: 'auto', padding: '0.5rem' };
const itemStyle = (success) => ({
  padding: '0.5rem 0.75rem',
  borderRadius: 6,
  marginBottom: '0.35rem',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderLeft: `3px solid ${success ? 'var(--success)' : 'var(--danger)'}`,
  fontSize: '0.85rem',
});
const metaStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' };

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return dateStr;
  }
}

export default function CommandHistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await commandsApi.getCommandHistory(20);
        if (!cancelled) setHistory(data.history || []);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>Command history</div>
      <div style={listStyle}>
        {loading && <div style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Loading...</div>}
        {!loading && history.length === 0 && (
          <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No VM commands recorded yet. Say &quot;Show last 5 VM commands&quot; in chat.
          </div>
        )}
        {!loading && history.map((h, i) => (
          <div key={i} style={itemStyle(h.success)}>
            <div style={{ fontFamily: 'monospace' }}>{h.command}</div>
            <div style={metaStyle}>{h.success ? 'OK' : 'Failed'} · {formatDate(h.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
