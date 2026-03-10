/**
 * Login page — J.A.R.V.I.S Access Portal redesign.
 * Includes forgot-password link flow (inline, 2 steps).
 */
import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import * as authApi from '../api/auth.api';

export default function Login() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused,    setFocused]    = useState(null);
  const [showPass,   setShowPass]   = useState(false);

  /* ── Forgot-password state ── */
  const [fpStep,       setFpStep]       = useState(0); // 0=hidden 1=email 2=check-email
  const [fpEmail,      setFpEmail]      = useState('');
  const [fpDevLink,    setFpDevLink]    = useState('');
  const [fpEmailErr,   setFpEmailErr]   = useState('');
  const [fpSubmitting, setFpSubmitting] = useState(false);
  const [fpError,      setFpError]      = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleEnabled = googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setError('');
      setSubmitting(true);
      await loginWithGoogle(tokenResponse.access_token);
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Google sign-in failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Is the backend running?' : err.message) ||
        'Login failed.'
      );
    } finally { setSubmitting(false); }
  };

  /* ── Close forgot-password panel ── */
  const closeFp = () => {
    setFpStep(0);
    setFpEmail('');
    setFpDevLink('');
    setFpEmailErr('');
    setFpError('');
  };

  /* ── FP Step 1: send reset link ── */
  const handleFpSendLink = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpEmail.trim()) { setFpError('Please enter your email address.'); return; }
    setFpSubmitting(true);
    try {
      const res = await authApi.forgotPassword(fpEmail.trim());
      if (res.devLink) setFpDevLink(res.devLink);
      if (res.emailError) setFpEmailErr(res.emailError);
      setFpStep(2);
    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED';
      const isNetwork = err.code === 'ERR_NETWORK';
      const msg = err.response?.data?.error
        || (isTimeout ? 'Server is waking up — please try again in 30 seconds.' : null)
        || (isNetwork ? 'Cannot reach server. Check your connection or wait for backend to wake.' : null)
        || err.message
        || 'Failed to send reset link.';
      setFpError(msg);
    } finally { setFpSubmitting(false); }
  };

  const inp = (field) => ({
    width: '100%',
    padding: '0.82rem 2.85rem',
    paddingLeft: '2.85rem',
    background: 'rgba(8,10,18,0.82)',
    border: `1px solid ${focused === field ? 'rgba(200,218,245,0.26)' : 'rgba(180,196,220,0.09)'}`,
    borderRadius: 12,
    color: '#EEF2FF',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.92rem',
    fontWeight: 500,
    letterSpacing: '0.02em',
    outline: 'none',
    transition: 'all 0.20s ease',
    boxShadow: focused === field ? '0 0 0 3px rgba(160,190,230,0.06)' : 'none',
  });

  return (
    <div className="auth-page-wrapper" style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0D1018 0%, #090B12 55%, #060709 100%)',
      padding: '5vh 16px',
      fontFamily: "'Rajdhani', sans-serif",
      position: 'relative', overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* Square grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), ' +
          'linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Radial glows */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(ellipse 50% 45% at 12% 18%, rgba(180,210,255,0.07), transparent 62%), ' +
          'radial-gradient(ellipse 42% 40% at 90% 86%, rgba(200,220,255,0.06), transparent 62%)',
      }} />

      {/* HUD corners */}
      {[
        { top: 20, left: 20, borderTop: '1px solid rgba(184,196,216,0.18)', borderLeft: '1px solid rgba(184,196,216,0.18)' },
        { top: 20, right: 20, borderTop: '1px solid rgba(184,196,216,0.18)', borderRight: '1px solid rgba(184,196,216,0.18)' },
        { bottom: 20, left: 20, borderBottom: '1px solid rgba(184,196,216,0.18)', borderLeft: '1px solid rgba(184,196,216,0.18)' },
        { bottom: 20, right: 20, borderBottom: '1px solid rgba(184,196,216,0.18)', borderRight: '1px solid rgba(184,196,216,0.18)' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'fixed', width: 36, height: 36, pointerEvents: 'none', zIndex: 2, ...s }} />
      ))}



      {/* ── Card ── */}
      <div className="auth-card" style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 460,
        background: 'rgba(14,17,26,0.90)',
        border: '1px solid rgba(180,196,220,0.09)',
        borderRadius: 22,
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 0 0 1px rgba(200,220,255,0.03), 0 32px 80px rgba(0,0,0,0.65)',
        overflow: 'hidden',
        animation: 'cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        {/* Frost line */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(200,220,255,0.28) 30%, rgba(240,248,255,0.50) 50%, rgba(200,220,255,0.28) 70%, transparent)',
        }} />

        <div style={{ padding: '2.4rem 2.6rem 2.2rem' }}>

          {/* ── Logo ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
            <div style={{ position: 'relative', width: 66, height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', inset: 0,
                border: '1px solid rgba(200,216,240,0.18)',
                clipPath: 'polygon(10px 0%,calc(100% - 10px) 0%,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0% calc(100% - 10px),0% 10px)',
                background: 'rgba(160,185,220,0.05)',
                animation: 'logoPulse 4s ease-in-out infinite',
              }} />
              <svg width="38" height="38" viewBox="0 0 100 100" fill="none"
                style={{ animation: 'logoGlow 4s ease-in-out infinite' }}>
                <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" stroke="#B8C4D8" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                <polygon points="50,18 76,33 76,67 50,82 24,67 24,33" stroke="#7A8A9E" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.6"/>
                <line x1="50" y1="6"  x2="50" y2="18" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55"/>
                <line x1="88" y1="28" x2="76" y2="33" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55"/>
                <line x1="88" y1="72" x2="76" y2="67" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55"/>
                <line x1="50" y1="94" x2="50" y2="82" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55"/>
                <line x1="12" y1="72" x2="24" y2="67" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55"/>
                <line x1="12" y1="28" x2="24" y2="33" stroke="#B8C4D8" strokeWidth="1.5" opacity="0.55"/>
                <polygon points="50,30 64,50 50,70 36,50" stroke="#D0DCEF" strokeWidth="1.8" fill="rgba(200,220,255,0.05)" strokeLinejoin="round"/>
                <circle cx="50" cy="50" r="5" fill="#EEF4FF" opacity="0.90"/>
                <circle cx="50" cy="50" r="2.5" fill="#FFFFFF"/>
              </svg>
            </div>
            <div style={{
              fontFamily: "'Orbitron', monospace", fontSize: '1.20rem', fontWeight: 700, letterSpacing: '0.16em',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #B8C4D8 55%, #7A90B0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>J.A.R.V.I.S</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.58rem', color: '#2E3545', letterSpacing: '0.14em', marginTop: -2 }}>
              SECURE ACCESS PORTAL
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: 'flex', marginBottom: '1.8rem',
            background: 'rgba(8,10,18,0.65)',
            border: '1px solid rgba(180,196,220,0.09)',
            borderRadius: 12, padding: 4,
          }}>
            <div style={{
              flex: 1, padding: '0.58rem', borderRadius: 9,
              background: 'rgba(184,196,216,0.13)',
              fontFamily: "'Orbitron', monospace", fontSize: '0.58rem', fontWeight: 600,
              letterSpacing: '0.10em', color: '#B8C4D8', textAlign: 'center',
              boxShadow: '0 1px 0 rgba(220,232,255,0.07) inset',
            }}>SIGN IN</div>
            <Link to="/register" style={{
              flex: 1, padding: '0.58rem', borderRadius: 9,
              background: 'transparent',
              fontFamily: "'Orbitron', monospace", fontSize: '0.58rem', fontWeight: 600,
              letterSpacing: '0.10em', color: '#2E3545', textAlign: 'center',
              textDecoration: 'none', display: 'block', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#6E7A90'}
              onMouseLeave={e => e.currentTarget.style.color = '#2E3545'}
            >CREATE ACCOUNT</Link>
          </div>

          {/* ── Panel title ── */}
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.82rem', fontWeight: 600, color: '#EEF2FF', letterSpacing: '0.08em', marginBottom: '0.28rem' }}>
            Welcome back
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6E7A90', marginBottom: '1.5rem', lineHeight: 1.55 }}>
            Sign in to access your AI core dashboard.
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 10, padding: '10px 13px', marginBottom: 18,
              fontSize: 13, color: '#FCA5A5', lineHeight: 1.45,
            }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.59rem', color: '#2E3545', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: focused === 'email' ? '#B8C4D8' : '#2E3545', pointerEvents: 'none', transition: 'color 0.18s', flexShrink: 0 }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input type="email" placeholder="agent@jarvis.ai" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  disabled={submitting} autoComplete="email"
                  style={inp('email')} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '0.4rem' }}>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.59rem', color: '#2E3545', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: focused === 'password' ? '#B8C4D8' : '#2E3545', pointerEvents: 'none', transition: 'color 0.18s' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  disabled={submitting} autoComplete="current-password"
                  style={{ ...inp('password'), paddingRight: '2.85rem' }} />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#2E3545', display: 'flex', alignItems: 'center', transition: 'color 0.18s', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#6E7A90'}
                  onMouseLeave={e => e.currentTarget.style.color = '#2E3545'}>
                  {showPass
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.3rem' }}>
              <button type="button" onClick={() => { setFpEmail(email); setFpStep(1); setFpError(''); }}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.59rem', color: '#2E3545', letterSpacing: '0.06em', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#B8C4D8'}
                onMouseLeave={e => e.currentTarget.style.color = '#2E3545'}>
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              style={{
                width: '100%', padding: '0.84rem 1rem', marginBottom: '1.2rem',
                background: submitting ? 'rgba(160,185,220,0.10)' : 'linear-gradient(135deg, #1E2430, #2C3448)',
                border: '1px solid rgba(180,200,230,0.20)',
                borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: "'Orbitron', monospace", fontSize: '0.62rem', fontWeight: 600,
                color: '#C8D8F0', letterSpacing: '0.12em',
                boxShadow: submitting ? 'none' : '0 0 16px rgba(160,190,230,0.10)',
                transition: 'all 0.22s ease', position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = 'linear-gradient(135deg, #262E3E, #384050)'; e.currentTarget.style.borderColor = 'rgba(210,225,250,0.32)'; e.currentTarget.style.color = '#F0F4FF'; }}}
              onMouseLeave={e => { if (!submitting) { e.currentTarget.style.background = 'linear-gradient(135deg, #1E2430, #2C3448)'; e.currentTarget.style.borderColor = 'rgba(180,200,230,0.20)'; e.currentTarget.style.color = '#C8D8F0'; }}}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,220,255,0.26), transparent)' }} />
              {submitting ? (
                <>
                  <span style={{ width: 12, height: 12, border: '1.5px solid rgba(200,220,255,0.20)', borderTopColor: '#B8C4D8', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  AUTHENTICATING
                </>
              ) : 'INITIATE ACCESS'}
            </button>
          </form>

          {/* Google OAuth — only shown when client ID is configured */}
          {googleEnabled && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 1rem', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(180,200,230,0.15), transparent)' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.53rem', color: '#3A4558', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(180,200,230,0.15), transparent)' }} />
              </div>
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                label="Continue with Google"
                disabled={submitting}
              />
            </>
          )}

          {/* ══ FORGOT PASSWORD PANEL (overlay inside card) ══ */}
          {fpStep > 0 && (
            <div style={{
              position:'absolute',inset:0,zIndex:10,
              background:'rgba(14,17,26,0.97)',borderRadius:22,
              display:'flex',flexDirection:'column',justifyContent:'center',
              padding:'2rem 2.6rem',
            }}>
              {/* FP header */}
              <div style={{marginBottom:'1.5rem'}}>
                <div style={{fontFamily:"'Orbitron', monospace",fontSize:'0.82rem',fontWeight:600,color:'#EEF2FF',letterSpacing:'0.08em',marginBottom:'0.28rem'}}>
                  Reset password
                </div>
                <div style={{fontSize:'0.85rem',color:'#6E7A90',lineHeight:1.55}}>
                  {fpStep===1 && 'Enter your email and we\'ll send a password reset link.'}
                  {fpStep===2 && <>Link sent to <span style={{color:'#B8C4D8',fontFamily:"'DM Mono', monospace",fontSize:'0.8rem'}}>{fpEmail}</span>. Check your inbox.</>}
                </div>
              </div>

              {/* FP error */}
              {fpError && (
                <div style={{display:'flex',alignItems:'flex-start',gap:9,background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:10,padding:'10px 13px',marginBottom:16,fontSize:13,color:'#FCA5A5',lineHeight:1.45}}>
                  <span style={{flexShrink:0}}>⚠</span><span>{fpError}</span>
                </div>
              )}

              {/* Step 1: email */}
              {fpStep===1 && (
                <form onSubmit={handleFpSendLink}>
                  <div style={{marginBottom:'1.2rem'}}>
                    <label style={{display:'block',fontFamily:"'DM Mono', monospace",fontSize:'0.59rem',color:'#2E3545',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'0.45rem'}}>Email Address</label>
                    <div style={{position:'relative'}}>
                      <svg style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#2E3545',pointerEvents:'none'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input type="email" placeholder="agent@jarvis.ai" value={fpEmail} onChange={e=>setFpEmail(e.target.value)}
                        disabled={fpSubmitting} autoComplete="email" style={inp('fpEmail')} />
                    </div>
                  </div>
                  <button type="submit" disabled={fpSubmitting} style={{width:'100%',padding:'0.84rem',background:fpSubmitting?'rgba(160,185,220,0.10)':'linear-gradient(135deg,#1E2430,#2C3448)',border:'1px solid rgba(180,200,230,0.20)',borderRadius:12,cursor:fpSubmitting?'not-allowed':'pointer',fontFamily:"'Orbitron', monospace",fontSize:'0.62rem',fontWeight:600,color:'#C8D8F0',letterSpacing:'0.12em',transition:'all 0.22s ease',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    {fpSubmitting?<><span style={{width:12,height:12,border:'1.5px solid rgba(200,220,255,0.20)',borderTopColor:'#B8C4D8',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>SENDING…</>
:'SEND RESET LINK'}
                  </button>
                </form>
              )}

              {/* Step 2: check email */}
              {fpStep===2 && (
                <div>
                  {fpDevLink && (
                    <div style={{background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.30)',borderRadius:10,padding:'12px 14px',marginBottom:14,display:'flex',flexDirection:'column',gap:8}}>
                      <span style={{fontFamily:"'DM Mono', monospace",fontSize:'0.56rem',color:'#CA8A04',letterSpacing:'0.12em',textTransform:'uppercase'}}>&#9888; Email delivery failed &#8212; dev mode link</span>
                      <a href={fpDevLink} target="_blank" rel="noreferrer"
                        style={{fontFamily:"'DM Mono', monospace",fontSize:'0.62rem',color:'#FDE047',wordBreak:'break-all',lineHeight:1.5,textDecoration:'underline'}}>
                        {fpDevLink}
                      </a>
                      {fpEmailErr && <span style={{fontSize:'0.65rem',color:'#DC2626',lineHeight:1.4,wordBreak:'break-all'}}>Reason: {fpEmailErr}</span>}
                    </div>
                  )}
                  <div style={{background:'rgba(180,196,220,0.06)',border:'1px solid rgba(180,196,220,0.12)',borderRadius:12,padding:'1.2rem 1.4rem',marginBottom:'0.8rem',display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E7A90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <span style={{fontFamily:"'DM Mono', monospace",fontSize:'0.62rem',color:'#6E7A90',letterSpacing:'0.04em',lineHeight:1.5}}>
                        Check your inbox (and spam folder). Click the <strong style={{color:'#B8C4D8'}}>Reset Password</strong> button in the email.
                      </span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E7A90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span style={{fontFamily:"'DM Mono', monospace",fontSize:'0.62rem',color:'#6E7A90',letterSpacing:'0.04em'}}>
                        Link expires in <strong style={{color:'#B8C4D8'}}>1 hour</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Back / cancel */}
              <div style={{textAlign:'center',marginTop:16}}>
                <button type="button" onClick={closeFp}
                  style={{fontFamily:"'DM Mono', monospace",fontSize:'0.59rem',color:'#2E3545',background:'none',border:'none',cursor:'pointer',padding:0,transition:'color 0.18s'}}
                  onMouseEnter={e=>e.currentTarget.style.color='#6E7A90'}
                  onMouseLeave={e=>e.currentTarget.style.color='#2E3545'}>
                  &#8592; Back to sign in
                </button>
              </div>
            </div>
          )}

          {/* Terms */}
          <div style={{ textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: '0.57rem', color: '#2E3545', letterSpacing: '0.03em', lineHeight: 1.7 }}>
            By signing in you agree to our{' '}
            <span style={{ color: '#6E7A90', cursor: 'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: '#6E7A90', cursor: 'pointer' }}>Privacy Policy</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes cardIn  { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes logoPulse { 0%,100%{ border-color:rgba(200,216,240,0.18); } 50%{ border-color:rgba(230,242,255,0.36); box-shadow:0 0 20px rgba(200,225,255,0.09); } }
        @keyframes logoGlow  { 0%,100%{ filter:drop-shadow(0 0 4px rgba(200,220,255,0.42)); } 50%{ filter:drop-shadow(0 0 10px rgba(220,235,255,0.78)); } }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0E111A inset !important;
          -webkit-text-fill-color: #EEF2FF !important;
        }
      `}</style>
    </div>
  );
}
