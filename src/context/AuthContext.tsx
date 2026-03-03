import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, type AuthUser } from '@/lib/api';
import { AUTH_STORAGE_KEY, AUTH_USER_KEY } from '@/lib/api';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((me) => {
        setUser(me);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token, user: nextUser } = await authApi.login(email, password);
      localStorage.setItem(AUTH_STORAGE_KEY, access_token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
