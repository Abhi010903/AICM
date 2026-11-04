'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { translations } from './i18n-dictionary';
import { getLanguagePreference, setLanguagePreference } from './demo-store';
import { Language } from './types';
import { translateGrievanceDescription } from './grievance-translation';

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
  getLocalizedDescription: (item: any) => string;
  getLocalizedStatus: (status?: string) => string;
  getLocalizedCondition: (condition?: string) => string;
  getLocalizedType: (type?: string) => string;
  getLocalizedCategory: (category?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  getLocalizedName: (item: any) => (item ? item.name_en || item.title_en || '' : ''),
  getLocalizedDescription: (item: any) => (item ? item.description_en || item.details_en || '' : ''),
  getLocalizedStatus: (status?: string) => status || '',
  getLocalizedCondition: (condition?: string) => condition || '',
  getLocalizedType: (type?: string) => type || '',
  getLocalizedCategory: (category?: string) => category || '',
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
    const dict = (translations[language] as Record<string, string>) || translations.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const enDict = translations.en as Record<string, string>;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  const getLocalizedName = (item: any): string => {
    if (!item) return '';
    if (language === 'ml') {
      return item.name_ml || item.title_ml || item.village_ml || item.name_en || item.title_en || item.village_en || '';
    }
    return item.name_en || item.title_en || item.village_en || item.name_ml || item.title_ml || '';
  };

  const getLocalizedDescription = (item: any): string => {
    if (!item) return '';
    if (language === 'ml') {
      const malayalam = item.description_ml || item.details_ml;
      const english = item.description_en || item.details_en || '';
      return malayalam && malayalam !== english
        ? malayalam
        : translateGrievanceDescription(english, 'ml');
    }
    const english = item.description_en || item.details_en;
    const malayalam = item.description_ml || item.details_ml || '';
    return english && english !== malayalam
      ? english
      : translateGrievanceDescription(malayalam, 'en');
  };

  const getLocalizedStatus = (status?: string): string => {
    if (!status) return '';
    const key = `status_${status.toLowerCase().replace(/\s+/g, '_')}`;
    return t(key, status);
  };

  const getLocalizedCondition = (condition?: string): string => {
    if (!condition) return '';
    const key = `cond_${condition.toLowerCase()}`;
    return t(key, condition);
  };

  const getLocalizedType = (type?: string): string => {
    if (!type) return '';
    const key = `type_${type.toLowerCase().replace(/\s+/g, '_')}`;
    return t(key, type);
  };

  const getLocalizedCategory = (cat?: string): string => {
    if (!cat) return '';
    const key = `cat_${cat.toLowerCase().replace(/\s+/g, '_')}`;
    return t(key, cat);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider
        value={{
          language,
          setLanguage: handleSetLanguage,
          t,
          getLocalizedName,
          getLocalizedDescription,
          getLocalizedStatus,
          getLocalizedCondition,
          getLocalizedType,
          getLocalizedCategory,
        }}
      >
        {children}
      </I18nContext.Provider>
    </I18nextProvider>
  );
};

export const useTranslation = () => useContext(I18nContext);
