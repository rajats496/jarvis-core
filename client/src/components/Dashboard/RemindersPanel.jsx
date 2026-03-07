/**
 * Reminders panel – 2-panel redesign (sidebar + card list).
 * Reminders can also be created via chat: "Remind me at 7 PM to study MongoDB"
 * Auto-refreshes every 10s and on window focus.
 */
import { useState, useEffect, useCallback } from 'react';
import * as remindersApi from '../../api/reminders.api';

/* ── palette ── */
const C = {
  bg:      'rgba(10,12,18,0.96)',
  sidebar: 'rgba(8,10,16,0.98)',
  card:    'rgba(12,15,22,0.96)',
  cardHov: 'rgba(18,22,32,0.98)',
  border:  'rgba(184,196,216,0.09)',
  borderH: 'rgba(184,196,216,0.18)',
  input:   'rgba(8,10,18,0.90)',
  accent:  '#B8C4D8',
  violet:  '#A0B0C8',
  green:   '#22C55E',
  amber:   '#B8C4D8',
  red:     '#F87171',
  text:    '#EEF2FF',
  muted:   '#8899B0',
  faint:   '#4A5568',
};


/* ── helpers ── */
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch { return dateStr; }
}

function timeUntil(dateStr) {
  try {
    const diff = new Date(dateStr) - Date.now();
    if (diff <= 0) return null;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  } catch { return null; }
}

function defaultDatetime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── ReminderCard sub-component ── */
function ReminderCard({ reminder, onDismiss }) {
  const [hov, setHov] = useState(false);
  const fired = !!reminder.triggered;
  const color = fired ? C.green : C.accent;
  const until = timeUntil(reminder.triggerAt);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.cardHov : C.card,
        border: `1px solid ${hov ? C.borderH : C.border}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.18)',
        opacity: reminder.dismissed ? 0.5 : 1,
      }}
    >
      {/* icon */}
      <div style={{
        width: 30, height: 30,
        borderRadius: 8,
        background: `${color}18`,
        border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {fired
            ? <><polyline points="20 6 9 17 4 12"/></>
            : <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>
          }
        </svg>
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13.5,
          fontWeight: 500,
          color: fired ? C.muted : C.text,
          textDecoration: fired ? 'line-through' : 'none',
          lineHeight: 1.35,
          wordBreak: 'break-word',
          marginBottom: 5,
        }}>
          {reminder.text}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* time */}
          <div style={{
            fontSize: 11,
            color: C.faint,
            fontFamily: "'DM Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {formatDate(reminder.triggerAt)}
          </div>
          {/* countdown */}
          {!fired && until && (
            <div style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: C.amber,
              fontFamily: "'DM Mono', monospace",
              background: `${C.amber}14`,
              border: `1px solid ${C.amber}30`,
              borderRadius: 999,
              padding: '1px 7px',
            }}>
              {until}
            </div>
          )}
          {/* status badge */}
          <div style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: fired ? C.green : C.violet,
            background: fired ? `${C.green}14` : `${C.accent}14`,
            border: `1px solid ${fired ? C.green : C.accent}30`,
            borderRadius: 999,
            padding: '1px 8px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {fired ? 'Fired' : 'Pending'}
          </div>
        </div>
      </div>

      {/* dismiss button */}
      <button
        onClick={() => onDismiss(reminder)}
        title="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: hov ? C.red : C.faint,
          padding: '2px 4px',
          borderRadius: 5,
          lineHeight: 1,
          flexShrink: 0,
          transition: 'color 0.15s',
          marginTop: 1,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

/* ── filters ── */
const FILTERS = [
  { key: 'all',     label: 'All',     color: '#B8C4D8' },
  { key: 'pending', label: 'Pending', color: '#B8C4D8' },
  { key: 'fired',   label: 'Fired',   color: C.green  },
];

/* ── main component ── */
export default function RemindersPanel() {
  const [reminders, setReminders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('all');
  const [hovFilt,   setHovFilt]   = useState(null);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await remindersApi.getReminders();
      setReminders(data.reminders || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load reminders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 10 * 1000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  useEffect(() => {
    const onFocus = () => fetchReminders();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchReminders]);

  const handleQuickTest = async () => {
    const triggerAt = new Date(Date.now() + 30 * 1000).toISOString();
    setAdding(true);
    setError('');
    try {
      const data = await remindersApi.createReminder('Test reminder — pipeline check 🔔', triggerAt);
      setReminders((prev) => [...prev, data.reminder].sort((a, b) => new Date(a.triggerAt) - new Date(b.triggerAt)));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not create test reminder.');
    } finally {
      setAdding(false);
    }
  };

  const handleDismiss = async (reminder) => {
    setReminders((prev) => prev.filter((r) => (r._id || r.id) !== (reminder._id || reminder.id)));
    try {
      await remindersApi.dismissReminder(reminder._id || reminder.id);
    } catch {
      setReminders((prev) => {
        const id = reminder._id || reminder.id;
        if (prev.find((r) => (r._id || r.id) === id)) return prev;
        return [...prev, reminder].sort((a, b) => new Date(a.triggerAt) - new Date(b.triggerAt));
      });
      setError('Could not dismiss reminder.');
    }
  };

  const total   = reminders.length;
  const pending = reminders.filter((r) => !r.triggered).length;
  const fired   = total - pending;

  const visible = reminders.filter((r) => {
    if (filter === 'pending') return !r.triggered;
    if (filter === 'fired')   return !!r.triggered;
    return true;
  });

  return (
    <div className="reminders-panel" style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      minHeight: 0,
      borderRadius: 10,
      overflow: 'hidden',
      border: `1px solid ${C.border}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ══ LEFT SIDEBAR ══ */}
      <div className="reminders-sidebar" style={{
        width: 210, minWidth: 210,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px',
        gap: 0,
      }}>

        {/* icon box */}
        <div style={{
          width: 38, height: 38,
          borderRadius: 10,
          background: 'rgba(184,196,216,0.08)',
          border: '1px solid rgba(184,196,216,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14, flexShrink: 0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        {/* brand */}
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: '#B8C4D8', lineHeight: 1.1, letterSpacing: '0.04em', marginBottom: 3 }}>
          Reminders
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 18 }}>
          {total} reminder{total !== 1 ? 's' : ''}
        </div>

        {/* stats block */}
        <div style={{
          background: 'rgba(184,196,216,0.05)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Status
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: C.amber }}>
                {loading ? '—' : pending}
              </div>
              <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>Pending</div>
            </div>
            <div style={{ width: 1, background: C.border, alignSelf: 'stretch', margin: '0 4px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: C.green }}>
                {loading ? '—' : fired}
              </div>
              <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>Fired</div>
            </div>
          </div>
        </div>

        {/* filter nav */}
        <div style={{ fontSize: 10, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>
          Filter
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 }}>
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            const isHov    = hovFilt === f.key;
            const count    = f.key === 'all' ? total : f.key === 'pending' ? pending : fired;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                onMouseEnter={() => setHovFilt(f.key)}
                onMouseLeave={() => setHovFilt(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: isActive ? `1px solid ${f.color}30` : '1px solid transparent',
                  borderLeft: isActive ? `2px solid ${f.color}` : '2px solid transparent',
                  background: isActive ? `${f.color}12` : isHov ? 'rgba(184,196,216,0.04)' : 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: isActive ? f.color : C.faint,
                  flexShrink: 0, transition: 'background 0.15s',
                }} />
                <span style={{
                  flex: 1, fontSize: 12.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.text : C.muted,
                }}>
                  {f.label}
                </span>
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  color: isActive ? f.color : C.faint,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* tip + test button */}
        <div style={{
          background: 'rgba(184,196,216,0.06)',
          border: '1px solid rgba(184,196,216,0.14)',
          borderRadius: 8,
          padding: '9px 11px',
          fontSize: 11,
          color: C.muted,
          lineHeight: 1.6,
          marginBottom: 10,
          flexShrink: 0,
        }}>
          <div style={{ color: '#B8C4D8', fontWeight: 600, marginBottom: 4 }}>💬 Voice / Chat commands</div>
          <div style={{ marginBottom: 2 }}>• <span style={{color:'#CBD5E1'}}>"Remind me at 7 PM to study MongoDB"</span></div>
          <div style={{ marginBottom: 2 }}>• <span style={{color:'#CBD5E1'}}>"Show my reminders"</span></div>
          <div style={{ marginBottom: 2 }}>• <span style={{color:'#CBD5E1'}}>"Remind me tomorrow at 9 AM to call X"</span></div>
          <div style={{ marginBottom: 2 }}>• <span style={{color:'#CBD5E1'}}>"Delete reminder 1"</span></div>
          <div>• <span style={{color:'#CBD5E1'}}>"Cancel all reminders"</span></div>
        </div>

        <button
          onClick={handleQuickTest}
          disabled={adding}
          style={{
            background: 'rgba(184,196,216,0.06)',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '7px 0',
            color: C.muted,
            fontSize: 11.5,
            fontWeight: 500,
            cursor: adding ? 'not-allowed' : 'pointer',
            opacity: adding ? 0.5 : 1,
            width: '100%',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { if (!adding) { e.currentTarget.style.background = 'rgba(184,196,216,0.12)'; e.currentTarget.style.color = C.text; }}}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.06)'; e.currentTarget.style.color = C.muted; }}
          title="Create a test reminder firing in 30 seconds"
        >
          🔔 Test (30s)
        </button>
      </div>

      {/* ══ RIGHT MAIN ══ */}
      <div style={{
        flex: 1,
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
      }}>

        {/* top bar (filter label + count) */}
        <div style={{
          padding: '10px 18px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: C.faint,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {filter === 'all' ? 'All Reminders' : filter === 'pending' ? 'Pending' : 'Fired'}
          </div>
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(184,196,216,0.09)',
            border: '1px solid rgba(184,196,216,0.20)',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: '#B8C4D8',
            fontFamily: "'DM Mono', monospace",
          }}>
            {visible.length}
          </div>

          {/* refresh button */}
          <button
            onClick={fetchReminders}
            disabled={loading}
            title="Refresh"
            style={{
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: C.faint,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.color = C.text; }}}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.faint; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
          </button>
        </div>

        {/* reminder list */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 18px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.faint, fontSize: 13, paddingTop: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading reminders…
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 10,
              color: C.faint,
              paddingTop: 40,
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon" style={{ opacity: 0.55 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
                {filter === 'all'
                  ? 'No reminders yet.'
                  : `No ${filter} reminders.`}
                {filter !== 'all' && (
                  <><br />
                  <span onClick={() => setFilter('all')} style={{ color: '#B8C4D8', cursor: 'pointer', fontSize: 12 }}>
                    View all
                  </span></>
                )}
              </div>
            </div>
          )}

          {!loading && visible.map((r) => (
            <ReminderCard
              key={r._id || r.id}
              reminder={r}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

