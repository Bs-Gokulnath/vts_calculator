import { createContext, useContext, useState, ReactNode } from 'react';

export interface AuthUser {
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  token: string | null;
  loginWithGoogle: (accessToken: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

// Allowed emails: any @vtsons.com address OR this specific gmail account
function isAllowed(email: string): boolean {
  const e = email.toLowerCase().trim();
  return e.endsWith('@vtsons.com') || e === 'bharanidharan168@gmail.com';
}

function loadSession(): { isLoggedIn: boolean; user: AuthUser | null; token: string | null } {
  const session = localStorage.getItem('yarnCalcSession');
  if (session !== 'google') return { isLoggedIn: false, user: null, token: null };
  try {
    const user  = JSON.parse(localStorage.getItem('yarnCalcUser')  ?? 'null') as AuthUser | null;
    const token = localStorage.getItem('yarnCalcToken');
    if (!user || !isAllowed(user.email)) return { isLoggedIn: false, user: null, token: null };
    return { isLoggedIn: true, user, token };
  } catch {
    return { isLoggedIn: false, user: null, token: null };
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const init = loadSession();
  const [isLoggedIn, setIsLoggedIn] = useState(init.isLoggedIn);
  const [user,       setUser]       = useState<AuthUser | null>(init.user);
  const [token,      setToken]      = useState<string | null>(init.token);

  async function loginWithGoogle(accessToken: string): Promise<{ ok: boolean; error?: string }> {
    try {
      // Fetch the signed-in user's profile from Google
      const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) return { ok: false, error: 'Could not retrieve your Google account info. Try again.' };

      const profile = await resp.json() as { email: string; name: string; picture?: string };

      if (!isAllowed(profile.email)) {
        return {
          ok: false,
          error: `Access denied for ${profile.email}. Only @vtsons.com accounts are allowed to sign in.`,
        };
      }

      const u: AuthUser = { name: profile.name, email: profile.email, picture: profile.picture };
      localStorage.setItem('yarnCalcSession', 'google');
      localStorage.setItem('yarnCalcUser',    JSON.stringify(u));
      localStorage.setItem('yarnCalcToken',   accessToken);
      setUser(u);
      setToken(accessToken);
      setIsLoggedIn(true);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sign-in failed. Check your internet connection and try again.' };
    }
  }

  function logout() {
    localStorage.removeItem('yarnCalcSession');
    localStorage.removeItem('yarnCalcUser');
    localStorage.removeItem('yarnCalcToken');
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
