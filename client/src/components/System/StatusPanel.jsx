/**
 * Status panel - system status from GET /system/status.
 */
import { useSystemStatus } from '../../hooks/useSystemStatus';

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  overflow: 'hidden',
};
const headerStyle = {
  padding: '0.75rem 1rem',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '1rem',
  fontWeight: 600,
};
const contentStyle = { flex: 1, overflow: 'auto', padding: '1rem' };
const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.9rem',
};
const badge = (on) => ({
  padding: '0.2rem 0.5rem',
  borderRadius: 6,
  fontSize: '0.8rem',
  fontWeight: 500,
  background: on ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg)',
  color: on ? 'var(--success)' : 'var(--text-muted)',
});
const btnStyle = {
  padding: '0.35rem 0.75rem',
  fontSize: '0.85rem',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  cursor: 'pointer',
};

export default function StatusPanel() {
  const { status, loading, refresh } = useSystemStatus();

  if (loading && !status) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>Status</div>
        <div style={{ ...contentStyle, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const s = status || {};
  const load = s.backendLoad || {};
  const fb = s.fallbackState || {};

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>Status</span>
        <button type="button" style={btnStyle} onClick={() => refresh()}>
          Refresh
        </button>
      </div>
      <div style={contentStyle}>
        <div style={rowStyle}>
          <span>AI</span>
          <span style={badge(s.aiAvailability)}>{s.aiAvailability ? 'Available' : 'Unavailable'}</span>
        </div>
        <div style={rowStyle}>
          <span>Fallback</span>
          <span style={badge(fb.fallbackActive)}>{fb.fallbackActive ? 'Active' : 'Inactive'}</span>
        </div>
        <div style={rowStyle}>
          <span>Safe mode</span>
          <span style={badge(s.safeModeActive)}>{s.safeModeActive ? 'On (VM disabled)' : 'Off'}</span>
        </div>
        <div style={rowStyle}>
          <span>Memory count</span>
          <span>{s.memoryCount != null ? s.memoryCount : '—'}</span>
        </div>
        <div style={rowStyle}>
          <span>Backend load</span>
          <span>{load.activeRequests != null ? load.activeRequests + ' / ' + load.maxConcurrent + ' requests' : '—'}</span>
        </div>
        {Array.isArray(s.notifications) && s.notifications.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Notifications</div>
            {s.notifications.map((n) => (
              <div key={n.id} style={{ padding: '0.35rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {n.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
