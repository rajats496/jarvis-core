/**
 * Tab strip for Dashboard - Chat, Memory, Tasks, Goals, Reminders, Activity, Commands
 */
const wrapStyle = {
  display: 'flex',
  gap: '0.25rem',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--border)',
  overflowX: 'auto',
  flexShrink: 0,
};
const tabStyle = (active) => ({
  padding: '0.5rem 0.75rem',
  borderRadius: 6,
  border: 'none',
  background: active ? 'var(--accent)' : 'transparent',
  color: active ? '#fff' : 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: active ? 600 : 400,
  whiteSpace: 'nowrap',
});
const tabs = [
  { id: 'chat', label: 'Chat' },
  { id: 'search', label: 'Search' },
  { id: 'memory', label: 'Memory' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'goals', label: 'Goals' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'activity', label: 'Activity' },
  { id: 'commands', label: 'Commands' },
  { id: 'status', label: 'Status' },
  { id: 'settings', label: 'Settings' },
  { id: 'analytics', label: 'Analytics' },
];

export default function TabStrip({ activeTab, onTabChange }) {
  return (
    <div style={wrapStyle}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          style={tabStyle(activeTab === t.id)}
          onClick={() => onTabChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
