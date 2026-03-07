/**
 * Google Sign-In button — isolated so useGoogleLogin hook only
 * runs when GoogleOAuthProvider is present in the tree.
 */
import { useGoogleLogin } from '@react-oauth/google';

export default function GoogleSignInButton({ onSuccess, onError, label = 'Continue with Google', disabled }) {
  const triggerGoogle = useGoogleLogin({ onSuccess, onError, flow: 'implicit' });

  return (
    <button
      type="button"
      onClick={() => !disabled && triggerGoogle()}
      disabled={disabled}
      style={{
        width: '100%', padding: '0.80rem 1.2rem', marginBottom: '1.2rem',
        background: 'rgba(12,15,24,0.55)',
        border: '1px solid rgba(180,200,230,0.13)',
        borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.72rem',
        transition: 'all 0.22s ease', position: 'relative', overflow: 'hidden',
        opacity: disabled ? 0.5 : 1, boxShadow: 'none',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.055)'; e.currentTarget.style.borderColor = 'rgba(210,225,255,0.26)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(140,170,220,0.07)'; }}}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(12,15,24,0.55)'; e.currentTarget.style.borderColor = 'rgba(180,200,230,0.13)'; e.currentTarget.style.boxShadow = 'none'; }}}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,220,255,0.10), transparent)' }} />
      <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.61rem', fontWeight: 500, color: '#8A9BB5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </button>
  );
}
