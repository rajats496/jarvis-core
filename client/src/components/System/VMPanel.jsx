/**
 * Desktop Control panel – 2-panel redesign (sidebar + terminal area).
 */
import { useState, useEffect } from 'react';
import * as vmApi from '../../api/vm.api';
import * as commandsApi from '../../api/commands.api';
import { useSystemStatus } from '../../hooks/useSystemStatus';

/* ── palette ── */
const C = {
  bg:      'rgba(10,12,18,0.96)',
  sidebar: 'rgba(8,10,16,0.98)',
  term:    'rgba(4,6,12,0.98)',
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
  cyan:    '#22D3EE',
  text:    '#EEF2FF',
  muted:   '#8899B0',
  faint:   '#4A5568',
};

/* ── full command groups ── */
const COMMAND_GROUPS = [
  {
    key: 'system', label: 'System', color: C.cyan,
    cmds: [
      { cmd: 'battery',        label: 'Battery'     },
      { cmd: 'cpu',            label: 'CPU'          },
      { cmd: 'ram',            label: 'RAM'          },
      { cmd: 'disk',           label: 'Disk'         },
      { cmd: 'network',        label: 'Network'      },
      { cmd: 'hostname',       label: 'Hostname'     },
      { cmd: 'os',             label: 'OS Info'      },
      { cmd: 'uptime',         label: 'Uptime'       },
      { cmd: 'processes',      label: 'Processes'    },
      { cmd: 'status',         label: 'Status'       },
      { cmd: 'df -h',          label: 'df -h'        },
      { cmd: 'free -m',        label: 'free -m'      },
    ],
  },
  {
    key: 'power', label: 'Power', color: C.amber,
    cmds: [
      { cmd: 'battery saver on',  label: 'Saver On'    },
      { cmd: 'battery saver off', label: 'Saver Off'   },
      { cmd: 'display off',       label: 'Display Off' },
      { cmd: 'lock',              label: 'Lock Screen', danger: true },
    ],
  },
  {
    key: 'volume', label: 'Volume', color: C.violet,
    cmds: [
      { cmd: 'volume mute',   label: 'Mute'        },
      { cmd: 'volume unmute', label: 'Unmute'      },
      { cmd: 'volume up',     label: 'Volume Up'   },
      { cmd: 'volume down',   label: 'Volume Down' },
    ],
  },
  {
    key: 'apps', label: 'Apps', color: C.green,
    cmds: [
      { cmd: 'open notepad',       label: 'Notepad'      },
      { cmd: 'open calculator',    label: 'Calculator'   },
      { cmd: 'open explorer',      label: 'Explorer'     },
      { cmd: 'open chrome',        label: 'Chrome'       },
      { cmd: 'open spotify',       label: 'Spotify'      },
      { cmd: 'open vscode',        label: 'VS Code'      },
      { cmd: 'open terminal',      label: 'Terminal'     },
      { cmd: 'open settings',      label: 'Settings'     },
      { cmd: 'open paint',         label: 'Paint'        },
      { cmd: 'open task manager',  label: 'Task Mgr'     },
      { cmd: 'open camera',        label: 'Camera'       },
    ],
  },
  {
    key: 'clipboard', label: 'Clipboard', color: C.cyan,
    cmds: [
      { cmd: 'clipboard',       label: 'Read Clipboard' },
      { cmd: 'clear clipboard', label: 'Clear Clipboard' },
    ],
  },
  {
    key: 'network', label: 'Network', color: C.violet,
    cmds: [
      { cmd: 'wifi name',     label: 'WiFi Name'    },
      { cmd: 'wifi list',     label: 'WiFi List'    },
      { cmd: 'internet test', label: 'Ping Test'    },
      { cmd: 'ip info',       label: 'IP Info'      },
    ],
  },
  {
    key: 'files', label: 'Files', color: C.green,
    cmds: [
      { cmd: 'recent files', label: 'Recent Files' },
      { cmd: 'downloads',    label: 'Downloads'    },
    ],
  },
];

function formatTime(dateStr) {
  try {
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ''; }
}

export default function VMPanel() {
  const { status } = useSystemStatus();
  const [command,  setCommand]  = useState('');
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [history,  setHistory]  = useState([]);
  const [inputFoc, setInputFoc] = useState(false);
  const [activeGroup, setActiveGroup] = useState('system');
  const [firedCmd, setFiredCmd] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const safeMode = status?.safeModeActive === true;

  const fireCommand = (cmd) => {
    runCommand(cmd);
    setFiredCmd(cmd);
    setTimeout(() => setFiredCmd(null), 1400);
  };

  const fetchHistory = () => {
    commandsApi.getCommandHistory(10)
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory([]));
  };

  useEffect(() => { fetchHistory(); }, []);

  const runCommand = async (cmd) => {
    const trimmed = (cmd ?? command).trim();
    if (!trimmed || loading || safeMode) return;
    setCommand(trimmed);
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await vmApi.executeCommand(trimmed);
      if (data.success === false) {
        setError(data.result || 'Command failed.');
        setResult(null);
      } else {
        setResult(data.result != null ? data.result : '(no output)');
        setError(null);
        fetchHistory();
      }
    } catch (err) {
      const msg = err.response?.status === 503
        ? 'Safe mode active — VM commands are disabled.'
        : (err.response?.data?.error || err.message || 'Request failed.');
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); runCommand(); };

  /* ─────────────────── MOBILE LAYOUT ─────────────────── */
  if (isMobile) {
    const activeGrp = COMMAND_GROUPS.find(g => g.key === activeGroup) ?? COMMAND_GROUPS[0];
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
        background: C.bg, fontFamily: "'DM Sans', sans-serif",
        borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`,
      }}>

        {/* ── Status bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          background: C.sidebar,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'rgba(184,196,216,0.08)', border: '1px solid rgba(184,196,216,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, color: '#B8C4D8', letterSpacing: '0.04em' }}>Desktop Control</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 6,
            background: safeMode ? `${C.amber}12` : `${C.green}10`,
            border: `1px solid ${safeMode ? C.amber + '35' : C.green + '30'}`,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: safeMode ? C.amber : C.green, boxShadow: `0 0 4px ${safeMode ? C.amber : C.green}` }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: safeMode ? C.amber : C.green }}>
              {safeMode ? 'Safe Mode' : 'Online'}
            </span>
          </div>
        </div>

        {/* ── Group chip strip ── */}
        <div style={{
          display: 'flex', gap: 5, padding: '7px 10px',
          overflowX: 'auto', flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          scrollbarWidth: 'none',
        }}>
          {COMMAND_GROUPS.map(g => (
            <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{
              whiteSpace: 'nowrap', padding: '5px 13px',
              borderRadius: 999, fontSize: 11, fontWeight: 600,
              border: activeGroup === g.key ? `1px solid ${g.color}70` : `1px solid rgba(184,196,216,0.12)`,
              background: activeGroup === g.key ? `${g.color}18` : 'transparent',
              color: activeGroup === g.key ? g.color : C.faint,
              cursor: 'pointer', transition: 'all .15s',
            }}>{g.label}</button>
          ))}
        </div>

        {/* ── Command grid (2-col) ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 6, padding: '8px 10px',
          overflowY: 'auto', maxHeight: 220, flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {activeGrp.cmds.map(({ cmd, label }) => {
            const fired = firedCmd === cmd;
            return (
              <button key={cmd} onClick={() => fireCommand(cmd)} style={{
                padding: '9px 10px', borderRadius: 8, textAlign: 'left',
                border: `1px solid ${fired ? activeGrp.color + '80' : 'rgba(184,196,216,0.10)'}`,
                background: fired ? `${activeGrp.color}20` : 'rgba(184,196,216,0.04)',
                color: fired ? activeGrp.color : C.text, cursor: 'pointer',
                fontSize: 11.5, fontWeight: 500, lineHeight: 1.3,
                transition: 'all .15s',
              }}>
                {fired ? `✓ ${label}` : label}
              </button>
            );
          })}
        </div>

        {/* ── Command input ── */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 10px', flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          background: C.sidebar,
        }}>
          <span style={{ color: C.green, fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>$</span>
          <input
            value={command}
            onChange={e => setCommand(e.target.value)}
            onFocus={() => setInputFoc(true)}
            onBlur={() => setInputFoc(false)}
            placeholder={safeMode ? 'Safe mode — blocked' : 'Type a command…'}
            disabled={safeMode}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: C.text,
              padding: '3px 0',
            }}
          />
          <button type="submit" disabled={loading || safeMode || !command.trim()} style={{
            padding: '5px 14px', borderRadius: 7,
            background: loading || safeMode || !command.trim() ? 'rgba(184,196,216,0.08)' : `${C.green}22`,
            border: `1px solid ${loading || safeMode || !command.trim() ? 'rgba(184,196,216,0.10)' : C.green + '50'}`,
            color: loading || safeMode || !command.trim() ? C.faint : C.green,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {loading ? '…' : 'Run'}
          </button>
        </form>

        {/* ── Terminal output ── */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {result && (
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, color: C.green, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{result}</div>
            </div>
          )}
          {error && (
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, color: '#FF6B6B', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{error}</div>
            </div>
          )}
          {loading && (
            <div style={{ padding: '8px 12px', color: C.faint, fontSize: 12, fontStyle: 'italic' }}>Running…</div>
          )}
          {!result && !error && !loading && (
            <div style={{ padding: '14px 12px', textAlign: 'center', color: C.faint, fontSize: 11.5 }}>
              Tap a command or type one above
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={{ padding: '4px 10px 10px' }}>
              <div style={{ fontSize: 10, color: C.faint, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Recent</div>
              {history.map((h, i) => (
                <div key={i} onClick={() => fireCommand(h.command)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 10px', borderRadius: 7, marginBottom: 4,
                  background: 'rgba(184,196,216,0.04)', border: '1px solid rgba(184,196,216,0.08)',
                  cursor: 'pointer',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: h.exitCode === 0 ? C.green : '#FF6B6B' }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.command}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: h.exitCode === 0 ? C.green : '#FF6B6B', flexShrink: 0 }}>{h.exitCode === 0 ? 'OK' : 'Fail'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────── DESKTOP LAYOUT ─────────────────── */

  return (
    <div className="commands-panel" style={{
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
      <div className="commands-sidebar" style={{
        width: 230, minWidth: 230,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 14px 12px', flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(184,196,216,0.08)', border: '1px solid rgba(184,196,216,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B8C4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, color: '#B8C4D8', letterSpacing: '0.04em' }}>Desktop Control</div>
              <div style={{ fontSize: 10.5, color: C.faint }}>Click to run any command</div>
            </div>
          </div>

          {/* Status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 7,
            background: safeMode ? `${C.amber}12` : `${C.green}10`,
            border: `1px solid ${safeMode ? C.amber + '35' : C.green + '30'}`,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: safeMode ? C.amber : C.green,
              boxShadow: `0 0 5px ${safeMode ? C.amber : C.green}`,
            }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: safeMode ? C.amber : C.green }}>
              {safeMode ? 'Safe Mode — commands blocked' : 'Online — ready'}
            </span>
          </div>
        </div>

        {/* Group tabs — scrollable horizontal strip */}
        <div style={{
          display: 'flex', gap: 4, padding: '8px 10px',
          overflowX: 'auto', flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          scrollbarWidth: 'none',
        }}>
          {COMMAND_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setActiveGroup(g.key)}
              style={{
                whiteSpace: 'nowrap', padding: '4px 10px',
                borderRadius: 999, fontSize: 10.5, fontWeight: 600,
                border: activeGroup === g.key ? `1px solid ${g.color}60` : `1px solid transparent`,
                background: activeGroup === g.key ? `${g.color}18` : 'transparent',
                color: activeGroup === g.key ? g.color : C.faint,
                cursor: 'pointer', transition: 'all 0.14s',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Command list for active group */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '6px 8px',
          display: 'flex', flexDirection: 'column', gap: 2,
          alignContent: 'start',
          scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent`,
        }}>
          {(COMMAND_GROUPS.find(g => g.key === activeGroup)?.cmds || []).map(({ cmd, label, danger }) => {
            const isFired  = firedCmd === cmd;
            const grpColor = COMMAND_GROUPS.find(g => g.key === activeGroup)?.color || C.accent;
            return (
              <button
                key={cmd}
                disabled={loading || safeMode}
                onClick={() => fireCommand(cmd)}
                title={cmd}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 7,
                  border: 'none',
                  borderLeft: `2px solid ${
                    isFired ? C.green : danger ? C.red : 'transparent'
                  }`,
                  background: isFired
                    ? `${C.green}0D`
                    : danger
                    ? `${C.red}08`
                    : 'transparent',
                  cursor: loading || safeMode ? 'not-allowed' : 'pointer',
                  opacity: safeMode ? 0.4 : 1,
                  transition: 'all 0.12s',
                  textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => {
                  if (!safeMode) {
                    e.currentTarget.style.background = danger ? `${C.red}10` : `${grpColor}10`;
                    e.currentTarget.style.borderLeftColor = danger ? C.red : grpColor;
                  }
                }}
                onMouseLeave={e => {
                  if (!safeMode) {
                    e.currentTarget.style.background = isFired ? `${C.green}0D` : danger ? `${C.red}08` : 'transparent';
                    e.currentTarget.style.borderLeftColor = isFired ? C.green : danger ? C.red : 'transparent';
                  }
                }}
              >
                {/* indicator dot */}
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: isFired ? C.green : danger ? C.red : grpColor,
                  opacity: isFired ? 1 : 0.45,
                  transition: 'opacity 0.12s',
                }} />
                <span style={{
                  flex: 1,
                  fontSize: 12, fontWeight: 500,
                  color: isFired ? C.green : danger ? C.red : C.muted,
                  transition: 'color 0.12s',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.01em',
                }}>{label}</span>
                {isFired && (
                  <span style={{ fontSize: 10, color: C.green, fontWeight: 600, flexShrink: 0 }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* History count footer */}
        <div style={{
          padding: '8px 12px', flexShrink: 0,
          borderTop: `1px solid ${C.border}`,
          fontSize: 11, color: C.faint,
        }}>
          <span style={{ color: '#B8C4D8', fontWeight: 600 }}>{history.length}</span>
          {' '}command{history.length !== 1 ? 's' : ''} in history
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

        {/* command input bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* prompt symbol */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: C.input,
              border: `1px solid ${inputFoc ? 'rgba(184,196,216,0.35)' : C.border}`,
              borderRadius: 9,
              height: 38,
              flex: 1,
              paddingLeft: 12,
              gap: 8,
              transition: 'border-color 0.15s',
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: inputFoc ? '#B8C4D8' : C.faint,
                userSelect: 'none',
                transition: 'color 0.15s',
              }}>$</span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onFocus={() => setInputFoc(true)}
                onBlur={() => setInputFoc(false)}
                placeholder="e.g. uptime, df -h, free -m, status"
                disabled={loading || safeMode}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: C.text,
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || safeMode || !command.trim()}
              style={{
                background: loading || safeMode || !command.trim()
                  ? 'rgba(184,196,216,0.10)'
                  : 'linear-gradient(135deg, #B8C4D8, #8899B0)',
                color: loading || safeMode || !command.trim() ? C.faint : 'rgba(8,10,18,0.95)',
                fontWeight: 700,
                border: 'none',
                borderRadius: 8,
                height: 38,
                padding: '0 18px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading || safeMode || !command.trim() ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Running…' : 'Run'}
            </button>
          </form>
        </div>

        {/* terminal output area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}>

          {/* result output */}
          {(result != null || error || loading) && (
            <div>
              <div style={{
                fontSize: 10.5, color: C.faint, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: error ? C.red : loading ? C.amber : C.green,
                  boxShadow: `0 0 5px ${error ? C.red : loading ? C.amber : C.green}`,
                }} />
                Output
              </div>
              <div style={{
                background: C.term,
                border: `1px solid ${error ? C.red + '35' : C.border}`,
                borderRadius: 10,
                padding: '13px 15px',
                fontFamily: "'DM Mono', monospace",
                fontSize: 12.5,
                color: error ? C.red : C.green,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.65,
                maxHeight: 220,
                overflow: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: `${C.border} transparent`,
              }}>
                {loading && (
                  <span style={{ color: C.amber }}>Running…</span>
                )}
                {!loading && error && error}
                {!loading && result != null && !error && result}
              </div>
            </div>
          )}

          {/* empty state */}
          {result == null && !error && !loading && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: C.faint,
              padding: '30px 0',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              <div style={{ fontSize: 12.5, textAlign: 'center', lineHeight: 1.5 }}>
                Select a quick command from the sidebar<br />or type one above and click Run.
              </div>
            </div>
          )}

          {/* command history */}
          {history.length > 0 && (
            <div>
              <div style={{
                fontSize: 10.5, color: C.faint, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 8,
              }}>
                History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => !safeMode && setCommand(h.command)}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${h.success ? C.green : C.red}`,
                      borderRadius: 9,
                      padding: '9px 13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: safeMode ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!safeMode) e.currentTarget.style.background = C.cardHov; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.card; }}
                  >
                    {/* status dot */}
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: h.success ? C.green : C.red,
                      flexShrink: 0,
                    }} />
                    {/* command text */}
                    <span style={{
                      flex: 1,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12.5,
                      color: C.text,
                    }}>
                      {h.command}
                    </span>
                    {/* status badge */}
                    <span style={{
                      fontSize: 10.5, fontWeight: 600,
                      color: h.success ? C.green : C.red,
                      background: h.success ? `${C.green}14` : `${C.red}14`,
                      border: `1px solid ${h.success ? C.green : C.red}30`,
                      borderRadius: 999,
                      padding: '1px 8px',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {h.success ? 'OK' : 'Failed'}
                    </span>
                    {h.createdAt && (
                      <span style={{
                        fontSize: 10.5, color: C.faint,
                        fontFamily: "'DM Mono', monospace",
                        flexShrink: 0,
                      }}>
                        {formatTime(h.createdAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
