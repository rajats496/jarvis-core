/**
 * Memory form - add structured memory (type, category, value, keywords). No AI.
 */

import { useState } from 'react';

const formStyle = { marginBottom: '1rem' };
const rowStyle = { marginBottom: '10px' };
const labelStyle = {
  display: 'block', fontSize: '11px', color: '#6E7A90', fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  marginBottom: '5px', fontFamily: "'DM Mono', monospace",
};
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px',
  background: 'rgba(8,10,18,0.90)',
  border: '1px solid rgba(184,196,216,0.10)',
  borderRadius: '8px',
  color: '#C8D4E4',
  fontSize: '13.5px',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};
const btnStyle = {
  padding: '8px 20px',
  background: 'rgba(184,196,216,0.10)',
  border: '1px solid rgba(184,196,216,0.28)',
  borderRadius: '999px',
  color: '#EEF2FF',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: "'DM Mono', monospace",
  transition: 'opacity 0.13s',
};

export default function MemoryForm({ onCreate, disabled }) {
  const [type, setType] = useState('preference');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const v = value.trim();
    if (!v) {
      setError('Value is required.');
      return;
    }
    const kw = keywords.trim() ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];
    onCreate({ type: type.trim() || 'preference', category: category.trim(), value: v, keywords: kw });
    setValue('');
    setKeywords('');
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      {error && <div style={{ color: '#F87171', fontSize: '12.5px', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
      <div style={rowStyle}>
        <label style={labelStyle}>Type</label>
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="e.g. preference"
          style={inputStyle}
          disabled={disabled}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Category (optional)</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. programming_language"
          style={inputStyle}
          disabled={disabled}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Value *</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Python"
          style={inputStyle}
          disabled={disabled}
        />
      </div>
      <div style={rowStyle}>
        <label style={labelStyle}>Keywords (comma-separated, optional)</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g. python, coding"
          style={inputStyle}
          disabled={disabled}
        />
      </div>
      <button type="submit" style={btnStyle} disabled={disabled}>
        Add memory
      </button>
    </form>
  );
}
