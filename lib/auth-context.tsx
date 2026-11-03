'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AuthSession,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  setPreviewMode,
} from './auth-service';
import { UserRole } from './types';

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isPreviewMode: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  enterPreviewMode: () => void;
  exitPreviewMode: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isAuthenticated: false,
  role: null,
  isPreviewMode: false,
  login: () => {},
  logout: () => {},
  enterPreviewMode: () => {},
  exitPreviewMode: () => {},
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const current = getAuthSession();
    setSession(current);
    setLoading(false);
  }, []);

  const login = (newSession: AuthSession) => {
    setSession(newSession);
    saveAuthSession(newSession);
    if (newSession.role === 'president') {
      router.push('/president');
    } else {
      router.push('/citizen');
    }
  };

  const logout = () => {
    setSession(null);
    clearAuthSession();
    router.push('/');
  };

  const enterPreviewMode = () => {
    if (session?.role === 'president') {
      const updated = setPreviewMode(true);
      if (updated) {
        setSession(updated);
        router.push('/citizen');
      }
    }
  };

  const exitPreviewMode = () => {
    if (session?.role === 'president') {
      const updated = setPreviewMode(false);
      if (updated) {
        setSession(updated);
        router.push('/president');
      }
    }
  };

  const isAuthenticated = !!session;
  const role = session ? (session.isPreviewMode ? 'citizen' : session.role) : null;
  const isPreviewMode = !!session?.isPreviewMode;

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        role,
        isPreviewMode,
        login,
        logout,
        enterPreviewMode,
        exitPreviewMode,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
