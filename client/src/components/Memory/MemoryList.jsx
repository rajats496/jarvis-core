/**
 * Memory list – 2-column card grid with inline search toolbar.
 * Cards show type badge, value (3-line clamp), keywords, date.
 * Edit/delete actions float top-right and appear on hover.
 */
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import * as memoryApi from '../../api/memory.api';
import { formatDate } from '../../utils/formatters';

const DEBOUNCE_MS = 300;

const TYPE_COLORS = {
  preference: '#B8C4D8',
  fact:       '#A0B0C8',
  note:       '#B8C4D8',
  goal:       '#B8C4D8',
  project:    '#B8C4D8',
  habit:      '#B8C4D8',
};
function typeColor(type) {
  return TYPE_COLORS[type?.toLowerCase()] || '#A0B0C8';
}

/* ── outer wrapper ── */
const containerStyle = {
  display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden',
};

/* ── toolbar: search + refresh in one row ── */
const toolbarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  borderBottom: '1px solid rgba(184,196,216,0.09)',
  flexShrink: 0,
};
const searchWrapStyle = {
  position: 'relative',
  flex: 1,
};
const searchIconStyle = {
  position: 'absolute',
  left: 13, top: '50%',
  transform: 'translateY(-50%)',
  color: '#475569', pointerEvents: 'none', lineHeight: 0,
};
const searchInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  height: '38px',
  padding: '0 12px 0 36px',
  background: 'rgba(8,10,18,0.90)',
  border: '1px solid rgba(184,196,216,0.10)',
  borderRadius: '10px',
  color: '#C8D4E4',
  fontSize: '13px',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};

/* ── stat chip ── */
const statChipStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 11px',
  background: 'rgba(184,196,216,0.05)',
  border: '1px solid rgba(184,196,216,0.10)',
  borderRadius: 8,
  fontSize: '12px', color: '#6E7A90',
  fontFamily: "'DM Mono', monospace",
  whiteSpace: 'nowrap', flexShrink: 0,
};

/* ── scrollable grid container ── */
const gridWrapStyle = {
  flex: 1, overflowY: 'auto', padding: '14px 16px',
};
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
  alignItems: 'start',
};

/* ── memory card ── */
function cardStyle(color, hovered, flashing, flashAction) {
  let flashBorder = color;
  let flashShadow = '';
    let flashBg = hovered ? 'rgba(18,22,32,0.98)' : 'rgba(12,15,22,0.96)';
  if (flashing && flashAction === 'update') {
    flashBorder = '#22C55E';
    flashBg = 'rgba(34,197,94,0.07)';
    flashShadow = ', 0 0 16px rgba(34,197,94,0.35)';
  } else if (flashing && flashAction === 'delete') {
    flashBorder = '#F87171';
    flashBg = 'rgba(239,68,68,0.07)';
    flashShadow = ', 0 0 16px rgba(239,68,68,0.35)';
  }
  return {
    position: 'relative',
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: '12px 13px',
    borderRadius: 10,
    background: flashing ? flashBg : (hovered ? 'rgba(18,22,32,0.98)' : 'rgba(12,15,22,0.96)'),
    border: `1px solid ${flashing ? flashBorder + '80' : (hovered ? 'rgba(184,196,216,0.16)' : 'rgba(184,196,216,0.09)')}`,
    borderTop: `2px solid ${flashing ? flashBorder : color}`,
    transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
    boxShadow: `${hovered ? `0 6px 24px rgba(0,0,0,0.35), 0 0 0 1px ${color}22` : '0 2px 8px rgba(0,0,0,0.3)'}${flashShadow}`,
    cursor: 'default',
    overflow: 'hidden',
  };
}

/* type badge */
function typeBadgeStyle(color) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    color,
    background: `${color}15`,
    border: `1px solid ${color}38`,
    borderRadius: 999,
    padding: '2px 8px',
    fontFamily: "'DM Sans', sans-serif",
  };
}

const catBadgeStyle = {
  display: 'inline-flex', fontSize: '10px', fontWeight: 600,
  color: '#6E7A90',
  background: 'rgba(184,196,216,0.06)',
  border: '1px solid rgba(184,196,216,0.10)',
  borderRadius: 999, padding: '2px 8px',
  fontFamily: "'DM Sans', sans-serif",
};

const valueStyle = {
  fontSize: '13.5px', color: '#C8D4E4', lineHeight: 1.55,
  wordBreak: 'break-word',
  fontFamily: "'DM Sans', sans-serif",
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const KW_PALETTES = [
  { color: '#B8C4D8', bg: 'rgba(184,196,216,0.08)',  border: 'rgba(184,196,216,0.18)' },
  { color: '#A0B0C8', bg: 'rgba(160,176,200,0.07)', border: 'rgba(160,176,200,0.16)' },
  { color: '#B8C4D8', bg: 'rgba(184,196,216,0.06)',  border: 'rgba(184,196,216,0.14)' },
];
function kwPillStyle(i) {
  const p = KW_PALETTES[i % 3];
  return {
    display: 'inline-block', fontSize: '10.5px', color: p.color,
    background: p.bg, border: `1px solid ${p.border}`,
    borderRadius: 999, padding: '1px 7px',
    marginRight: 3, marginBottom: 2,
    fontFamily: "'DM Sans', sans-serif",
  };
}

const dateStyle = {
  fontSize: '10.5px', color: '#4A5568',
  fontFamily: "'DM Mono', monospace",
  marginTop: 2,
};

/* hover-action bar */
function actionBarStyle(visible) {
  return {
    display: 'flex', gap: 5, marginTop: 6,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.14s',
    pointerEvents: visible ? 'auto' : 'none',
  };
}

function actionBtnStyle(danger) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', fontSize: '11.5px', fontWeight: 500,
    border: `1px solid ${danger ? 'rgba(239,68,68,0.28)' : 'rgba(184,196,216,0.12)'}`,
    borderRadius: 999, cursor: 'pointer', background: 'transparent',
    color: danger ? '#F87171' : '#6E7A90',
    transition: 'background 0.12s, color 0.12s',
    fontFamily: "'DM Sans', sans-serif",
  };
}

/* edit form */
const editWrapStyle = { display: 'flex', flexDirection: 'column', gap: 9 };
const editLabelStyle = {
  fontSize: '10px', color: '#6E7A90', fontWeight: 700,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  marginBottom: 3, display: 'block',
  fontFamily: "'DM Mono', monospace",
};
const editInputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 10px',
  background: 'rgba(8,10,18,0.90)',
  border: '1px solid rgba(184,196,216,0.10)',
  borderRadius: 7, color: '#C8D4E4',
  fontSize: '13px', fontFamily: "'DM Sans', sans-serif", outline: 'none',
};
const saveBtnStyle = {
  padding: '5px 14px', background: 'rgba(184,196,216,0.12)',
  border: '1px solid rgba(184,196,216,0.28)',
  borderRadius: 999, color: '#EEF2FF',
  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  fontFamily: "'DM Mono', monospace",
};
const cancelBtnStyle = {
  padding: '5px 14px', background: 'transparent',
  border: '1px solid rgba(184,196,216,0.12)',
  borderRadius: 999, color: '#6E7A90',
  fontSize: '12px', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function MemoryList({ refreshTrigger, filterType, onCountChange }) {
  const [memories, setMemories]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({ type: '', category: '', value: '', keywords: '' });
  const [hoveredId, setHoveredId]   = useState(null);
  const [flashId, setFlashId]       = useState(null);   // id of card to flash
  const [flashAction, setFlashAction] = useState(null); // 'update' | 'delete'

  const debouncedQ = useDebounce(searchQuery.trim(), DEBOUNCE_MS);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = debouncedQ
        ? await memoryApi.searchMemories(debouncedQ, 50)
        : await memoryApi.getMemories({ limit: 50, ...(filterType ? { type: filterType } : {}) });
      const mems = data.memories || [];
      setMemories(mems);
      if (typeof onCountChange === 'function') onCountChange(mems.length);
    } catch (_) {
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, filterType, onCountChange]);

  useEffect(() => { fetchList(); }, [fetchList, refreshTrigger]);

  // Listen for memory changes from chat/voice → auto-reload + flash affected card
  useEffect(() => {
    const handler = (e) => {
      const { action, id } = e.detail || {};
      setFlashAction(action || 'update');
      setFlashId(id || null);
      fetchList();
      // Clear flash after 2s
      setTimeout(() => { setFlashId(null); setFlashAction(null); }, 2200);
    };
    window.addEventListener('jarvis:memory-changed', handler);
    return () => window.removeEventListener('jarvis:memory-changed', handler);
  }, [fetchList]);

  /* delete */
  const handleDelete = async (id) => {
    if (!confirm('Delete this memory?')) return;
    try {
      await memoryApi.deleteMemory(id);
      setMemories((prev) => {
        const next = prev.filter((m) => m.id !== id);
        if (typeof onCountChange === 'function') onCountChange(next.length);
        return next;
      });
    } catch (_) {}
  };

  /* edit */
  const startEdit = (m) => {
    setEditingId(m.id);
    setEditForm({
      type: m.type || '',
      category: m.category || '',
      value: typeof m.value === 'string' ? m.value : JSON.stringify(m.value),
      keywords: (m.keywords || []).join(', '),
    });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const body = {
        type: editForm.type.trim() || 'preference',
        category: editForm.category.trim(),
        value: editForm.value.trim(),
        keywords: editForm.keywords.trim()
          ? editForm.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
      };
      const updated = await memoryApi.updateMemory(editingId, body);
      setMemories((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...updated } : m)));
      setEditingId(null);
    } catch (_) {}
  };

  const countLabel = loading
    ? '…'
    : `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'}${filterType ? ` · ${filterType}` : ''}${debouncedQ ? ` for "${debouncedQ}"` : ''}`;

  return (
    <div style={containerStyle}>

      {/* ── Toolbar: search + stat + refresh ── */}
      <div style={toolbarStyle}>
        <div style={searchWrapStyle}>
          <span style={searchIconStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories…"
            style={searchInputStyle}
          />
        </div>

        <span style={statChipStyle}>{countLabel}</span>

        <button
          type="button"
          onClick={fetchList}
          title="Refresh"
          style={{
            width: 38, height: 38, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(184,196,216,0.05)',
            border: '1px solid rgba(184,196,216,0.10)',
            borderRadius: 9, cursor: 'pointer',
            color: '#6E7A90', transition: 'color 0.13s, background 0.13s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#B8C4D8'; e.currentTarget.style.background = 'rgba(184,196,216,0.10)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6E7A90'; e.currentTarget.style.background = 'rgba(184,196,216,0.05)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>
      </div>

      {/* ── Card grid ── */}
      <div style={gridWrapStyle}>

        {loading && (
          <div style={{ gridColumn: '1/-1', padding: '48px 20px', textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, margin: '0 auto 12px',
              border: '2px solid rgba(184,196,216,0.15)',
              borderTop: '2px solid #B8C4D8',
              borderRadius: '50%',
              animation: 'memSpin 0.8s linear infinite',
            }} />
            <style>{`@keyframes memSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: '13px', color: '#4A5568', fontFamily: "'DM Mono', monospace" }}>Loading memories…</div>
          </div>
        )}

        {!loading && memories.length === 0 && (
          <div style={{
            padding: '36px 24px', textAlign: 'center',
            background: 'rgba(12,15,22,0.96)',
            border: '1px solid rgba(184,196,216,0.09)',
            borderRadius: 12,
          }}>
            <div className="empty-state-icon" style={{ fontSize: '28px', marginBottom: '10px' }}>🧠</div>
            <div style={{ fontSize: '14px', color: '#C8D4E4', fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
              {debouncedQ ? `No results for "${debouncedQ}"` : filterType ? `No ${filterType} memories yet` : 'No memories yet'}
            </div>
            <div style={{
              display: 'inline-block', fontSize: '12px', color: '#6E7A90',
              background: 'rgba(184,196,216,0.06)', border: '1px solid rgba(184,196,216,0.12)',
              borderRadius: 8, padding: '7px 14px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Say <span style={{ color: '#B8C4D8' }}>&quot;Remember that I prefer dark mode&quot;</span> in chat
            </div>
          </div>
        )}

        {!loading && memories.length > 0 && (
          <div style={gridStyle}>
            {memories.map((m) => {
              const color     = typeColor(m.type);
              const isEditing = editingId === m.id;
              const hovered   = hoveredId === m.id;

              const isFlashing = m.id === String(flashId);

              return (
                <div
                  key={m.id}
                  style={{ ...cardStyle(color, hovered && !isEditing, isFlashing, flashAction), position: 'relative' }}
                  onMouseEnter={() => setHoveredId(m.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {isFlashing && flashAction && (
                    <div style={{
                      position: 'absolute', top: 7, right: 7,
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                      borderRadius: 999, padding: '2px 9px',
                      background: flashAction === 'update' ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)',
                      color: flashAction === 'update' ? '#22C55E' : '#F87171',
                      border: `1px solid ${flashAction === 'update' ? '#22C55E' : '#F87171'}`,
                      fontFamily: "'DM Sans', sans-serif",
                      pointerEvents: 'none',
                    }}>
                      {flashAction === 'update' ? '✓ Updated' : '✓ Deleted'}
                    </div>
                  )}
                  {isEditing ? (
                    /* ── Edit form ── */
                    <div style={editWrapStyle}>
                      <div>
                        <span style={editLabelStyle}>Type</span>
                        <input value={editForm.type}
                          onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                          placeholder="preference / fact / note / goal…"
                          style={editInputStyle} />
                      </div>
                      <div>
                        <span style={editLabelStyle}>Category</span>
                        <input value={editForm.category}
                          onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                          placeholder="Category"
                          style={editInputStyle} />
                      </div>
                      <div>
                        <span style={editLabelStyle}>Value</span>
                        <input value={editForm.value}
                          onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))}
                          placeholder="Memory content"
                          style={editInputStyle} />
                      </div>
                      <div>
                        <span style={editLabelStyle}>Keywords (comma separated)</span>
                        <input value={editForm.keywords}
                          onChange={(e) => setEditForm((f) => ({ ...f, keywords: e.target.value }))}
                          placeholder="python, dark mode, react"
                          style={editInputStyle} />
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <button type="button" style={saveBtnStyle} onClick={saveEdit}>Save</button>
                        <button type="button" style={cancelBtnStyle} onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display view ── */
                    <>
                      {/* Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={typeBadgeStyle(color)}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
                          {m.type || 'memory'}
                        </span>
                        {m.category && <span style={catBadgeStyle}>{m.category}</span>}
                      </div>

                      {/* Value */}
                      <div style={valueStyle}>
                        {typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}
                      </div>

                      {/* Keywords */}
                      {m.keywords?.length > 0 && (
                        <div>
                          {m.keywords.map((kw, i) => (
                            <span key={kw} style={kwPillStyle(i)}>{kw}</span>
                          ))}
                        </div>
                      )}

                      {/* Date */}
                      <div style={dateStyle}>{formatDate(m.updatedAt)}</div>

                      {/* Actions — visible on hover */}
                      <div style={actionBarStyle(hovered)}>
                        <button
                          type="button"
                          style={actionBtnStyle(false)}
                          onClick={() => startEdit(m)}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#B8C4D8'; e.currentTarget.style.borderColor = 'rgba(184,196,216,0.28)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#6E7A90'; e.currentTarget.style.borderColor = 'rgba(184,196,216,0.12)'; }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          style={actionBtnStyle(true)}
                          onClick={() => handleDelete(m.id)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

