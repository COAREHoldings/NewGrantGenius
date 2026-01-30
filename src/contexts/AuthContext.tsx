'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

// Demo user for testing
const DEMO_USER: User = {
  id: 1,
  email: 'demo@grantgenius.com',
  name: 'Demo User',
  role: 'owner',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(DEMO_USER);
  const [token] = useState<string | null>('demo-token');
  const [isLoading] = useState(false);

  const login = async () => {
    // Demo mode - always logged in
  };

  const register = async () => {
    // Demo mode - always logged in
  };

  const logout = () => {
    // Demo mode - no logout
  };

  const resetPassword = async () => {
    // Demo mode - no-op
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