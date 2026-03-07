/**
 * Goals panel – 2-panel redesign (sidebar + card grid).
 */
import { useState, useEffect, useCallback } from 'react';
import * as goalsApi from '../../api/goals.api';

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
  pink:    '#B8C4D8',
  text:    '#EEF2FF',
  muted:   '#8899B0',
  faint:   '#4A5568',
};

/* ── helpers ── */
function pctOf(g) {
  return g.daysTotal ? Math.min(100, Math.round((g.daysDone / g.daysTotal) * 100)) : 0;
}

function accentFor(pct) {
  if (pct >= 100) return C.green;
  if (pct >= 60)  return C.violet;
  if (pct >= 25)  return C.accent;
  return C.amber;
}

/* ── GoalCard sub-component ── */
function GoalCard({ goal, flashing, flashAction, onDelete }) {
  const [hov, setHov] = useState(false);
  const [delHov, setDelHov] = useState(false);
  const pct = pctOf(goal);
  const color = accentFor(pct);
  const done = pct >= 100;

  const flashGlow = flashing
    ? (flashAction === 'delete'   ? '0 0 0 1.5px #F87171, 0 0 12px rgba(248,113,113,0.3)'
      : flashAction === 'complete' ? '0 0 0 1.5px #22C55E, 0 0 12px rgba(34,197,94,0.3)'
      : flashAction === 'progress' ? '0 0 0 1.5px #B8C4D8, 0 0 12px rgba(184,196,216,0.22)'
      : '0 0 0 1.5px #B8C4D8, 0 0 12px rgba(184,196,216,0.22)')
    : undefined;

  const cardStyle = {
    background: hov ? C.cardHov : C.card,
    border: `1px solid ${hov ? C.borderH : C.border}`,
    borderTop: `2px solid ${color}`,
    borderRadius: 10,
    padding: '14px 16px',
    position: 'relative',
    transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
    boxShadow: flashGlow || (hov ? '0 4px 18px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.2)'),
    cursor: 'default',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Flash badge */}
      {flashing && flashAction && (
        <div style={{
          position: 'absolute', top: 7, right: 36,
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em',
          borderRadius: 999, padding: '2px 8px',
          background: flashAction === 'delete'   ? 'rgba(248,113,113,0.15)'
                    : flashAction === 'complete'  ? 'rgba(34,197,94,0.15)'
                    : 'rgba(184,196,216,0.12)',
          color: flashAction === 'delete'   ? '#F87171'
               : flashAction === 'complete'  ? '#22C55E'
               : '#B8C4D8',
          border: `1px solid ${flashAction === 'delete' ? '#F87171' : flashAction === 'complete' ? '#22C55E' : '#B8C4D8'}`,
          fontFamily: "'DM Sans', sans-serif",
          pointerEvents: 'none',
        }}>
          {flashAction === 'delete' ? '✓ Deleted' : flashAction === 'complete' ? '🎉 Achieved' : '✓ Updated'}
        </div>
      )}

      {/* Delete button — hover reveal */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
          onMouseEnter={() => setDelHov(true)}
          onMouseLeave={() => setDelHov(false)}
          title="Delete goal"
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 22, height: 22, borderRadius: 5,
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: delHov ? 'rgba(239,68,68,0.12)' : hov ? 'rgba(184,196,216,0.05)' : 'transparent',
            color: delHov ? '#F87171' : '#4A5568',
            opacity: hov ? 1 : 0,
            transition: 'all 0.15s',
            pointerEvents: hov ? 'auto' : 'none',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      )}
      {/* title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 13.5,
          color: done ? C.green : C.text,
          lineHeight: 1.35,
          flex: 1,
          textDecoration: done ? 'line-through' : 'none',
          opacity: done ? 0.75 : 1,
        }}>
          {goal.title}
        </div>
        {/* pct badge */}
        <div style={{
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: 999,
          padding: '2px 9px',
          fontSize: 11,
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          fontFamily: "'DM Mono', monospace",
        }}>
          {pct}%
        </div>
      </div>

      {/* day counter */}
      <div style={{
        fontSize: 11.5,
        color: C.muted,
        marginBottom: 9,
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontFamily: "'DM Mono', monospace", color: done ? C.green : C.muted }}>
          {goal.daysDone ?? 0}
        </span>
        <span style={{ color: C.faint }}>/</span>
        <span style={{ fontFamily: "'DM Mono', monospace" }}>{goal.daysTotal ?? 0}</span>
        <span style={{ color: C.faint, marginLeft: 1 }}>days</span>
      </div>

      {/* progress bar */}
      <div style={{
        height: 5,
        background: 'rgba(184,196,216,0.08)',
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: done
            ? `linear-gradient(90deg, #16A34A, ${C.green})`
            : `linear-gradient(90deg, #B8C4D8, #EEF2FF)`,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      {done && (
        <div style={{
          marginTop: 9,
          fontSize: 11,
          color: C.green,
          fontWeight: 600,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Goal achieved
        </div>
      )}
    </div>
  );
}

/* ── filters ── */
const FILTERS = [
  { key: 'all',        label: 'All Goals',   color: '#B8C4D8' },
  { key: 'active',     label: 'In Progress', color: '#B8C4D8' },
  { key: 'completed',  label: 'Achieved',    color: C.green  },
];

/* ── main component ── */
export default function GoalsPanel() {
  const [goals,       setGoals]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [hovFilt,     setHovFilt]     = useState(null);
  const [flashId,     setFlashId]     = useState(null);
  const [flashAction, setFlashAction] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      const data = await goalsApi.getGoals();
      setGoals(data.goals || []);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // jarvis:goal-changed — fired by ChatWindow after any goal mutation
  useEffect(() => {
    const handler = (e) => {
      const { action, id } = e.detail || {};
      fetchGoals();
      if (id) {
        setFlashId(id);
        setFlashAction(action);
        setTimeout(() => { setFlashId(null); setFlashAction(null); }, 2400);
      }
    };
    window.addEventListener('jarvis:goal-changed', handler);
    return () => window.removeEventListener('jarvis:goal-changed', handler);
  }, [fetchGoals]);

  // jarvis:goal-filter — switches the sidebar filter tab
  useEffect(() => {
    const handler = (e) => {
      const f = e.detail?.filter;
      if (f) setFilter(f);
    };
    window.addEventListener('jarvis:goal-filter', handler);
    return () => window.removeEventListener('jarvis:goal-filter', handler);
  }, []);

  const handleDelete = async (goal) => {
    const id = String(goal._id || goal.id);
    setGoals(prev => prev.filter(g => String(g._id || g.id) !== id));
    try { await goalsApi.deleteGoal(id); }
    catch { fetchGoals(); }
  };

  /* stats */
  const total     = goals.length;
  const achieved  = goals.filter(g => pctOf(g) >= 100).length;
  const active    = total - achieved;
  const avgPct    = total ? Math.round(goals.reduce((s, g) => s + pctOf(g), 0) / total) : 0;

  /* filtered list */
  const visible = goals.filter(g => {
    const p = pctOf(g);
    if (filter === 'completed') return p >= 100;
    if (filter === 'active')    return p < 100;
    return true;
  });

  /* ── sidebar ── */
  const sidebarStyle = {
    width: 210,
    minWidth: 210,
    background: C.sidebar,
    borderRight: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 14px',
    gap: 0,
  };
  const mainStyle = {
    flex: 1,
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  };

  return (
    <div className="goals-panel" style={{
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
      <div className="goals-sidebar" style={sidebarStyle}>

        {/* icon box */}
        <div style={{
          width: 38, height: 38,
          borderRadius: 10,
          background: 'rgba(184,196,216,0.08)',
          border: '1px solid rgba(184,196,216,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>

        {/* brand */}
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: '#B8C4D8', lineHeight: 1.1, letterSpacing: '0.04em', marginBottom: 3 }}>
          Goals
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 18, fontFamily: "'DM Mono', monospace" }}>
          {total} goal{total !== 1 ? 's' : ''} tracked
        </div>

        {/* overall progress ring-ish */}
        <div style={{
          background: 'rgba(184,196,216,0.05)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
            Avg. Completion
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: accentFor(avgPct) }}>
              {loading ? '—' : `${avgPct}`}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(184,196,216,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${avgPct}%`,
              height: '100%',
              borderRadius: 999,
              background: avgPct >= 100
                ? `linear-gradient(90deg, #16A34A, ${C.green})`
                : `linear-gradient(90deg, #B8C4D8, #EEF2FF)`,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: C.green }}>{achieved}</div>
              <div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>Achieved</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: C.amber }}>{active}</div>
              <div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>Active</div>
            </div>
          </div>
        </div>

        {/* filter nav */}
        <div style={{ fontSize: 10, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>
          Filter
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            const isHov    = hovFilt === f.key;
            const count    = f.key === 'all' ? total : f.key === 'completed' ? achieved : active;
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
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: isActive ? f.color : C.faint,
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }} />
                <span style={{
                  flex: 1,
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.text : C.muted,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {f.label}
                </span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: isActive ? f.color : C.faint,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* spacer */}
        <div style={{ flex: 1 }} />

        {/* hint */}
        <div style={{
          background: 'rgba(184,196,216,0.06)',
          border: '1px solid rgba(184,196,216,0.14)',
          borderRadius: 8,
          padding: '9px 11px',
          fontSize: 11,
          color: C.muted,
          lineHeight: 1.6,
        }}>
          <div style={{ color: '#B8C4D8', fontWeight: 600, marginBottom: 3 }}>Voice / Chat commands</div>
          <div>• <span style={{color:'#CBD5E1'}}>“My goal is to learn X in 30 days”</span></div>
          <div>• <span style={{color:'#CBD5E1'}}>“Show my goals”</span></div>
          <div>• <span style={{color:'#CBD5E1'}}>“Mark goal 1 achieved”</span></div>
          <div>• <span style={{color:'#CBD5E1'}}>“Log 5 days for goal 2”</span></div>
          <div>• <span style={{color:'#CBD5E1'}}>“Delete goal 2”</span></div>
        </div>
      </div>

      {/* ══ RIGHT MAIN ══ */}
      <div style={mainStyle}>

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
            fontSize: 12,
            color: '#B8C4D8',
            letterSpacing: '0.04em',
          }}>
            {filter === 'all' ? 'All Goals' : filter === 'completed' ? 'Achieved Goals' : 'In Progress'}
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

        {/* card grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 18px',
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: C.faint,
              fontSize: 13,
              gap: 8,
              fontFamily: "'DM Mono', monospace",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading goals…
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon" style={{ opacity: 0.55 }}>
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
              <div style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
                {filter === 'all' ? 'No goals yet.' : `No ${filter === 'completed' ? 'achieved' : 'active'} goals.`}
                {filter !== 'all' && (
                  <><br /><span
                    onClick={() => setFilter('all')}
                    style={{ color: C.accent, cursor: 'pointer', fontSize: 12 }}
                  >View all goals</span></>
                )}
              </div>
            </div>
          )}

          {!loading && visible.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              alignItems: 'start',
            }}>
              {visible.map(g => {
                const id = String(g._id || g.id);
                return (
                  <GoalCard
                    key={id}
                    goal={g}
                    flashing={id === String(flashId)}
                    flashAction={flashAction}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
