import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { authApi } from '../api/client';

type User = { id: string; email: string; firstName: string; lastName: string; role: string } | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('crm_token');
    const saved = localStorage.getItem('crm_user');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
    try {
      const me = await authApi.me();
      setUser(me);
      localStorage.setItem('crm_user', JSON.stringify(me));
    } catch {
      setUser(null);
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('crm_token', res.access_token);
    localStorage.setItem('crm_user', JSON.stringify(res.user));
    flushSync(() => setUser(res.user));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
