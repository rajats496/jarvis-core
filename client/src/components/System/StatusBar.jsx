/**
 * Status bar - safe mode warning + rule-based notifications from GET /system/status
 */
import { useSystemStatus } from '../../hooks/useSystemStatus';

const barStyle = {
  padding: '0.4rem 1rem',
  background: 'var(--bg-elevated)',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
  fontSize: '0.85rem',
};
const safeModeStyle = {
  background: 'rgba(234, 179, 8, 0.15)',
  color: 'var(--warn)',
  padding: '0.25rem 0.5rem',
  borderRadius: 6,
  fontWeight: 500,
};
const notificationStyle = (type) => ({
  color: type === 'warning' ? 'var(--warn)' : 'var(--text-muted)',
  padding: '0.2rem 0',
});

export default function StatusBar() {
  const { status } = useSystemStatus();
  if (!status) return null;
  const notifications = status.notifications || [];
  const safeMode = status.safeModeActive === true;
  if (!safeMode && notifications.length === 0) return null;

  return (
    <div style={barStyle}>
      {safeMode && (
        <span style={safeModeStyle}>
          Safe mode: VM commands disabled (high load)
        </span>
      )}
      {notifications
        .filter((n) => n.id !== 'safe_mode' || !safeMode)
        .map((n) => (
          <span key={n.id} style={notificationStyle(n.type)}>
            {n.text}
          </span>
        ))}
    </div>
  );
}
