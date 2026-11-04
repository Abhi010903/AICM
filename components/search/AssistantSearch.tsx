'use client';

import Link from 'next/link';
import { ArrowRight, Bot, LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export function AssistantSearch({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const { language } = useTranslation();
  const { session, role } = useAuth();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const submit = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery || isLoading) return;
    setIsOpen(true);
    setIsLoading(true);
    setError('');
    setAnswer('');
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQuery,
          language,
          session: role === 'citizen' ? {
            role,
            phone: session?.phone,
            profileWardId: session?.profileWardId,
          } : null,
        }),
      });
      const result = (await response.json()) as { answer?: string; error?: string; requiresLogin?: boolean };
      if (!response.ok) throw new Error(result.error || 'The assistant could not answer right now.');
      setAnswer(result.answer || '');
      setRequiresLogin(Boolean(result.requiresLogin));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not answer right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setQuery('');
    setAnswer('');
    setError('');
    setRequiresLogin(false);
  };

  const inputClass = dark
    ? 'bg-slate-800/90 text-white placeholder-slate-400 border-slate-700/80 focus:bg-slate-800 focus:border-coconut-500 focus:ring-coconut-500/20'
    : 'bg-slate-100 text-slate-700 placeholder-slate-400 border-transparent focus:bg-white focus:ring-emerald-300';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? 'text-slate-400' : 'text-slate-400'}`} />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submit();
            }
            if (event.key === 'Escape') setIsOpen(false);
          }}
          placeholder={language === 'ml' ? 'AICM-യോട് ചോദിക്കുക...' : 'Ask AICM anything...'}
          className={`w-full rounded-xl border py-2 pl-9 pr-16 text-xs outline-none ring-2 ring-transparent transition ${inputClass}`}
          aria-label="Ask the AICM assistant"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading && <LoaderCircle className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
          {query && !isLoading && (
            <button type="button" onClick={clear} aria-label="Clear assistant query" className={dark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (isLoading || answer || error) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl">
          {isLoading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
              <Bot className="h-4 w-4 text-emerald-600" /> Thinking about your question...
            </div>
          ) : error ? (
            <p className="py-2 text-xs text-red-600">{error}</p>
          ) : (
            <>
              <p className="whitespace-pre-line text-xs leading-5 text-slate-700">{answer}</p>
              {requiresLogin && (
                <Link href="/auth/citizen" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  Log in as citizen <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
