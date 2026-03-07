/**
 * Activity timeline – 2-panel redesign (sidebar + vertical timeline).
 */
import { useState, useEffect } from 'react';
import * as activityApi from '../../api/activity.api';

/* ── palette ── */
const C = {
  bg:      'rgba(10,12,18,0.96)',
  sidebar: 'rgba(8,10,16,0.98)',
  card:    'rgba(12,15,22,0.96)',
  cardHov: 'rgba(18,22,32,0.98)',
  border:  'rgba(184,196,216,0.09)',
  borderH: 'rgba(184,196,216,0.18)',
  accent:  '#B8C4D8',
  violet:  '#A0B0C8',
  green:   '#22C55E',
  amber:   '#B8C4D8',
  red:     '#F87171',
  pink:    '#EC4899',
  cyan:    '#22D3EE',
  orange:  '#F97316',
  text:    '#EEF2FF',
  muted:   '#8899B0',
  faint:   '#4A5568',
};

/* ── kind config (label, color, SVG icon path) ── */
const KIND = {
  login:               { label: 'Login',              color: C.cyan,   group: 'system'   },
  memory_save:         { label: 'Memory saved',        color: C.violet, group: 'memory'   },
  memory_delete:       { label: 'Memory deleted',      color: C.red,    group: 'memory'   },
  task_add:            { label: 'Task added',           color: C.accent, group: 'tasks'    },
  task_done:           { label: 'Task completed',       color: C.green,  group: 'tasks'    },
  reminder_set:        { label: 'Reminder set',         color: C.amber,  group: 'reminders'},
  reminder_triggered:  { label: 'Reminder triggered',   color: C.orange, group: 'reminders'},
  fallback:            { label: 'Fallback used',        color: C.faint,  group: 'system'   },
  vm_command:          { label: 'VM command',           color: C.pink,   group: 'system'   },
};

const GROUPS = [
  { key: 'all',       label: 'All',       color: C.accent  },
  { key: 'tasks',     label: 'Tasks',     color: C.accent  },
  { key: 'memory',    label: 'Memory',    color: C.violet  },
  { key: 'reminders', label: 'Reminders', color: C.amber   },
  { key: 'system',    label: 'System',    color: C.cyan    },
];

function kindInfo(kind) {
  return KIND[kind] || { label: kind, color: C.faint, group: 'system' };
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch { return dateStr; }
}

function timeAgo(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ''; }
}

/* ── KindIcon: small SVG per event type ── */
function KindIcon({ kind, color, size = 12 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const sp = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'login')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
  if (kind === 'memory_save')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>;
  if (kind === 'memory_delete')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
  if (kind === 'task_add')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="12" y1="9" x2="12" y2="17"/><line x1="8" y1="13" x2="16" y2="13"/></svg>;
  if (kind === 'task_done')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><polyline points="20 6 9 17 4 12"/></svg>;
  if (kind === 'reminder_set')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
  if (kind === 'reminder_triggered')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><line x1="12" y1="2" x2="12" y2="4"/></svg>;
  if (kind === 'vm_command')
    return <svg viewBox="0 0 24 24" style={s} {...sp}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
  /* fallback / default */
  return <svg viewBox="0 0 24 24" style={s} {...sp}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>;
}

/* ── ActivityRow sub-component ── */
function ActivityRow({ item, isLast }) {
  const [hov, setHov] = useState(false);
  const info = kindInfo(item.kind);
  const meta = item.meta && (item.meta.title || item.meta.value || item.meta.text);

  return (
    <div
      style={{ display: 'flex', gap: 0, position: 'relative' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* timeline track */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
        {/* dot */}
        <div style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: hov ? `${info.color}28` : `${info.color}15`,
          border: `1.5px solid ${hov ? info.color : info.color + '55'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, zIndex: 1,
          transition: 'background 0.15s, border-color 0.15s',
          boxShadow: hov ? `0 0 10px ${info.color}40` : 'none',
        }}>
          <KindIcon kind={item.kind} color={info.color} size={11} />
        </div>
        {/* connector line */}
        {!isLast && (
          <div style={{
            flex: 1,
            width: 1.5,
            background: `linear-gradient(to bottom, ${info.color}35, rgba(184,196,216,0.04))`,
            minHeight: 12,
          }} />
        )}
      </div>

      {/* content card */}
      <div style={{
        flex: 1,
        background: hov ? C.cardHov : C.card,
        border: `1px solid ${hov ? C.borderH : C.border}`,
        borderRadius: 9,
        padding: '9px 13px',
        marginLeft: 8,
        marginBottom: isLast ? 0 : 8,
        transition: 'background 0.15s, border-color 0.15s',
        minWidth: 0,
      }}>
        {/* top row: label + time-ago */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: meta ? 5 : 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#B8C4D8',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {info.label}
            </span>
          </div>
          <span style={{
            fontSize: 10.5,
            color: C.faint,
            fontFamily: "'DM Mono', monospace",
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {timeAgo(item.createdAt)}
          </span>
        </div>

        {/* meta text */}
        {meta && (
          <div style={{
            fontSize: 12,
            color: C.muted,
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.35,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: 5,
          }}>
            {meta}
          </div>
        )}

        {/* full timestamp */}
        <div style={{
          fontSize: 10.5,
          color: C.faint,
          fontFamily: "'DM Mono', monospace",
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatDate(item.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ── main component ── */
export default function ActivityTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [hovFilt,  setHovFilt]  = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await activityApi.getTimeline(50);
        if (!cancelled) setTimeline(data.timeline || []);
      } catch {
        if (!cancelled) setTimeline([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const total   = timeline.length;
  const visible = timeline.filter(a =>
    filter === 'all' ? true : kindInfo(a.kind).group === filter
  );

  /* group counts for sidebar badges */
  const counts = {};
  GROUPS.forEach(g => {
    counts[g.key] = g.key === 'all'
      ? total
      : timeline.filter(a => kindInfo(a.kind).group === g.key).length;
  });

  return (
    <div className="activity-panel" style={{
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
      <div className="activity-sidebar" style={{
        width: 210, minWidth: 210,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 14px',
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>

        {/* brand */}
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: '#B8C4D8', lineHeight: 1.1, letterSpacing: '0.04em', marginBottom: 3 }}>
          Activity
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 18 }}>
          {total} event{total !== 1 ? 's' : ''} recorded
        </div>

        {/* recent event count strip */}
        <div style={{
          background: 'rgba(184,196,216,0.05)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Breakdown
          </div>
          {GROUPS.filter(g => g.key !== 'all').map(g => {
            const c = counts[g.key] || 0;
            const pct = total ? Math.round((c / total) * 100) : 0;
            return (
              <div key={g.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{g.label}</span>
                  <span style={{ fontSize: 10.5, fontFamily: "'DM Mono', monospace", color: g.color, fontWeight: 600 }}>{c}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(184,196,216,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: g.color, borderRadius: 999, opacity: 0.7 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* filter nav */}
        <div style={{ fontSize: 10, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>
          Filter
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {GROUPS.map(g => {
            const isActive = filter === g.key;
            const isHov    = hovFilt === g.key;
            return (
              <button
                key={g.key}
                onClick={() => setFilter(g.key)}
                onMouseEnter={() => setHovFilt(g.key)}
                onMouseLeave={() => setHovFilt(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: isActive ? `1px solid ${g.color}30` : '1px solid transparent',
                  borderLeft: isActive ? `2px solid ${g.color}` : '2px solid transparent',
                  background: isActive ? `${g.color}12` : isHov ? 'rgba(184,196,216,0.04)' : 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: isActive ? g.color : C.faint,
                  flexShrink: 0, transition: 'background 0.15s',
                }} />
                <span style={{
                  flex: 1, fontSize: 12.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.text : C.muted,
                }}>
                  {g.label}
                </span>
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  color: isActive ? g.color : C.faint,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {counts[g.key]}
                </span>
              </button>
            );
          })}
        </div>
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

        {/* top bar */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: '#B8C4D8',
            letterSpacing: '0.06em',
          }}>
            {GROUPS.find(g => g.key === filter)?.label ?? 'All'} Events
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
            {visible.length} / {total}
          </div>
        </div>

        {/* timeline list */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 18px 18px',
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.faint, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading activity…
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60%',
              gap: 10,
              color: C.faint,
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <div style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
                {filter === 'all' ? 'No activity yet.' : `No ${filter} events.`}
                {filter !== 'all' && (
                  <><br /><span onClick={() => setFilter('all')} style={{ color: C.accent, cursor: 'pointer', fontSize: 12 }}>View all</span></>
                )}
              </div>
            </div>
          )}

          {!loading && visible.length > 0 && visible.map((a, i) => (
            <ActivityRow
              key={a.id ?? i}
              item={a}
              isLast={i === visible.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
