/**
 * Status Panel – JARVIS-themed system status tab.
 * Matches the dark glass design of all other tabs.
 */
import { useSystemStatus } from '../../hooks/useSystemStatus';

/* ── palette ── */
const C = {
  bg:     'rgba(10,12,18,0.96)',
  sidebar:'rgba(8,10,16,0.98)',
  card:   'rgba(12,15,22,0.96)',
  border: 'rgba(184,196,216,0.09)',
  accent: '#B8C4D8',
  green:  '#22C55E',
  amber:  '#F59E0B',
  red:    '#F87171',
  text:   '#EEF2FF',
  muted:  '#8899B0',
  faint:  '#4A5568',
};

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${color}`, borderRadius: 10, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color, marginBottom: sub ? 2 : 0 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12.5, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 12.5, color: C.text, fontFamily: "'DM Mono', monospace", textAlign: 'right', maxWidth: '55%' }}>{children}</span>
    </div>
  );
}

function StatusPill({ on, onLabel, offLabel }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: on ? `${C.green}15` : `${C.faint}15`,
      border: `1px solid ${on ? C.green + '40' : C.faint + '40'}`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: on ? C.green : C.faint, boxShadow: on ? `0 0 5px ${C.green}` : 'none' }} />
      <span style={{ fontSize: 11.5, fontWeight: 600, color: on ? C.green : C.faint, fontFamily: "'DM Mono', monospace" }}>
        {on ? onLabel : offLabel}
      </span>
    </div>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: spinning ? 'spin 0.7s linear infinite' : 'none' }}>
      <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

export default function StatusPanel() {
  const { status, loading, refresh } = useSystemStatus();
  const s      = status || {};
  const fb     = s.fallbackState || {};
  const load   = s.backendLoad   || {};
  const memCnt = s.memoryCount   ?? 0;
  const MEM_CAP = 100;
  const memPct  = Math.min(Math.round((memCnt / MEM_CAP) * 100), 100);
  const aiOnline = s.aiAvailability === true;

  return (
    <div className="status-panel" style={{
      display: 'flex', flexDirection: 'row',
      height: '100%', minHeight: 0,
      borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${C.border}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ══ LEFT SIDEBAR ══ */}
      <div className="status-sidebar" style={{
        width: 210, minWidth: 210,
        background: C.sidebar, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '18px 14px', overflow: 'hidden',
      }}>

        {/* icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(184,196,216,0.08)', border: '1px solid rgba(184,196,216,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14, flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
        </div>

        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: '#B8C4D8', letterSpacing: '0.04em', marginBottom: 3 }}>
          System Status
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 18 }}>Live backend health</div>

        {/* AI engine card */}
        <div style={{ background: 'rgba(184,196,216,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>AI Engine</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: aiOnline ? C.green : C.red, boxShadow: `0 0 6px ${aiOnline ? C.green : C.red}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: aiOnline ? C.green : C.red }}>{aiOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>{s.aiUsageCount ?? 0} calls · {s.aiFailureCount ?? 0} failures</div>
        </div>

        {/* memory bar */}
        <div style={{ background: 'rgba(184,196,216,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>Memory</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: memPct > 80 ? C.amber : C.green }}>{memPct}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(184,196,216,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 5 }}>
            <div style={{ width: `${memPct}%`, height: '100%', borderRadius: 999, background: memPct > 80 ? `linear-gradient(90deg,${C.amber},${C.red})` : `linear-gradient(90deg,#16A34A,${C.green})`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>{memCnt} / {MEM_CAP} stored</div>
        </div>

        <div style={{ flex: 1 }} />

        {/* refresh btn */}
        <button onClick={refresh} disabled={loading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          width: '100%', padding: '8px 0', borderRadius: 8,
          background: 'rgba(184,196,216,0.06)', border: `1px solid ${C.border}`,
          color: loading ? C.faint : C.accent, fontSize: 12, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(184,196,216,0.12)'; e.currentTarget.style.color = C.text; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.06)'; e.currentTarget.style.color = loading ? C.faint : C.accent; }}
        >
          <RefreshIcon spinning={loading} />
          {loading ? 'Refreshing…' : 'Refresh Now'}
        </button>
      </div>

      {/* ══ RIGHT MAIN ══ */}
      <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* top bar */}
        <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, color: '#B8C4D8', letterSpacing: '0.04em' }}>Backend Health</span>
          <div style={{ marginLeft: 'auto' }}>
            <StatusPill on={aiOnline} onLabel="All systems go" offLabel="Degraded" />
          </div>
          <button onClick={refresh} disabled={loading} title="Refresh" style={{
            background: 'none', border: `1px solid ${C.border}`, borderRadius: 7,
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer', color: C.muted, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.muted; }}
          >
            <RefreshIcon spinning={loading} />
          </button>
        </div>

        {/* scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>

          {loading && !status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.faint, fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Loading…
            </div>
          )}

          {/* stat cards */}
          <div className="status-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
            <StatCard label="AI Status"  value={aiOnline ? 'Online' : 'Offline'} color={aiOnline ? C.green : C.red} />
            <StatCard label="Fallback"   value={fb.fallbackActive ? 'Active' : 'Standby'} color={fb.fallbackActive ? C.amber : C.green} />
            <StatCard label="Safe Mode"  value={s.safeModeActive ? 'ON' : 'OFF'} color={s.safeModeActive ? C.amber : C.green} sub={s.safeModeActive ? 'VM disabled' : 'All enabled'} />
            <StatCard label="Memories"   value={memCnt} color={C.accent} sub={`${memPct}% capacity`} />
            <StatCard label="AI Calls"   value={s.aiUsageCount ?? '—'} color={C.accent} />
            <StatCard label="Failures"   value={s.aiFailureCount ?? '—'} color={(s.aiFailureCount ?? 0) > 0 ? C.red : C.green} />
          </div>

          {/* detail rows */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>
              Backend Load
            </div>
            <Row label="Active requests">{load.activeRequests != null ? `${load.activeRequests} / ${load.maxConcurrent}` : '—'}</Row>
            <Row label="Fallback mode"><StatusPill on={fb.fallbackActive} onLabel="Active" offLabel="Inactive" /></Row>
            <Row label="AI availability"><StatusPill on={aiOnline} onLabel="Available" offLabel="Unavailable" /></Row>
            <Row label="Safe mode"><StatusPill on={s.safeModeActive} onLabel="Enabled" offLabel="Disabled" /></Row>
          </div>

          {Array.isArray(s.notifications) && s.notifications.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Mono', monospace" }}>
                System Notifications
              </div>
              {s.notifications.map((n) => (
                <div key={n.id} style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
                  {n.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
