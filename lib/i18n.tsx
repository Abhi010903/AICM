'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { translations } from './i18n-dictionary';
import { getLanguagePreference, setLanguagePreference } from './demo-store';
import { Language } from './types';

// Initialize standard i18next instance configured with react-i18next
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: translations.en },
      ml: { translation: translations.ml },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

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

  useEffect(() => {
    const saved = getLanguagePreference();
    setLangState(saved);
    i18n.changeLanguage(saved);
    if (typeof document !== 'undefined') {
      if (saved === 'ml') {
        document.documentElement.lang = 'ml';
        document.body.classList.add('font-malayalam');
      } else {
        document.documentElement.lang = 'en';
        document.body.classList.remove('font-malayalam');
      }
    }
  }, []);

  const handleSetLanguage = (newLang: Language) => {
    setLangState(newLang);
    setLanguagePreference(newLang);
    i18n.changeLanguage(newLang);
    if (typeof document !== 'undefined') {
      if (newLang === 'ml') {
        document.documentElement.lang = 'ml';
        document.body.classList.add('font-malayalam');
      } else {
        document.documentElement.lang = 'en';
        document.body.classList.remove('font-malayalam');
      }
    }
  };

  const t = (key: string, fallback?: string): string => {
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
    const dict = (translations[language] as Record<string, string>) || translations.en;
    if (dict && dict[key]) {
      return dict[key];
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
    <I18nextProvider i18n={i18n}>
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
    </I18nextProvider>
  );
};

export const useTranslation = () => useContext(I18nContext);
