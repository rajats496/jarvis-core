/**
 * SystemMonitorPanel - Right panel with real-time system metrics
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import * as systemApi from '../../api/system.api';
import * as activityApi from '../../api/activity.api';
import { useVoice } from '../../hooks/useVoice';
import QuickCommands from './QuickCommands';
import VoiceInterface from './VoiceInterface';

/* Format a date as relative time */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const KIND_ICONS = {
  memory: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',
  task: 'M3 13l2-2 4 4 8-8 4 4',
  reminder: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
  goal: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  command: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
};
function kindIcon(kind) {
  const k = (kind || '').toLowerCase();
  for (const key of Object.keys(KIND_ICONS)) {
    if (k.startsWith(key)) return KIND_ICONS[key];
  }
  return KIND_ICONS.chat;
}
function kindLabel(kind) {
  if (!kind) return 'Event';
  return kind.charAt(0).toUpperCase() + kind.slice(1).replace(/_/g, ' ');
}

export default function SystemMonitorPanel({ onTabChange }) {
  const [status, setStatus] = useState(null);
  const [latency, setLatency] = useState(null);
  const [activity, setActivity] = useState([]);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const latencyRef = useRef(null);

  const loadStatus = useCallback(async () => {
    const t0 = Date.now();
    try {
      const data = await systemApi.getStatus();
      setLatency(Date.now() - t0);
      setStatus(data);
    } catch {
      setLatency(null);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      const data = await activityApi.getTimeline(5);
      setActivity(Array.isArray(data) ? data : []);
    } catch {
      setActivity([]);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadActivity();
    const si = setInterval(loadStatus, 8000);
    const ai = setInterval(loadActivity, 15000);
    return () => { clearInterval(si); clearInterval(ai); };
  }, [loadStatus, loadActivity]);

  /* ── derived values ── */
  const aiOnline = status?.aiAvailability === true;
  const fallbackActive = status?.fallbackState?.fallbackActive === true;
  const memCount = status?.memoryCount ?? 0;
  const MEM_CAP = 100;
  const memPct = Math.min(Math.round((memCount / MEM_CAP) * 100), 100);

  const aiFailures = status?.aiFailureCount ?? 0;
  const aiUsage = status?.aiUsageCount ?? 0;

  const COMMAND_MESSAGES = {
    cpu: 'check cpu',
    diagnostics: 'run diagnostics',
    analytics: 'Show me my usage analytics and activity summary.',
    memories: 'What do you remember about me? Show all my memories.',
  };

  const handleCommand = (id) => {
    const text = COMMAND_MESSAGES[id];
    if (!text) return;
    window.dispatchEvent(new CustomEvent('jarvis:quickchat', { detail: { text } }));
  };

  const handleVoiceResult = useCallback((text) => {
    if (!text) return;
    setVoiceTranscript('');
    window.dispatchEvent(new CustomEvent('jarvis:quickchat', { detail: { text } }));
  }, []);

  const voice = useVoice({
    onResult: handleVoiceResult,
    onInterim: (text) => setVoiceTranscript(text),
  });

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={rpTitleStyle}>System Status</span>
        <button
          onClick={() => { loadStatus(); loadActivity(); }}
          style={dotsBtnStyle}
          title="Refresh"
        >↻</button>
      </div>

      {/* AI Status */}
      <div style={sectionStyle}>
        <div style={metricRowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: aiOnline ? '#4ADE80' : '#F87171',
              display: 'inline-block',
              boxShadow: aiOnline ? '0 0 7px #4ADE80' : '0 0 7px #F87171',
            }} />
            <span style={{ ...metricLabelStyle, color: '#CBD5E1', fontWeight: 500 }}>AI Status</span>
          </div>
          <span style={metricValStyle}>
            {latency != null ? `${latency} ms` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: aiOnline ? '#4ADE80' : '#F87171',
              display: 'inline-block',
            }} />
            <span style={{ ...metricLabelStyle, color: aiOnline ? '#4ADE80' : '#F87171', fontWeight: 600 }}>
              {aiOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <span style={{ ...metricValStyle, fontSize: 10.5 }}>
            {aiUsage} calls · {aiFailures} fail
          </span>
        </div>
      </div>

      {/* AI Memories */}
      <div style={sectionStyle}>
        <div style={{ ...metricRowStyle, marginBottom: 8 }}>
          <span style={{ ...metricLabelStyle, color: '#94A3B8', fontWeight: 500, fontSize: 13 }}>AI Memories</span>
          <span style={metricValStyle}>{memCount} stored</span>
        </div>
        <MiniBar
          pct={memPct}
          color={memPct > 80 ? 'linear-gradient(90deg,#F97316,#EF4444)' : 'linear-gradient(90deg,#22C55E,#16A34A)'}
        />
        <div style={{ ...metricLabelStyle, marginTop: 5, fontSize: 11 }}>
          {memCount} / {MEM_CAP} capacity
        </div>
      </div>

      {/* Fallback Mode */}
      <div style={sectionStyle}>
        <div style={{ ...metricRowStyle, marginBottom: 8 }}>
          <span style={{ ...metricLabelStyle, color: '#94A3B8', fontWeight: 500, fontSize: 13 }}>Fallback Mode</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
              background: fallbackActive ? '#B8C4D8' : '#4ADE80',
            display: 'inline-block',
            boxShadow: fallbackActive ? '0 0 6px rgba(180,200,230,0.45)' : '0 0 7px #4ADE80',
          }} />
          <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>
            {fallbackActive ? 'Active' : 'Inactive'}
          </span>
          {status?.safeModeActive && (
            <span style={{
              marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
              color: '#EEF2FF', background: 'rgba(184,196,216,0.10)',
              border: '1px solid rgba(200,216,240,0.22)',
              borderRadius: 4, padding: '1px 6px', fontFamily: "'DM Mono', monospace",
            }}>SAFE MODE</span>
          )}
        </div>
        <span style={{ fontSize: 11.5, color: '#2E3545' }}>
          {fallbackActive
            ? 'Limited features available.'
            : status?.aiAvailability
              ? 'AI system operating normally.'
              : 'AI offline — fallback may activate.'}
        </span>
        <button onClick={() => handleCommand('diagnostics')} style={diagBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,196,216,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,216,240,0.28)'; e.currentTarget.style.color = '#EEF2FF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,18,28,0.90)'; e.currentTarget.style.borderColor = 'rgba(180,196,220,0.12)'; e.currentTarget.style.color = '#B8C4D8'; }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Run Diagnostics
        </button>
      </div>

      {/* Quick Commands */}
      <QuickCommands onCommand={handleCommand} />

      {/* Voice Interface */}
      <VoiceInterface
        listening={voice.listening}
        onStart={voice.startListening}
        onStop={voice.stopListening}
        transcript={voiceTranscript}
        disabled={!voice.supported.stt}
      />

      {/* Recent Activity — real data */}
      <div style={{ padding: '14px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: 16, paddingRight: 16, marginBottom: 6,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#2E3545', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
            Recent Activity
          </span>
          <button
            onClick={loadActivity}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2E3545', fontSize: 13 }}
            title="Refresh activity"
          >↻</button>
        </div>
        {activity.length === 0 ? (
          <div style={{ paddingLeft: 16, fontSize: 11.5, color: '#2E3545' }}>No recent activity yet.</div>
        ) : (
          activity.map((item) => (
            <ActivityItem
              key={item.id}
              d={kindIcon(item.kind)}
              title={kindLabel(item.kind)}
              sub={timeAgo(item.createdAt)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DonutGauge({ pct = 24, size = 70, sw = 7 }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="rpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#7A90B0" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#rpGrad)" strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
        fill="#EEF2FF" fontSize="13" fontFamily="'DM Mono',monospace" fontWeight="700">
        {pct}%
      </text>
    </svg>
  );
}

function MiniBar({ pct, color = 'linear-gradient(90deg,#B8C4D8,#7A90B0)' }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color, borderRadius: 99,
        transition: 'width 1.2s cubic-bezier(.4,0,.2,1)'
      }} />
    </div>
  );
}

function ActivityItem({ d, title, sub }) {
  return (
    <div style={activityItemStyle}>
      <div style={eventIconStyle}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="#B8C4D8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#6E7A90', fontWeight: 500, lineHeight: 1.4 }}>{title}</div>
        <div style={{ fontSize: 10.5, color: '#2E3545', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

const panelStyle = {
  width: '280px',
  height: '100vh',
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(160,180,220,0.15) transparent',
  position: 'fixed',
  right: 0,
  top: 0,
  background: 'rgba(8, 10, 16, 0.96)',
  borderLeft: '1px solid rgba(180, 196, 220, 0.09)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

const headerStyle = {
  padding: '18px 16px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid rgba(180, 196, 220, 0.09)',
  flexShrink: 0,
};

const rpTitleStyle = {
  fontFamily: "'Orbitron', monospace",
  fontWeight: 700,
  fontSize: '13px',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #B8C4D8 55%, #7A90B0 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  letterSpacing: '0.10em',
};

const dotsBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#2E3545',
  letterSpacing: 1,
  fontSize: '16px',
  lineHeight: 1,
  padding: '2px 6px',
  transition: 'color 0.18s',
};

const sectionStyle = {
  borderBottom: '1px solid rgba(180, 196, 220, 0.06)',
  padding: '16px',
};

const metricRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
};

const metricLabelStyle = {
  fontSize: '12px',
  color: '#6E7A90',
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 500,
  letterSpacing: '0.04em',
};

const metricValStyle = {
  fontSize: '12px',
  color: '#B8C4D8',
  fontFamily: "'DM Mono', monospace",
};

const diagBtnStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '10px',
  background: 'rgba(14,18,28,0.90)',
  border: '1px solid rgba(180,196,220,0.12)',
  color: '#B8C4D8',
  fontSize: '12px',
  fontFamily: "'DM Mono', monospace",
  fontWeight: 500,
  letterSpacing: '0.05em',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all .2s',
  marginTop: '12px',
};

const activityItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '10px 0',
  borderBottom: '1px solid rgba(180,196,220,0.05)',
};

const eventIconStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  background: 'rgba(14,18,28,0.90)',
  border: '1px solid rgba(180,196,220,0.10)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: 1,
};
