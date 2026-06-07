import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function SignInScreen() {
  const { loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async tokenResponse => {
      setLoading(true);
      setError('');
      const result = await loginWithGoogle(tokenResponse.access_token);
      setLoading(false);
      if (!result.ok) setError(result.error ?? 'Sign-in failed. Try again.');
    },
    onError: () => {
      setLoading(false);
      setError('Google sign-in was cancelled or failed.');
    },
  });

  return (
    <div
      className="min-h-[100dvh] relative flex flex-col items-center justify-center overflow-hidden px-5"
      style={{ background: 'var(--bg)' }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn-icon absolute top-5 right-5 z-20"
        aria-label="Toggle theme"
      >
        {theme === 'dark'
          ? <Sun size={20} style={{ color: 'var(--text-muted)' }} />
          : <Moon size={20} style={{ color: 'var(--text-muted)' }} />
        }
      </button>

      {/* Brand */}
      <div className="relative z-10 flex flex-col items-center mb-10 text-center">
        <div
          className="w-20 h-20 mb-5 rounded-[28px] flex items-center justify-center shadow-lg"
          style={{
            background: 'var(--accent)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="text-4xl select-none">🧵</span>
        </div>
        <h1
          className="text-[28px] font-black tracking-tight leading-tight"
          style={{ color: 'var(--text)' }}
        >
          Yarn Cost<br />Calculator
        </h1>
        <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          VT Sons &nbsp;·&nbsp; Professional Pricing Tool
        </p>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-[28px] p-8 animate-pop"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="mb-7 text-center">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Welcome back</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sign in to your account to continue
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => { setError(''); googleLogin(); }}
          className="w-full h-14 flex items-center justify-center gap-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-hard)',
            color: 'var(--text)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {loading
            ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            : <GoogleIcon />}
          {loading ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        {error && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2.5 animate-fade-in"
            style={{ background: '#FFF1F2', border: '1px solid #FECDD3' }}
          >
            <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
            <p className="text-xs text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck size={13} className="text-emerald-500" />
          <span className="text-[11px]">Restricted to @vtyarns.com accounts</span>
        </div>
      </div>

      <p className="relative z-10 mt-8 text-[11px]" style={{ color: 'var(--text-faint)' }}>
        © 2025 VT Sons. All rights reserved.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
