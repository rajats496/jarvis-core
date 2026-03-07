/**
 * Tasks panel — 2-column layout.
 * Left: sidebar with stats, progress bar, filter nav.
 * Right: add-task bar + task list split by Pending / Done.
 */
import { useState, useEffect, useCallback } from 'react';
import * as tasksApi from '../../api/tasks.api';

/* ─────────────── palette ─────────────── */
const C = {
  bg:       'rgba(10,12,18,0.96)',
  sidebar:  'rgba(8,10,16,0.98)',
  card:     'rgba(12,15,22,0.96)',
  cardHov:  'rgba(18,22,32,0.98)',
  border:   'rgba(184,196,216,0.09)',
  borderHov:'rgba(184,196,216,0.16)',
  text:     '#EEF2FF',
  muted:    '#8899B0',
  faint:    '#4A5568',
  accent:   '#B8C4D8',
  accentLo: 'rgba(184,196,216,0.07)',
  accentBd: 'rgba(184,196,216,0.20)',
  green:    '#22C55E',
  greenLo:  'rgba(34,197,94,0.1)',
  red:      '#F87171',
  redLo:    'rgba(239,68,68,0.1)',
};

/* ─────────────── layout ─────────────── */
const panelStyle = {
  display: 'flex', flexDirection: 'row',
  height: '100%', minHeight: 0,
  borderRadius: 14,
  border: `1px solid ${C.border}`,
  overflow: 'hidden',
};

/* ── sidebar ── */
const sidebarStyle = {
  width: 210, flexShrink: 0,
  display: 'flex', flexDirection: 'column',
  background: C.sidebar,
  borderRight: `1px solid ${C.border}`,
};
const sbHeadStyle = {
  padding: '18px 16px 14px',
  borderBottom: `1px solid ${C.border}`,
  flexShrink: 0,
};
const sbIconBoxStyle = {
  width: 34, height: 34, borderRadius: 9,
  background: C.accentLo, border: `1px solid ${C.accentBd}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: 10,
};
const sbTitleStyle = {
  fontFamily: "'Orbitron', sans-serif",
  fontSize: 13, fontWeight: 700, color: '#B8C4D8', letterSpacing: '0.04em',
};
const sbSubStyle = {
  fontSize: 11, color: C.faint, marginTop: 2,
  fontFamily: "'DM Mono', monospace",
};

/* progress block */
const progressWrapStyle = {
  padding: '14px 16px',
  borderBottom: `1px solid ${C.border}`,
  flexShrink: 0,
};
const progLabelRowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  marginBottom: 7,
};
const progTrackStyle = {
  height: 5, borderRadius: 999,
  background: 'rgba(184,196,216,0.08)',
  overflow: 'hidden',
};

/* stat rows */
const statAreaStyle = {
  padding: '10px 8px 6px',
  flexShrink: 0,
};
const sectionLabelStyle = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: '#4A5568',
  padding: '4px 8px 6px',
  fontFamily: "'DM Mono', monospace",
};

function statRowStyle(active) {
  return {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', borderRadius: 8,
    background: active ? C.accentLo : 'transparent',
    borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
    border: 'none', outline: 'none', width: '100%', textAlign: 'left',
    cursor: 'pointer', transition: 'background 0.13s',
    fontFamily: "'DM Sans', sans-serif",
  };
}

/* ── main area ── */
const mainStyle = {
  flex: 1, minWidth: 0,
  display: 'flex', flexDirection: 'column',
  background: C.bg,
};

/* task list area */
const listAreaStyle = {
  flex: 1, overflowY: 'auto',
  padding: '12px 14px',
};
const groupLabelStyle = {
  display: 'flex', alignItems: 'center', gap: 7,
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', color: C.faint,
  fontFamily: "'DM Sans', sans-serif",
  padding: '2px 2px 7px',
  marginTop: 4,
};

/* task card */
function taskCardStyle(done, hovered) {
  return {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px',
    borderRadius: 9, marginBottom: 6,
    background: hovered ? C.cardHov : C.card,
    border: `1px solid ${hovered ? C.borderHov : C.border}`,
    transition: 'background 0.13s, border-color 0.13s',
    opacity: done ? 0.65 : 1,
    cursor: 'default',
  };
}

/* custom circular checkbox */
function checkCircleStyle(done) {
  return {
    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
    border: done ? 'none' : `1.5px solid rgba(255,255,255,0.2)`,
    background: done ? C.green : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s',
    boxShadow: done ? `0 0 8px ${C.green}55` : 'none',
  };
}

const taskTitleStyle = (done) => ({
  flex: 1, fontSize: 13.5, lineHeight: 1.5,
  color: done ? C.faint : C.text,
  textDecoration: done ? 'line-through' : 'none',
  wordBreak: 'break-word',
  fontFamily: "'DM Sans', sans-serif",
  textDecorationColor: C.faint,
  transition: 'color 0.15s',
});

function deleteBtnStyle(visible) {
  return {
    opacity: visible ? 1 : 0, flexShrink: 0,
    width: 24, height: 24, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none',
    color: C.faint, cursor: 'pointer',
    transition: 'opacity 0.13s, background 0.13s, color 0.13s',
    pointerEvents: visible ? 'auto' : 'none',
    marginTop: 1,
  };
}

const FILTERS = ['all', 'pending', 'done'];

export default function TasksPanel() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all');
  const [hoveredId, setHoveredId] = useState(null);
  const [hovFilt, setHovFilt] = useState('');
  const [flashId, setFlashId]         = useState(null);
  const [flashAction, setFlashAction] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await tasksApi.getTasks();
      setTasks(data.tasks || []);
    } catch { /* keep stale */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => {
    const onFocus = () => fetchTasks();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchTasks]);

  // Listen for task changes dispatched by ChatWindow (add / done / delete)
  useEffect(() => {
    const handler = (e) => {
      const { action, id } = e.detail || {};
      fetchTasks();
      if (id) {
        setFlashId(id);
        setFlashAction(action);
        setTimeout(() => { setFlashId(null); setFlashAction(null); }, 2200);
      }
    };
    window.addEventListener('jarvis:task-changed', handler);
    return () => window.removeEventListener('jarvis:task-changed', handler);
  }, [fetchTasks]);

  // Listen for filter requests from chat (e.g. "What's pending?" → switch to pending tab)
  useEffect(() => {
    const handler = (e) => {
      const f = e.detail?.filter;
      if (f) setFilter(f);
    };
    window.addEventListener('jarvis:task-filter', handler);
    return () => window.removeEventListener('jarvis:task-filter', handler);
  }, []);

  const handleToggleDone = async (task) => {
    const newDone = !task.done;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: newDone } : t));
    try { await tasksApi.markTaskDone(task.id, newDone); }
    catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: task.done } : t));
      setError('Could not update task.');
    }
  };

  const handleDelete = async (task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try { await tasksApi.deleteTask(task.id); }
    catch {
      setTasks((prev) => prev.find((t) => t.id === task.id) ? prev : [task, ...prev]);
      setError('Could not delete task.');
    }
  };

  const pending   = tasks.filter((t) => !t.done);
  const done      = tasks.filter((t) => t.done);
  const total     = tasks.length;
  const pct       = total === 0 ? 0 : Math.round((done.length / total) * 100);

  const visible = filter === 'pending' ? pending
                : filter === 'done'    ? done
                : tasks;

  const visiblePending = visible.filter((t) => !t.done);
  const visibleDone    = visible.filter((t) => t.done);

  return (
    <div style={panelStyle}>

      {/* ══ LEFT SIDEBAR ══ */}
      <div style={sidebarStyle}>

        {/* Brand */}
        <div style={sbHeadStyle}>
          <div style={sbIconBoxStyle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div style={sbTitleStyle}>Tasks</div>
          <div style={sbSubStyle}>
            {loading ? 'Loading…' : `${total} total task${total !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Progress */}
        <div style={progressWrapStyle}>
          <div style={progLabelRowStyle}>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
              Progress
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? C.green : '#B8C4D8', fontFamily: "'DM Mono', monospace" }}>
              {pct}%
            </span>
          </div>
          <div style={progTrackStyle}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 999,
              background: pct === 100
                ? `linear-gradient(90deg, ${C.green}, #4ADE80)`
                : `linear-gradient(90deg, #B8C4D8, #EEF2FF)`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          {pct === 100 && total > 0 && (
            <div style={{ marginTop: 7, fontSize: 11, color: C.green, fontFamily: "'DM Sans', sans-serif" }}>
              ✓ All tasks complete!
            </div>
          )}
        </div>

        {/* Stats + filter */}
        <div style={statAreaStyle}>
          <div style={sectionLabelStyle}>Filter</div>
          {[
            { key: 'all',     label: 'All tasks',   count: total,         dot: '#B8C4D8' },
            { key: 'pending', label: 'Pending',      count: pending.length, dot: '#B8C4D8' },
            { key: 'done',    label: 'Completed',    count: done.length,   dot: C.green },
          ].map(({ key, label, count, dot }) => {
            const active = filter === key;
            const isHov  = hovFilt === key && !active;
            return (
              <button
                key={key}
                type="button"
                style={{
                  ...statRowStyle(active),
                  background: active ? C.accentLo : isHov ? 'rgba(184,196,216,0.04)' : 'transparent',
                }}
                onClick={() => setFilter(key)}
                onMouseEnter={() => setHovFilt(key)}
                onMouseLeave={() => setHovFilt('')}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: active ? 2 : '50%', flexShrink: 0,
                  background: active ? C.accent : dot,
                  boxShadow: active ? `0 0 6px ${C.accent}` : 'none',
                  transition: 'all 0.13s',
                }} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.text : C.muted, transition: 'color 0.13s', flex: 1 }}>
                  {label}
                </span>
                <span style={{
                  background: active ? 'rgba(184,196,216,0.18)' : 'rgba(184,196,216,0.06)',
                  color: active ? C.accent : '#4A5568',
                  borderRadius: 999, padding: '1px 8px',
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ══ RIGHT MAIN ══ */}
      <div style={mainStyle}>

        {/* Task list */}
        <div style={listAreaStyle}>

          {/* ── How to use hint ── */}
          <div style={{
            marginBottom: 14,
            background: 'rgba(184,196,216,0.04)',
            border: '1px solid rgba(184,196,216,0.10)',
            borderRadius: 10,
            padding: '10px 13px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
                textTransform: 'uppercase', color: '#B8C4D8',
                fontFamily: "'DM Mono', monospace",
              }}>How to use</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { cmd: '"Add task: Buy groceries"',         desc: 'create a task' },
                { cmd: '"Mark task done: Buy groceries"',   desc: 'complete a task' },
                { cmd: '"Delete task: Buy groceries"',      desc: 'remove a task' },
                { cmd: '"What\'s pending?"',                desc: 'see pending tasks' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 11,
                    color: '#B8C4D8', background: 'rgba(184,196,216,0.09)',
                    border: '1px solid rgba(184,196,216,0.14)',
                    borderRadius: 5, padding: '1px 7px',
                    whiteSpace: 'nowrap',
                  }}>{cmd}</span>
                  <span style={{
                    fontSize: 11, color: '#4A5568',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>in chat to {desc}</span>
                </div>
              ))}
            </div>
          </div>

          {loading && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{
                width: 28, height: 28, margin: '0 auto 10px',
              border: '2px solid rgba(184,196,216,0.12)',
                borderTop: `2px solid ${C.accent}`,
                borderRadius: '50%',
                animation: 'tskSpin 0.8s linear infinite',
              }} />
              <style>{`@keyframes tskSpin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 13, color: '#4A5568', fontFamily: "'DM Mono', monospace" }}>Loading tasks…</div>
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div style={{
              padding: '36px 20px', textAlign: 'center',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}>
              <div className="empty-state-icon" style={{ fontSize: 26, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 14, color: C.text, fontFamily: "'DM Sans', sans-serif", marginBottom: 7 }}>
                No tasks yet
              </div>
              <div style={{
              display: 'inline-block', fontSize: 12, color: '#6E7A90',
                background: C.accentLo, border: `1px solid ${C.accentBd}`,
                borderRadius: 8, padding: '6px 14px',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Say <span style={{ color: '#B8C4D8' }}>&quot;Add task: …&quot;</span> in chat to create tasks
              </div>
            </div>
          )}

          {/* Pending group */}
          {!loading && visiblePending.length > 0 && (
            <>
              <div style={groupLabelStyle}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#B8C4D8', display: 'inline-block',
                  boxShadow: '0 0 5px rgba(184,196,216,0.5)',
                }} />
                Pending
                <span style={{
                  background: 'rgba(184,196,216,0.10)', color: '#B8C4D8',
                  borderRadius: 999, padding: '0 7px',
                  fontSize: 10.5, fontWeight: 700,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {visiblePending.length}
                </span>
              </div>
              {visiblePending.map((t) => (
                <TaskRow key={t.id} task={t}
                  hovered={hoveredId === t.id}
                  flashing={t.id === flashId || String(t.id) === String(flashId)}
                  flashAction={flashAction}
                  onMouseEnter={() => setHoveredId(t.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onToggle={handleToggleDone}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}

          {/* Done group */}
          {!loading && visibleDone.length > 0 && (
            <>
              <div style={{ ...groupLabelStyle, marginTop: visiblePending.length > 0 ? 14 : 4 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: C.green, display: 'inline-block',
                  boxShadow: `0 0 5px ${C.green}`,
                }} />
                Completed
                <span style={{
                  background: 'rgba(34,197,94,0.1)', color: C.green,
                  borderRadius: 999, padding: '0 7px',
                  fontSize: 10.5, fontWeight: 700,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {visibleDone.length}
                </span>
              </div>
              {visibleDone.map((t) => (
                <TaskRow key={t.id} task={t}
                  hovered={hoveredId === t.id}
                  flashing={t.id === flashId || String(t.id) === String(flashId)}
                  flashAction={flashAction}
                  onMouseEnter={() => setHoveredId(t.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onToggle={handleToggleDone}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Task row sub-component ── */
function TaskRow({ task, hovered, flashing, flashAction, onMouseEnter, onMouseLeave, onToggle, onDelete }) {
  const [checkHov, setCheckHov] = useState(false);
  const C_green = '#22C55E';
  const C_red   = '#F87171';

  const flashBorder = flashing
    ? (flashAction === 'done' ? `0 0 0 1.5px ${C_green}, 0 0 10px rgba(34,197,94,0.25)` :
       flashAction === 'delete' ? `0 0 0 1.5px ${C_red}, 0 0 10px rgba(248,113,113,0.25)` :
       `0 0 0 1.5px #B8C4D8, 0 0 10px rgba(184,196,216,0.20)`)
    : undefined;

  return (
    <div
      style={{ ...taskCardStyle(task.done, hovered), position: 'relative', boxShadow: flashBorder }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {flashing && flashAction && (
        <div style={{
          position: 'absolute', top: 6, right: 36,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          borderRadius: 999, padding: '2px 8px',
          background: flashAction === 'done' ? 'rgba(34,197,94,0.15)' :
                      flashAction === 'delete' ? 'rgba(248,113,113,0.15)' : 'rgba(184,196,216,0.12)',
          color: flashAction === 'done' ? C_green : flashAction === 'delete' ? C_red : '#B8C4D8',
          border: `1px solid ${flashAction === 'done' ? C_green : flashAction === 'delete' ? C_red : '#B8C4D8'}`,
          fontFamily: "'DM Sans', sans-serif",
          pointerEvents: 'none',
        }}>
          {flashAction === 'done' ? '✓ Done' : flashAction === 'delete' ? '✓ Deleted' : '✓ Added'}
        </div>
      )}
      {/* Custom circular checkbox */}
      <div
        style={{
          ...checkCircleStyle(task.done),
          border: task.done ? 'none' : `1.5px solid ${checkHov ? C_green : 'rgba(184,196,216,0.22)'}`,
          background: task.done ? C_green : checkHov ? 'rgba(34,197,94,0.12)' : 'transparent',
        }}
        onClick={() => onToggle(task)}
        onMouseEnter={() => setCheckHov(true)}
        onMouseLeave={() => setCheckHov(false)}
        title={task.done ? 'Mark as pending' : 'Mark as done'}
      >
        {(task.done || checkHov) && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke={task.done ? '#fff' : C_green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Title */}
      <span style={taskTitleStyle(task.done)}>{task.title}</span>

      {/* Delete — hover reveal */}
      <button
        style={deleteBtnStyle(hovered)}
        onClick={() => onDelete(task)}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#F87171'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A5568'; }}
        title="Delete task"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}
