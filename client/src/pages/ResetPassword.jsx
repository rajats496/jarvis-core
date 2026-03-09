/**
 * ResetPassword — handles /reset-password?token=xxx&email=xxx
 * Called when user clicks the link from their forgot-password email.
 * Shows a new-password form; on success, shows a "done" message and link to /login.
 */
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as authApi from '../api/auth.api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);

  // Strength indicator
  const strength      = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 9 ? 2 : password.length < 13 ? 3 : 4;
  const strengthLabel = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#60A5FA', '#22C55E'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token || !email) {
      setError('Invalid reset link. Please request a new one from the login page.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, email, password);
      setDone(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to reset password. The link may have expired. Please request a new one.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pageWrapper = (children) => (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0D1018 0%, #090B12 55%, #060709 100%)',
      fontFamily: "'Rajdhani', sans-serif", padding: '5vh 16px',
      position: 'relative', overflowY: 'auto', overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Glows */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 50% 45% at 12% 18%,rgba(180,210,255,0.07),transparent 62%),radial-gradient(ellipse 42% 40% at 90% 86%,rgba(200,220,255,0.06),transparent 62%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 440,
        background: 'rgba(14,17,26,0.90)', border: '1px solid rgba(180,196,220,0.09)',
        borderRadius: 22, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 0 0 1px rgba(200,220,255,0.03), 0 32px 80px rgba(0,0,0,0.65)',
        overflow: 'hidden', animation: 'cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        {/* Frost line */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(200,220,255,0.28) 30%,rgba(240,248,255,0.50) 50%,rgba(200,220,255,0.28) 70%,transparent)' }} />
        <div style={{ padding: '2.4rem 2.6rem 2.2rem' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes cardIn { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0E111A inset !important;
          -webkit-text-fill-color: #EEF2FF !important;
        }
      `}</style>
    </div>
  );

  /* ── Success state ── */
  if (done) {
    return pageWrapper(
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.4rem' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.80rem', fontWeight: 600, color: '#EEF2FF', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
          Password updated
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#6E7A90', letterSpacing: '0.04em', lineHeight: 1.6, marginBottom: '1.8rem' }}>
          Your password has been reset successfully.<br />You can now sign in with your new password.
        </div>
        <Link to="/login" style={{
          display: 'inline-block', padding: '0.72rem 1.4rem',
          background: 'linear-gradient(135deg,#1E2430,#2C3448)',
          border: '1px solid rgba(180,200,230,0.20)', borderRadius: 12,
          fontFamily: "'Orbitron', monospace", fontSize: '0.58rem', fontWeight: 600,
          color: '#C8D8F0', letterSpacing: '0.12em', textDecoration: 'none',
          transition: 'all 0.22s ease',
        }}>
          SIGN IN
        </Link>
      </div>
    );
  }

  /* ── Invalid link (no token/email in URL) ── */
  if (!token || !email) {
    return pageWrapper(
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.80rem', fontWeight: 600, color: '#EEF2FF', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
          Invalid reset link
        </div>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 9,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 10, padding: '10px 13px', marginBottom: '1.4rem',
          fontSize: 13, color: '#FCA5A5', lineHeight: 1.45, textAlign: 'left',
        }}>
          <span style={{ flexShrink: 0 }}>&#9888;</span>
          <span>This link is missing required parameters. Please use the exact link from your email, or request a new one.</span>
        </div>
        <Link to="/login" style={{
          display: 'inline-block', padding: '0.72rem 1.4rem',
          background: 'linear-gradient(135deg,#1E2430,#2C3448)',
          border: '1px solid rgba(180,200,230,0.20)', borderRadius: 12,
          fontFamily: "'Orbitron', monospace", fontSize: '0.58rem', fontWeight: 600,
          color: '#C8D8F0', letterSpacing: '0.12em', textDecoration: 'none',
        }}>
          BACK TO SIGN IN
        </Link>
      </div>
    );
  }

  /* ── New password form ── */
  return pageWrapper(
    <>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.82rem', fontWeight: 600, color: '#EEF2FF', letterSpacing: '0.08em', marginBottom: '0.28rem' }}>
        Set new password
      </div>
      <div style={{ fontSize: '0.85rem', color: '#6E7A90', marginBottom: '1.5rem', lineHeight: 1.55 }}>
        Choose a new password for{' '}
        <span style={{ color: '#B8C4D8', fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>{email}</span>.
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 9,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 10, padding: '10px 13px', marginBottom: 18,
          fontSize: 13, color: '#FCA5A5', lineHeight: 1.45,
        }}>
          <span style={{ flexShrink: 0 }}>&#9888;</span><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.9rem' }}>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.59rem', color: '#2E3545', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#2E3545', pointerEvents: 'none' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
              style={{
                width: '100%', padding: '0.82rem 2.85rem',
                background: 'rgba(8,10,18,0.82)',
                border: '1px solid rgba(180,196,220,0.09)',
                borderRadius: 12, color: '#EEF2FF',
                fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 500,
                letterSpacing: '0.02em', outline: 'none', transition: 'all 0.20s ease',
              }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#2E3545', display: 'flex', alignItems: 'center', padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#6E7A90'}
              onMouseLeave={e => e.currentTarget.style.color = '#2E3545'}>
              {showPass
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
        </div>

        {/* Strength bar */}
        <div style={{ display: 'flex', gap: 5, marginBottom: '1.3rem', alignItems: 'center' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ flex: 1, height: 3, borderRadius: 99, background: strength >= n ? strengthColor : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
          ))}
          {strength > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.54rem', color: strengthColor, letterSpacing: '0.10em', marginLeft: 6, whiteSpace: 'nowrap', transition: 'color 0.3s' }}>{strengthLabel}</span>}
        </div>

        <button type="submit" disabled={submitting} style={{
          width: '100%', padding: '0.84rem 1rem', marginBottom: '1.2rem',
          background: submitting ? 'rgba(160,185,220,0.10)' : 'linear-gradient(135deg,#1E2430,#2C3448)',
          border: '1px solid rgba(180,200,230,0.20)', borderRadius: 12,
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: "'Orbitron', monospace", fontSize: '0.62rem', fontWeight: 600,
          color: '#C8D8F0', letterSpacing: '0.12em',
          boxShadow: submitting ? 'none' : '0 0 16px rgba(160,190,230,0.10)',
          transition: 'all 0.22s ease', position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
          onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = 'linear-gradient(135deg,#262E3E,#384050)'; e.currentTarget.style.borderColor = 'rgba(210,225,250,0.32)'; e.currentTarget.style.color = '#F0F4FF'; }}}
          onMouseLeave={e => { if (!submitting) { e.currentTarget.style.background = 'linear-gradient(135deg,#1E2430,#2C3448)'; e.currentTarget.style.borderColor = 'rgba(180,200,230,0.20)'; e.currentTarget.style.color = '#C8D8F0'; }}}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(200,220,255,0.26),transparent)' }} />
          {submitting
            ? <><span style={{ width: 12, height: 12, border: '1.5px solid rgba(200,220,255,0.20)', borderTopColor: '#B8C4D8', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />UPDATING&#8230;</>
            : 'UPDATE PASSWORD'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <Link to="/login" style={{
          fontFamily: "'DM Mono', monospace", fontSize: '0.59rem', color: '#2E3545',
          letterSpacing: '0.06em', textDecoration: 'none', transition: 'color 0.18s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#6E7A90'}
          onMouseLeave={e => e.currentTarget.style.color = '#2E3545'}>
          &#8592; Back to sign in
        </Link>
      </div>
    </>
  );
}
