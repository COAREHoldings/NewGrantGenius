'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle NextAuth session (OAuth login)
    if (status === 'authenticated' && session?.user) {
      const sessionUser = session.user as { id?: string; email?: string | null; name?: string | null; role?: string };
      setUser({
        id: parseInt(sessionUser.id || '0'),
        email: sessionUser.email || '',
        name: sessionUser.name || '',
        role: sessionUser.role || 'owner',
      });
      setToken('nextauth-session');
      setIsLoading(false);
      return;
    }

    // Handle traditional JWT auth
    if (status === 'unauthenticated' || status === 'loading') {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setUser(data.user);
              setToken(savedToken);
            } else {
              localStorage.removeItem('token');
            }
          })
          .catch(() => localStorage.removeItem('token'))
          .finally(() => setIsLoading(false));
      } else if (status !== 'loading') {
        setIsLoading(false);
      }
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const logout = async () => {
    // Sign out from NextAuth if using OAuth
    if (token === 'nextauth-session') {
      await nextAuthSignOut({ redirect: false });
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const resetPassword = async (email: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, resetPassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
