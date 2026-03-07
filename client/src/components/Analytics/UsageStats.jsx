/**
 * Analytics panel – 2-panel redesign (sidebar + stat cards + bar chart).
 */
import { useState, useEffect } from 'react';
import * as analyticsApi from '../../api/analytics.api';

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
  cyan:    '#22D3EE',
  pink:    '#EC4899',
  text:    '#EEF2FF',
  muted:   '#8899B0',
  faint:   '#4A5568',
};

/* ── kind config ── */
const KIND_CONFIG = {
  ai_call:       { label: 'AI Calls',       color: C.accent, icon: 'M12 2a10 10 0 1 0 10 10' },
  fallback:      { label: 'Fallbacks',       color: C.amber,  icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
  memory_save:   { label: 'Memory Saves',    color: C.violet, icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  task_add:      { label: 'Tasks Added',     color: C.cyan,   icon: 'M12 5v14M5 12h14' },
  task_done:     { label: 'Tasks Done',      color: C.green,  icon: 'M20 6L9 17l-5-5' },
  reminder_set:  { label: 'Reminders Set',   color: C.pink,   icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
};

const QUICK_QUERIES = [
  'How many AI calls?',
  'How many memories?',
  'How many tasks?',
  'Show my usage',
];

function kindLabel(k)  { return KIND_CONFIG[k]?.label  || k;      }
function kindColor(k)  { return KIND_CONFIG[k]?.color  || C.muted; }

/* ── StatCard ── */
function StatCard({ kind, count, max }) {
  const [hov, setHov] = useState(false);
  const color = kindColor(kind);
  const label = kindLabel(kind);
  const pct   = max ? Math.round((count / max) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.cardHov : C.card,
        border: `1px solid ${hov ? C.borderH : C.border}`,
        borderTop: `2px solid ${color}`,
        borderRadius: 10,
        padding: '14px 16px',
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        boxShadow: hov ? '0 4px 18px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 11.5,
          color: C.muted,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {label}
        </span>
        <div style={{
          width: 26, height: 26,
          borderRadius: 7,
          background: `${color}18`,
          border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={KIND_CONFIG[kind]?.icon || 'M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0'} />
          </svg>
        </div>
      </div>

      {/* count */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontWeight: 700,
        fontSize: 26,
        color,
        lineHeight: 1,
        marginBottom: 10,
      }}>
        {count.toLocaleString()}
      </div>

      {/* mini bar */}
      <div style={{ height: 3, background: 'rgba(184,196,216,0.07)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
          opacity: 0.7,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

/* ── main component ── */
export default function UsageStats() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await analyticsApi.getSummary();
        if (!cancelled) setSummary(data.summary || {});
      } catch {
        if (!cancelled) setSummary({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* sorted entries: known kinds first in defined order, then unknowns */
  const orderedKinds = Object.keys(KIND_CONFIG);
  const allKinds = [
    ...orderedKinds.filter(k => summary[k] != null),
    ...Object.keys(summary).filter(k => !orderedKinds.includes(k)),
  ];
  const entries = allKinds.map(k => [k, summary[k] || 0]);
  const total   = entries.reduce((s, [, v]) => s + v, 0);
  const maxVal  = entries.reduce((m, [, v]) => Math.max(m, v), 0);

  return (
    <div className="analytics-panel" style={{
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
      <div className="analytics-sidebar" style={{
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
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </div>

        {/* brand */}
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: '#B8C4D8', lineHeight: 1.1, letterSpacing: '0.04em', marginBottom: 3 }}>
          Analytics
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 18 }}>
          Usage summary
        </div>

        {/* total events */}
        <div style={{
          background: 'rgba(184,196,216,0.05)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 18,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Total Events
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 30,
            fontWeight: 700,
            color: '#B8C4D8',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            {loading ? '—' : total.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.faint }}>
            across {entries.length} categories
          </div>
        </div>

        {/* category breakdown list */}
        <div style={{ fontSize: 10, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
          Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
          {!loading && entries.length === 0 && (
            <div style={{ fontSize: 11.5, color: C.faint }}>No data yet.</div>
          )}
          {entries.map(([kind, count]) => {
            const color = kindColor(kind);
            const pct   = maxVal ? Math.round((count / maxVal) * 100) : 0;
            return (
              <div key={kind}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{kindLabel(kind)}</span>
                  <span style={{ fontSize: 10.5, fontFamily: "'DM Mono', monospace", color, fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(184,196,216,0.07)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, opacity: 0.7 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* tip */}
        <div style={{
          marginTop: 14,
          background: 'rgba(184,196,216,0.06)',
          border: '1px solid rgba(184,196,216,0.14)',
          borderRadius: 8,
          padding: '9px 11px',
          fontSize: 11,
          color: C.muted,
          lineHeight: 1.5,
        }}>
          <span style={{ color: '#B8C4D8', fontWeight: 600 }}>Tip:</span>{' '}
          Ask "Show my usage" in chat for instant stats.
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
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, color: '#B8C4D8', letterSpacing: '0.06em' }}>
            Usage Overview
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
            {total.toLocaleString()} total
          </div>
        </div>

        {/* scrollable content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 18px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}>

          {/* loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.faint, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading analytics…
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* empty */}
          {!loading && entries.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              flex: 1, gap: 10, color: C.faint, paddingTop: 40,
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
              <div style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
                No usage recorded yet.<br />
                <span style={{ color: C.muted, fontSize: 12 }}>Use chat to start generating stats.</span>
              </div>
            </div>
          )}

          {/* stat card grid */}
          {!loading && entries.length > 0 && (
            <div className="analytics-stat-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              alignItems: 'start',
            }}>
              {entries.map(([kind, count]) => (
                <StatCard key={kind} kind={kind} count={count} max={maxVal} />
              ))}
            </div>
          )}

          {/* bar chart section */}
          {!loading && entries.length > 0 && (
            <div>
              <div style={{
                fontSize: 10.5, color: C.faint, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 12,
              }}>
                Distribution
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map(([kind, count]) => {
                  const color = kindColor(kind);
                  const pct   = maxVal ? Math.round((count / maxVal) * 100) : 0;
                  return (
                    <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* label */}
                      <div style={{
                        width: 110, flexShrink: 0,
                        fontSize: 11.5, color: C.muted,
                        fontFamily: "'DM Sans', sans-serif",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {kindLabel(kind)}
                      </div>
                      {/* bar track */}
                      <div style={{
                        flex: 1,
                        height: 7,
                        background: 'rgba(184,196,216,0.07)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${color}99, ${color})`,
                          borderRadius: 999,
                          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                      </div>
                      {/* count */}
                      <div style={{
                        width: 36, flexShrink: 0,
                        textAlign: 'right',
                        fontSize: 11.5, fontWeight: 600,
                        color,
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* quick chat queries */}
          <div>
            <div style={{
              fontSize: 10.5, color: C.faint, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 10,
            }}>
              Try in Chat
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {QUICK_QUERIES.map((q, i) => (
                <div key={i} style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: '6px 11px',
                  fontSize: 11.5,
                  color: C.muted,
                  fontFamily: "'DM Mono', monospace",
                  cursor: 'default',
                  userSelect: 'none',
                }}>
                  "{q}"
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 8, lineHeight: 1.45 }}>
              Jarvis answers these instantly — no AI call needed.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

