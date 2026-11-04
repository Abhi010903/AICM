'use client';

import { ArrowLeft, Bot, FileText, LoaderCircle, Mic, Plus, Send, Sparkles, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

interface AssistantAction {
  label: string;
  href: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  metrics?: Array<{ label: string; value: string }>;
  sources?: string[];
  actions?: AssistantAction[];
}

interface AssistantResponse {
  answer?: string;
  error?: string;
  metrics?: Array<{ label: string; value: string }>;
  sources?: string[];
  actions?: AssistantAction[];
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const suggestions = [
  'Give me the latest progress of road projects in Ward 7',
  'Show the open grievances in my constituency',
  'Which assets need maintenance attention?',
  'Summarize development expenditure this year',
  'Show plot details for survey 412/2',
];

const HISTORY_STORAGE_KEY = 'aicm-mla-assistant-history-v1';

export default function MlaAssistantPage() {
  const router = useRouter();
  const { session, role } = useAuth();
  const { language } = useTranslation();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role !== 'president') router.replace('/president');
  }, [role, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]') as unknown;
      if (Array.isArray(stored)) setMessages(stored as Message[]);
    } catch (storageError) {
      console.warn('Failed to restore MLA assistant history', storageError);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages));
    } catch (storageError) {
      console.warn('Failed to save MLA assistant history', storageError);
    }
  }, [historyReady, messages]);

  const startNewChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (storageError) {
      console.warn('Failed to clear MLA assistant history', storageError);
    }
  };

  const submit = async (value = query) => {
    const clean = value.trim();
    if (!clean || isLoading) return;
    setQuery('');
    setError('');
    setMessages((current) => [...current, { id: Date.now(), role: 'user', content: clean }]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/mla-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: clean,
          language,
          session: { role: session?.role, phone: session?.phone },
        }),
      });
      const result = (await response.json()) as AssistantResponse;
      if (!response.ok) throw new Error(result.error || 'The MLA assistant could not answer right now.');
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.answer || 'No answer was returned.',
        metrics: result.metrics,
        sources: result.sources,
        actions: result.actions,
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The MLA assistant could not answer right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = language === 'ml' ? 'ml-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      setQuery(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setError('Voice input could not be captured.');
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-[#1e466d] bg-[#102f4f] p-5 text-white md:flex">
        <button type="button" onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-emerald-300">
          <ArrowLeft className="h-4 w-4" /> Return to MLA portal
        </button>
        <div className="flex items-center gap-2 text-sm font-black"><Bot className="h-5 w-5 text-emerald-300" /> MLA Intelligence</div>
        <button type="button" onClick={startNewChat} className="mt-6 flex items-center gap-2 rounded-lg bg-[#167da3] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d93b9]">
          <Plus className="h-4 w-4" /> New Chat
        </button>
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Suggested queries</p>
        <div className="mt-2 space-y-1">
          {suggestions.slice(0, 4).map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => void submit(suggestion)} className="w-full rounded-lg px-2 py-2 text-left text-xs text-slate-200 hover:bg-[#1e466d] hover:text-emerald-200">
              <FileText className="mr-2 inline h-3.5 w-3.5" /> {suggestion}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
          <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-slate-500 md:hidden">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="hidden items-center gap-2 text-sm font-bold md:flex"><Sparkles className="h-4 w-4 text-emerald-600" /> AICM TWIN · MLA Intelligence Assistant</div>
          <div className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">Authorized MLA session</div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
            {messages.length === 0 && (
              <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#167da3] text-white shadow-lg shadow-[#123b63]/25"><Sparkles className="h-8 w-8" /></div>
                <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">MLA Intelligence Assistant</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-500">Your constituency AI partner for projects, grievances, assets, plots, and development insights.</p>
                <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void submit(suggestion)} className="rounded-xl border border-slate-200 bg-white p-4 text-left text-xs font-semibold text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50">{suggestion}</button>)}
                </div>
              </div>
            )}
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Bot className="h-4 w-4" /></div>}
                  <div className={`max-w-[90%] rounded-2xl p-4 text-sm ${message.role === 'user' ? 'bg-[#167da3] text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>
                    <p className="whitespace-pre-line leading-6">{message.content}</p>
                    {message.metrics && message.metrics.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{message.metrics.map((metric) => <div key={metric.label} className="rounded-lg bg-slate-50 p-2 text-center"><div className="text-[10px] text-slate-500">{metric.label}</div><strong className="text-sm text-slate-900">{metric.value}</strong></div>)}</div>}
                    {message.actions && message.actions.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{message.actions.map((action) => <Link key={action.href} href={action.href} className="rounded-lg bg-[#167da3] px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600">{action.label} <span className="ml-1">→</span></Link>)}</div>}
                    {message.sources && message.sources.length > 0 && <p className="mt-4 border-t border-slate-100 pt-2 text-[10px] text-slate-400">Sources: {message.sources.join(' · ')}</p>}
                  </div>
                  {message.role === 'user' && <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600"><UserRound className="h-4 w-4" /></div>}
                </div>
              ))}
              {isLoading && <div className="flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin text-emerald-600" /> Retrieving authorized constituency data...</div>}
              {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
              <div ref={endRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
            <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }} placeholder="Ask about projects, grievances, expenditure, plots or reports..." className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
              <button type="button" onClick={toggleVoice} className={`rounded-lg p-2 ${isListening ? 'bg-red-100 text-red-600' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Voice input"><Mic className="h-5 w-5" /></button>
              <button type="button" onClick={() => void submit()} disabled={!query.trim() || isLoading} className="rounded-lg bg-[#167da3] p-2 text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-600" aria-label="Send query"><Send className="h-5 w-5" /></button>
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-slate-400">Answers are grounded in authorized constituency data and cite available sources.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
