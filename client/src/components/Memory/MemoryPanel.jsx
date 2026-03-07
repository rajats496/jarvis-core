/**
 * Memory panel – 2-column layout.
 * Left: sticky sidebar (brand, stats, type-filter nav, export).
 * Right: search toolbar + masonry-grid card list.
 */
import { useState } from 'react';
import MemoryList from './MemoryList';
import MemoryCategoriesCard from './MemoryCategoriesCard';
import ExportButton from './ExportButton';

const panelStyle = {
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  minHeight: 0,
  borderRadius: 14,
  overflow: 'hidden',
  border: '1px solid rgba(184,196,216,0.10)',
};

/* ── left sidebar ── */
const sidebarStyle = {
  width: 220,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(8,10,16,0.98)',
  borderRight: '1px solid rgba(184,196,216,0.09)',
};

const sbHeaderStyle = {
  padding: '18px 16px 14px',
  borderBottom: '1px solid rgba(184,196,216,0.09)',
  flexShrink: 0,
};

const iconRowStyle = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
};

const iconBoxStyle = {
  width: 34, height: 34, borderRadius: 9,
  background: 'rgba(184,196,216,0.07)',
  border: '1px solid rgba(184,196,216,0.18)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

const sbTitleStyle = {
  fontFamily: "'Orbitron', sans-serif",
  fontSize: '13px', fontWeight: 700, color: '#B8C4D8', letterSpacing: '0.04em',
};

const sbSubStyle = {
  fontSize: '11px', color: '#6E7A90', marginTop: 2,
  fontFamily: "'DM Mono', monospace",
};

const hintBoxStyle = {
  margin: '0 10px 8px',
  padding: '9px 11px',
  background: 'rgba(184,196,216,0.05)',
  border: '1px solid rgba(184,196,216,0.11)',
  borderRadius: 9,
  fontSize: '11.5px',
  color: '#8899B0',
  lineHeight: 1.55,
  fontFamily: "'DM Sans', sans-serif",
  flexShrink: 0,
};

const sbFooterStyle = {
  padding: '12px 12px',
  borderTop: '1px solid rgba(184,196,216,0.09)',
  marginTop: 'auto',
  flexShrink: 0,
};

/* ── right main area ── */
const mainStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(10,12,18,0.96)',
};

export default function MemoryPanel() {
  const [filterType, setFilterType] = useState('');
  const [memoryCount, setMemoryCount] = useState(null);

  return (
    <div style={panelStyle}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={sidebarStyle}>
        {/* Brand */}
        <div style={sbHeaderStyle}>
          <div style={iconRowStyle}>
            <div style={iconBoxStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#B8C4D8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
              </svg>
            </div>
            <div>
              <div style={sbTitleStyle}>Memory</div>
              <div style={sbSubStyle}>
                {memoryCount !== null
                  ? `${memoryCount} ${memoryCount === 1 ? 'entry' : 'entries'}`
                  : 'Long-term recall'}
              </div>
            </div>
          </div>

          {/* AI badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(184,196,216,0.07)', border: '1px solid rgba(184,196,216,0.18)',
            borderRadius: 999, padding: '3px 10px',
            fontSize: '10.5px', color: '#B8C4D8', fontWeight: 700,
            fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#B8C4D8', boxShadow: '0 0 5px rgba(184,196,216,0.6)', display: 'inline-block' }} />
            AI INDEXED
          </div>
        </div>

        {/* Hint */}
        <div style={{ padding: '10px 10px 4px', flexShrink: 0 }}>
          <div style={hintBoxStyle}>
            <strong style={{ color: '#B8C4D8', display: 'block', marginBottom: 3 }}>💬 How to use</strong>
            Say <em style={{ color: '#F8FAFC', fontStyle: 'normal' }}>"Remember that I prefer Python"</em> in chat to save.
          </div>
        </div>

        {/* Type filter nav */}
        <MemoryCategoriesCard filterType={filterType} onFilter={setFilterType} />

        {/* Footer */}
        <div style={sbFooterStyle}>
          <ExportButton />
        </div>
      </div>

      {/* ── RIGHT MAIN ── */}
      <div style={mainStyle}>
        <MemoryList refreshTrigger={0} filterType={filterType} onCountChange={setMemoryCount} />
      </div>

    </div>
  );
}
