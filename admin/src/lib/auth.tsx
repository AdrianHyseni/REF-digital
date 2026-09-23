import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, ApiError } from './api';
import type { Role } from './types';

interface AuthUser {
  id: string;
  email: string;
  role: Role;
  profileId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<{ token: string; role: Role; email: string }>('/auth/login', { email, password });
    if (result.role !== 'STAFF') {
      throw new ApiError('This login is for REF staff only. Alumni should use the member app.', 403);
    }
    setToken(result.token);
    const me = await api.get<AuthUser>('/auth/me');
    setUser(me);
    return me;
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
