'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchApi } from './api';

export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  studentProfile?: any;
  teacherProfile?: any;
}

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER';
  rollNumber?: string;
  employeeId?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {}
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const initAuth = async () => {
    try {
      const storedToken = localStorage.getItem('academiq_token');
      if (storedToken) {
        const res = await fetchApi('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
          setLoading(false);
          return;
        }
      }
      // No valid token — redirect to login (unless already there)
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/login');
      }
    } catch {
      localStorage.removeItem('academiq_token');
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    localStorage.setItem('academiq_token', data.data.accessToken);
    localStorage.setItem('academiq_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    router.replace(data.data.user.role === 'TEACHER' ? '/teacher' : '/dashboard');
  };

  const register = async (payload: RegisterPayload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    localStorage.setItem('academiq_token', data.data.accessToken);
    localStorage.setItem('academiq_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    router.replace(data.data.user.role === 'TEACHER' ? '/teacher' : '/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('academiq_token');
    localStorage.removeItem('academiq_user');
    setUser(null);
    router.replace('/login');
  };

  const refreshUser = async () => {
    try {
      const res = await fetchApi('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
