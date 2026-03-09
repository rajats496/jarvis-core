/**
 * VerifyEmail — handles /verify-email?token=xxx&email=xxx
 * Called when user clicks the link from their signup email.
 * Auto-logs in on success and redirects to /dashboard.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth.api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setErrorMsg('Invalid verification link. Please request a new one.');
      setStatus('error');
      return;
    }

    authApi.verifyEmailToken(token, email)
      .then(({ token: jwt, user }) => {
        loginWithToken(jwt, user);
        setStatus('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      })
      .catch(err => {
        setErrorMsg(
          err.response?.data?.error ||
          'Verification failed. The link may have expired or already been used.'
        );
        setStatus('error');
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0D1018 0%, #090B12 55%, #060709 100%)',
      fontFamily: "'Rajdhani', sans-serif", padding: '5vh 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 420, textAlign: 'center',
        background: 'rgba(14,17,26,0.90)', border: '1px solid rgba(180,196,220,0.09)',
        borderRadius: 22, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 0 0 1px rgba(200,220,255,0.03), 0 32px 80px rgba(0,0,0,0.65)',
        overflow: 'hidden',
      }}>
        {/* Frost line */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(200,220,255,0.28) 30%,rgba(240,248,255,0.50) 50%,rgba(200,220,255,0.28) 70%,transparent)' }} />

        <div style={{ padding: '2.8rem 2.6rem 2.4rem' }}>
          {/* Logo mark */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.6rem' }}>
            <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
              <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" stroke="#B8C4D8" strokeWidth="2" fill="none" strokeLinejoin="round"/>
              <polygon points="50,30 64,50 50,70 36,50" stroke="#D0DCEF" strokeWidth="1.8" fill="rgba(200,220,255,0.05)" strokeLinejoin="round"/>
              <circle cx="50" cy="50" r="5" fill="#EEF4FF" opacity="0.90"/>
              <circle cx="50" cy="50" r="2.5" fill="#FFFFFF"/>
            </svg>
          </div>

          {status === 'verifying' && (
            <>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.80rem', fontWeight: 600, color: '#EEF2FF', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                Verifying your email
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(200,220,255,0.20)', borderTopColor: '#B8C4D8', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#6E7A90', letterSpacing: '0.04em' }}>
                Please wait&#8230;
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.80rem', fontWeight: 600, color: '#22C55E', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                Account verified ✓
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.62rem', color: '#6E7A90', letterSpacing: '0.04em', lineHeight: 1.5 }}>
                Redirecting you to your dashboard&#8230;
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.80rem', fontWeight: 600, color: '#EEF2FF', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                Verification failed
              </div>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: 10, padding: '10px 13px', marginBottom: '1.4rem',
                fontSize: 13, color: '#FCA5A5', lineHeight: 1.45, textAlign: 'left',
              }}>
                <span style={{ flexShrink: 0 }}>&#9888;</span>
                <span>{errorMsg}</span>
              </div>
              <Link to="/register" style={{
                display: 'inline-block', padding: '0.72rem 1.4rem',
                background: 'linear-gradient(135deg,#1E2430,#2C3448)',
                border: '1px solid rgba(180,200,230,0.20)', borderRadius: 12,
                fontFamily: "'Orbitron', monospace", fontSize: '0.58rem', fontWeight: 600,
                color: '#C8D8F0', letterSpacing: '0.12em', textDecoration: 'none',
                transition: 'all 0.22s ease',
              }}>
                REGISTER AGAIN
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
