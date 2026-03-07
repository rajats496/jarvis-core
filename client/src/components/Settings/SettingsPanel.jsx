/**
 * Settings panel – 2-panel redesign (sidebar + grouped toggle cards).
 * GET/PUT /settings. Toggles for voice, fallback, safe mode, concise, metrics.
 * Syncs with SettingsContext so changes apply live.
 */
import { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import * as settingsApi from '../../api/settings.api';

/* ── API base URL (matches axios.js pattern) ── */
const apiBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000');

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
  text:    '#EEF2FF',
  muted:   '#8899B0',
  faint:   '#4A5568',
};

/* ── setting groups ── */
const GROUPS = [
  {
    key: 'interface',
    label: 'Interface',
    color: C.cyan,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    settings: [
      { key: 'voiceEnabled', label: 'Voice Input / Output', hint: 'Enable microphone and speech synthesis in chat.' },
    ],
  },
  {
    key: 'ai',
    label: 'AI Behavior',
    color: C.accent,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
    settings: [
      { key: 'fallbackModeEnabled', label: 'Fallback Mode', hint: 'Use rule-based responses when the AI provider is unavailable.' },
      { key: 'conciseResponses', label: 'Concise Responses', hint: 'Prefer shorter, more direct AI replies.' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    color: C.amber,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    settings: [
      { key: 'safeModeEnabled', label: 'Safe Mode', hint: 'Automatically disable VM command execution during high system load.' },
      { key: 'vmUrl', label: 'Personal VM URL', hint: 'Optional tunnel URL (e.g. Ngrok) to execute commands on your personal machine.', type: 'text' },
    ],
  },
];

/* ── Toggle switch ── */
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-checked={on}
      role="switch"
      style={{
        width: 42, height: 24,
        borderRadius: 12,
        background: on
          ? `linear-gradient(135deg, ${C.accent}, ${C.violet})`
          : 'rgba(184,196,216,0.08)',
        border: `1px solid ${on ? 'rgba(184,196,216,0.45)' : C.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s, border-color 0.2s',
        padding: 0,
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
        boxShadow: on ? `0 0 8px ${C.accent}50` : 'none',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: on ? 21 : 3,
        width: 16, height: 16,
        borderRadius: '50%',
        background: on ? '#fff' : C.faint,
        transition: 'left 0.2s, background 0.2s',
        boxShadow: on ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
      }} />
    </button>
  );
}

/* ── SettingRow ── */
function SettingRow({ setting, value, onToggle, saving, isLast }) {
  const [hov, setHov] = useState(false);
  const [localText, setLocalText] = useState(value || '');

  useEffect(() => {
    if (setting.type === 'text' || setting.type === 'password') setLocalText(value || '');
  }, [value, setting.type]);

  const isOn = value === true;

  const handleBlur = () => {
    if (localText !== (value || '')) {
      onToggle(setting.key, localText);
    }
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: (setting.type === 'text' || setting.type === 'password') ? 'flex-start' : 'center',
        flexDirection: (setting.type === 'text' || setting.type === 'password') ? 'column' : 'row',
        justifyContent: 'space-between',
        gap: (setting.type === 'text' || setting.type === 'password') ? 10 : 16,
        padding: '12px 16px',
        background: hov ? C.cardHov : 'transparent',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        transition: 'background 0.15s',
        borderRadius: isLast ? '0 0 10px 10px' : 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
        <div style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: isOn || setting.type === 'text' || setting.type === 'password' ? C.text : C.muted,
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 3,
          transition: 'color 0.15s',
        }}>
          {setting.label}
        </div>
        <div style={{
          fontSize: 11.5,
          color: C.faint,
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.4,
        }}>
          {setting.hint}
        </div>
      </div>

      {(setting.type === 'text' || setting.type === 'password') ? (
        <div style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center' }}>
          <input
            type={setting.type || 'text'}
            placeholder={setting.type === 'password' ? '••••••••' : 'http://localhost:4000'}
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onToggle(setting.key, localText); }}
            disabled={saving}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.25)',
              border: `1px solid ${C.border}`,
              color: C.text,
              fontSize: 12.5,
              fontFamily: "'DM Mono', monospace",
              outline: 'none',
            }}
          />
          <button
            onClick={() => onToggle(setting.key, localText)}
            disabled={saving || localText === (value || '')}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: localText !== (value || '') ? 'linear-gradient(135deg, #B8C4D8, #A0B0C8)' : 'rgba(184,196,216,0.07)',
              color: localText !== (value || '') ? 'rgba(8,10,18,0.95)' : C.faint,
              border: 'none',
              cursor: localText !== (value || '') ? 'pointer' : 'default',
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {saving ? '…' : value && localText === value ? '✓ Saved' : 'Save'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isOn && (
            <span style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: C.accent,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              ON
            </span>
          )}
          <Toggle on={isOn} onChange={(val) => onToggle(setting.key, val)} disabled={saving} />
        </div>
      )}
    </div>
  );
}

/* ── main component ── */
export default function SettingsPanel() {
  const { settings: contextSettings, setSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getSettings();
      setSettings(data || {});
    } catch {
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contextSettings || Object.keys(contextSettings).length === 0) {
      fetchSettings();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (key, value) => {
    if (saving) return;
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaving(true);
    try {
      await settingsApi.updateSettings({ [key]: value });
    } catch {
      try {
        const data = await settingsApi.getSettings();
        setSettings(data || {});
      } catch {
        setSettings((prev) => ({ ...prev, [key]: !value }));
      }
    } finally {
      setSaving(false);
    }
  };

  const currentSettings = contextSettings || {};
  // Only count toggle settings (exclude text/input fields from active tally)
  const toggleSettings = GROUPS.flatMap(g => g.settings).filter(s => s.type !== 'text' && s.type !== 'password');
  const enabledCount = toggleSettings.filter(s => currentSettings[s.key] === true).length;
  const totalCount = toggleSettings.length;

  const isInitialLoading = loading && (!contextSettings || Object.keys(contextSettings).length === 0);

  return (
    <div style={{
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
      <div style={{
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>

        {/* brand */}
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: '#B8C4D8', lineHeight: 1.1, letterSpacing: '0.04em', marginBottom: 3 }}>
          Settings
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 18 }}>
          Jarvis configuration
        </div>

        {/* enabled count */}
        <div style={{
          background: 'rgba(184,196,216,0.05)',
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 18,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Active
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 28,
            fontWeight: 700,
            color: '#B8C4D8',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            {isInitialLoading ? '—' : enabledCount}
            <span style={{ fontSize: 14, color: C.faint, fontWeight: 400 }}>
              /{totalCount}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.faint }}>
            settings enabled
          </div>
        </div>

        {/* group nav */}
        <div style={{ fontSize: 10, color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
          Categories
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {GROUPS.map(g => {
            const gToggles = g.settings.filter(s => s.type !== 'text' && s.type !== 'password');
            const gEnabled = gToggles.filter(s => currentSettings[s.key] === true).length;
            return (
              <div
                key={g.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: '1px solid transparent',
                  borderLeft: `2px solid ${g.color}55`,
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12.5, color: C.muted }}>
                  {g.label}
                </span>
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  color: gEnabled > 0 ? g.color : C.faint,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {gEnabled}/{gToggles.length}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* saving indicator */}
        {saving && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 11.5, color: '#B8C4D8',
            padding: '8px 10px',
            background: 'rgba(184,196,216,0.06)',
            border: '1px solid rgba(184,196,216,0.18)',
            borderRadius: 8,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            Saving…
          </div>
        )}

        {/* tip */}
        {!saving && (
          <div style={{
            background: 'rgba(184,196,216,0.06)',
            border: '1px solid rgba(184,196,216,0.14)',
            borderRadius: 8,
            padding: '9px 11px',
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.5,
          }}>
            <span style={{ color: '#B8C4D8', fontWeight: 600 }}>Tip:</span>{' '}
            Changes save instantly — no reload needed.
          </div>
        )}
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
            Preferences
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
            {enabledCount} active
          </div>
        </div>

        {/* settings content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 18px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}>

          {isInitialLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.faint, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Loading settings…
            </div>
          )}

          {!isInitialLoading && GROUPS.map(group => (
            <div key={group.key}>
              {/* group header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <div style={{
                  width: 24, height: 24,
                  borderRadius: 6,
                  background: `${group.color}18`,
                  border: `1px solid ${group.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {group.icon}
                </div>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: 10.5,
                  color: group.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: 1, background: `${group.color}20` }} />
              </div>

              {/* settings card */}
              <div style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                {group.settings.map((s, i) => (
                  <SettingRow
                    key={s.key}
                    setting={s}
                    value={currentSettings[s.key]}
                    onToggle={handleToggle}
                    saving={saving}
                    isLast={i === group.settings.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ── Desktop Agent Card ── */}
          {!isInitialLoading && (
            <div style={{
              background: 'rgba(184,196,216,0.04)',
              border: '1px solid rgba(184,196,216,0.14)',
              borderRadius: 10,
              padding: '14px 16px',
              marginTop: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'rgba(184,196,216,0.08)', border: '1px solid rgba(184,196,216,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#B8C4D8', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.03em' }}>
                    Jarvis Desktop Agent
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>Control your Windows or Mac laptop from chat</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
                Install the local agent on your PC/Mac so Jarvis can check battery, disk, CPU, apps and more — directly from chat.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Windows download */}
                <a
                  href={`${apiBase}/agent/download?platform=windows`}
                  download="jarvis-agent-windows.zip"
                  style={{
                    padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: 'linear-gradient(135deg, #B8C4D8, #A0B0C8)',
                    color: 'rgba(8,10,18,0.95)', textDecoration: 'none', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span>⊞</span> Windows (.zip)
                </a>
                {/* Mac download */}
                <a
                  href={`${apiBase}/agent/download?platform=mac`}
                  download="jarvis-agent-mac.zip"
                  style={{
                    padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: 'rgba(184,196,216,0.07)', border: '1px solid rgba(184,196,216,0.22)',
                    color: C.text, textDecoration: 'none', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span></span> macOS (.zip)
                </a>
                <div style={{
                  padding: '7px 10px', borderRadius: 6, fontSize: 11,
                  background: 'rgba(184,196,216,0.05)', border: `1px solid ${C.border}`,
                  color: C.muted, fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center',
                }}>
                  Then paste tunnel URL above ↑
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(184,196,216,0.04)', borderRadius: 6, fontSize: 11.5, color: C.faint, fontFamily: "'DM Mono', monospace" }}>
                💬 "check battery" · "check disk" · "open chrome" · "lock screen"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


