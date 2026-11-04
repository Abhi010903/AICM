'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  ArrowRight,
  Building,
  Hospital,
  AlertTriangle,
  FolderGit2,
  Sliders,
  MapPin,
  CheckSquare,
  FileQuestion,
  Layers,
  CornerDownLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { searchSystem, SearchResultItem, SearchCategory } from '@/lib/search-engine';

export const DashboardSearch: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { session, role } = useAuth();
  const { language, t } = useTranslation();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search execution
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      const activeRole = role || 'citizen';
      const hits = searchSystem(query, activeRole, language);
      setResults(hits);
      setSelectedIndex(hits.length > 0 ? 0 : -1);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, role, language]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation: ArrowDown, ArrowUp, Enter, Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    router.push(item.href);
  };

  // Category Icon resolver
  const getCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'ward':
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
      case 'facility':
        return <Hospital className="w-3.5 h-3.5 text-emerald-500" />;
      case 'parcel':
        return <MapPin className="w-3.5 h-3.5 text-purple-500" />;
      case 'asset':
        return <Building className="w-3.5 h-3.5 text-amber-500" />;
      case 'project':
        return <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />;
      case 'budget':
        return <Sliders className="w-3.5 h-3.5 text-rose-500" />;
      case 'hazard':
      case 'evacuation':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case 'service':
        return <CheckSquare className="w-3.5 h-3.5 text-teal-500" />;
      default:
        return <Search className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const isPresident = role === 'president';

  return (
    <div ref={searchContainerRef} className={`relative w-full max-w-lg ${className}`}>
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isPresident
              ? language === 'ml'
                ? 'വാർഡുകൾ, ആസ്തികൾ, പദ്ധതികൾ, ബജറ്റ്, ദുരന്തം...'
                : 'Search wards, assets, facilities, projects, budget, hazard...'
              : language === 'ml'
              ? 'സേവന കേന്ദ്രങ്ങൾ, ഭൂമി പരിശോധന, ക്യാമ്പുകൾ, പദ്ധതികൾ...'
              : 'Search facilities, land check, hazard shelters, ward works...'
          }
          className="w-full pl-9 pr-8 py-2 bg-slate-800/90 text-white placeholder-slate-400 text-xs rounded-xl border border-slate-700/80 focus:bg-slate-800 focus:border-coconut-500 focus:ring-2 focus:ring-coconut-500/20 focus:outline-none transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            aria-label="Clear search query"
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-900 animate-fade-in max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold">
              {language === 'ml'
                ? `&ldquo;${query}&rdquo; — ${results.length} ഫലങ്ങൾ`
                : `${results.length} result${results.length === 1 ? '' : 's'} for \u201c${query}\u201d`}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <CornerDownLeft className="w-3 h-3" /> {language === 'ml' ? 'തുറക്കാൻ' : 'to navigate'}
            </span>
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="p-1.5 space-y-1">
              {results.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${
                    selectedIndex === idx ? 'bg-coconut-50 border border-coconut-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-slate-100 mt-0.5 flex-shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                      {item.badge && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex-shrink-0 border border-slate-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mt-1">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 self-center flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            /* No Results Empty State */
            <div className="p-6 text-center text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">No matching records found</p>
              <p className="text-[11px] text-slate-400">
                {isPresident
                  ? 'Try searching by ward number, asset type, project code, or parcel survey.'
                  : 'Try searching for healthcare, schools, plot survey numbers, or emergency shelters.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
