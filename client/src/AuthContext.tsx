import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

type User = { id: string; email: string; name: string } | null;
type AuthCtx = { user: User; loading: boolean; login: (e: string, p: string) => Promise<void>; logout: () => void };

const AuthContext = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.me().then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
