'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './i18n-dictionary';
import { getLanguagePreference, setLanguagePreference } from './demo-store';
import { Language } from './types';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  getLocalizedName: (item: any) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  getLocalizedName: (item: any) => (item ? item.name_en || item.title_en || '' : ''),
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = getLanguagePreference();
    setLangState(saved);
    setMounted(true);
    if (saved === 'ml') {
      document.documentElement.lang = 'ml';
      document.body.classList.add('font-malayalam');
    } else {
      document.documentElement.lang = 'en';
      document.body.classList.remove('font-malayalam');
    }
  }, []);

  const handleSetLanguage = (newLang: Language) => {
    setLangState(newLang);
    setLanguagePreference(newLang);
    if (newLang === 'ml') {
      document.documentElement.lang = 'ml';
      document.body.classList.add('font-malayalam');
    } else {
      document.documentElement.lang = 'en';
      document.body.classList.remove('font-malayalam');
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] as Record<string, string>;
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = translations.en as Record<string, string>;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  const getLocalizedName = (item: any): string => {
    if (!item) return '';
    if (language === 'ml') {
      return item.name_ml || item.title_ml || item.village_ml || item.name_en || item.title_en || '';
    }
    return item.name_en || item.title_en || item.village_en || '';
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        getLocalizedName,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
