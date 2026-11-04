'use client';

import { Bot, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function MlaAssistantAccess() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();

  if (!pathname.startsWith('/president') || pathname === '/president/assistant' || session?.role !== 'president' || session.isPreviewMode) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push('/president/assistant')}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#123b63] px-4 py-3 text-xs font-bold text-white shadow-xl shadow-[#123b63]/30 transition hover:bg-[#0f6b8f] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-300"
      aria-label="Open MLA AI Assistant"
    >
      <Sparkles className="h-4 w-4" />
      <span>AI Assistant</span>
      <Bot className="h-4 w-4" />
    </button>
  );
}
