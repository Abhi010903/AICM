'use client';

import React from 'react';
import { Eye, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export const PreviewModeBanner: React.FC = () => {
  const { isPreviewMode, exitPreviewMode } = useAuth();

  if (!isPreviewMode) return null;

  return (
    <div className="relative z-40 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2 shadow-md flex items-center justify-between text-xs animate-fade-in border-t border-amber-500/30">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded bg-amber-900/60 flex items-center justify-center">
          <Eye className="w-4 h-4 text-amber-200" />
        </span>
        <div className="leading-tight">
          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-200 block">
            Presidential Citizen Preview Mode
          </span>
          <span className="font-medium">
            You are exploring citizen-facing services. Your President session is preserved.
          </span>
        </div>
      </div>

      <button
        onClick={exitPreviewMode}
        className="px-3 py-1.5 rounded-lg bg-white text-amber-900 hover:bg-amber-100 font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to President Dashboard</span>
      </button>
    </div>
  );
};
