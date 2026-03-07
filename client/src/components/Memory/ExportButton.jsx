/**
 * Export memories as JSON download – themed button with success feedback.
 */
import { useState } from 'react';
import * as memoryApi from '../../api/memory.api';

export default function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setDone(false);
    try {
      const blob = await memoryApi.exportMemories();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'memories-export.json';
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (_) {}
    setLoading(false);
  };

  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    border: `1px solid ${done ? 'rgba(34,197,94,0.4)' : 'rgba(184,196,216,0.22)'}`,
    borderRadius: 7,
    cursor: loading ? 'wait' : 'pointer',
    background: done ? 'rgba(34,197,94,0.1)' : 'rgba(184,196,216,0.07)',
    color: done ? '#4ADE80' : '#B8C4D8',
    transition: 'all 0.2s',
    opacity: loading ? 0.7 : 1,
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  };

  return (
    <button type="button" style={style} onClick={handleExport} disabled={loading}
      onMouseEnter={(e) => { if (!loading && !done) e.currentTarget.style.background = 'rgba(184,196,216,0.13)'; }}
      onMouseLeave={(e) => { if (!loading && !done) e.currentTarget.style.background = 'rgba(184,196,216,0.07)'; }}
    >
      {done ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          Exported!
        </>
      ) : loading ? (
        'Exporting…'
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export JSON
        </>
      )}
    </button>
  );
}
