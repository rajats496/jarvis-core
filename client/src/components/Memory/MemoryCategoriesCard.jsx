/**
 * Category filter – vertical sidebar nav list.
 * Each type is a clickable row: colored dot + label + count badge.
 * Active row: indigo-tinted bg + left accent border.
 */
import { useState, useEffect } from 'react';
import * as memoryApi from '../../api/memory.api';

const TYPE_COLORS = {
  preference: '#B8C4D8',
  fact:       '#A0B0C8',
  note:       '#B8C4D8',
  goal:       '#B8C4D8',
  project:    '#B8C4D8',
  habit:      '#B8C4D8',
};
const DEFAULT_COLOR = '#A0B0C8';

function getColor(type) {
  return TYPE_COLORS[type?.toLowerCase()] || DEFAULT_COLOR;
}

const navStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '8px 8px',
  flex: 1,
  overflowY: 'auto',
  scrollbarWidth: 'none',
};

const sectionLabelStyle = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: '#4A5568',
  padding: '4px 8px 6px',
  fontFamily: "'DM Mono', monospace",
};

function navItemStyle(active, color) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    background: active ? `${color}18` : 'transparent',
    border: 'none',
    borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
    outline: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.13s',
    fontFamily: "'DM Sans', sans-serif",
  };
}

function countBadgeStyle(active, color) {
  return {
    marginLeft: 'auto',
    background: active ? `${color}33` : 'rgba(255,255,255,0.07)',
    color: active ? color : '#475569',
    borderRadius: 999,
    padding: '1px 8px',
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    minWidth: 22,
    textAlign: 'center',
  };
}

export default function MemoryCategoriesCard({ filterType, onFilter }) {
  const [categories, setCategories] = useState({});
  const [hovered, setHovered]       = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await memoryApi.getMemoryCategories();
        if (!cancelled) setCategories(data.categories || {});
      } catch {
        if (!cancelled) setCategories({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const keys = Object.keys(categories);
  const total = keys.reduce((sum, k) => sum + (categories[k]?.length || 0), 0);

  return (
    <div style={navStyle}>
      <div style={sectionLabelStyle}>Filter by type</div>

      {/* All */}
      <button
        type="button"
        style={{
          ...navItemStyle(!filterType, '#B8C4D8'),
          background: !filterType
            ? 'rgba(184,196,216,0.10)'
            : hovered === '__all' ? 'rgba(184,196,216,0.04)' : 'transparent',
        }}
        onClick={() => onFilter('')}
        onMouseEnter={() => setHovered('__all')}
        onMouseLeave={() => setHovered('')}
      >
        <span style={{
          width: 8, height: 8, borderRadius: 2, flexShrink: 0,
          background: !filterType ? '#B8C4D8' : '#2E3545',
          transition: 'background 0.13s',
        }} />
        <span style={{
          fontSize: '13px', fontWeight: !filterType ? 600 : 400,
          color: !filterType ? '#EEF2FF' : '#8899B0',
          transition: 'color 0.13s',
        }}>
          All memories
        </span>
        {!loading && (
          <span style={countBadgeStyle(!filterType, '#B8C4D8')}>{total}</span>
        )}
      </button>

      {/* Per-type rows */}
      {!loading && keys.map((type) => {
        const color   = getColor(type);
        const active  = filterType === type;
        const count   = (categories[type] || []).length;
        const isHov   = hovered === type;

        return (
          <button
            key={type}
            type="button"
            style={{
              ...navItemStyle(active, color),
              background: active
                ? `${color}18`
                : isHov ? 'rgba(184,196,216,0.04)' : 'transparent',
            }}
            onClick={() => onFilter(active ? '' : type)}
            onMouseEnter={() => setHovered(type)}
            onMouseLeave={() => setHovered('')}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: color,
              boxShadow: active ? `0 0 6px ${color}` : 'none',
              transition: 'box-shadow 0.13s',
            }} />
            <span style={{
              fontSize: '13px', fontWeight: active ? 600 : 400,
              color: active ? '#EEF2FF' : '#8899B0',
              textTransform: 'capitalize',
              transition: 'color 0.13s',
            }}>
              {type}
            </span>
            <span style={countBadgeStyle(active, color)}>{count}</span>
          </button>
        );
      })}

      {loading && (
        <div style={{ padding: '12px 10px', fontSize: '12px', color: '#4A5568', fontFamily: "'DM Mono', monospace" }}>
          Loading…
        </div>
      )}
    </div>
  );
}

