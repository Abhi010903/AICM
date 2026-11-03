'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/shared');

  const redirectTo = loading || isPublic
    ? null
    : !isAuthenticated || !session
    ? pathname.startsWith('/president')
      ? '/auth/president'
      : pathname.startsWith('/citizen')
      ? '/auth/citizen'
      : '/'
    : pathname.startsWith('/president') && session.role !== 'president'
    ? '/citizen'
    : null;

  const authorized = !loading && redirectTo === null;

  useEffect(() => {
    if (redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-[3px] border-coconut-600 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Verifying authorized access...</span>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
};
