'use client';

import React from 'react';
import { AuthCard } from '@/components/auth/AuthCard';

export default function PresidentAuthPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4 animate-fade-in">
      <AuthCard targetRole="president" />
    </div>
  );
}
