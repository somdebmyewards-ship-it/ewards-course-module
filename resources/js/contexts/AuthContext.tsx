import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

function getLevel(points: number): string {
  if (points >= 500) return 'Expert';
  if (points >= 250) return 'Specialist';
  if (points >= 100) return 'Practitioner';
  return 'Beginner';
}

interface User {
  id: number; name: string; email: string; role: string;
  approved: boolean; points: number; level: string; merchant_id?: number; outlet_id?: number;
  merchant_name?: string; outlet_name?: string; designation?: string;
}

interface AuthCtx {
  user: User | null; token: string | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<{ needsApproval: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/me').then(r => {
        const userData = r.data;
        if (!userData.level) userData.level = getLevel(userData.points || 0);
        setUser(userData);
        setLoading(false);
      })
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(null); setLoading(false); });
    } else { setLoading(false); }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const userData = res.data.user;
    if (!userData.level) userData.level = getLevel(userData.points || 0);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.removeItem('ela_greeted');
    setToken(res.data.token);
    setUser(userData);
  };

  const register = async (data: any) => {
    await api.post('/auth/register', data);
    return { needsApproval: false };
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.get('/me');
    const userData = res.data;
    if (!userData.level) userData.level = getLevel(userData.points || 0);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
