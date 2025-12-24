
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { translateText } from '@/ai/flows/translate-text';
import { languages, Language } from '@/lib/languages';

type LanguageContextType = {
  language: string;
  setLanguage: (language: string) => void;
  t: (text: string | string[]) => Promise<string | string[]>;
  availableLanguages: Language[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>('en');

  const setLanguage = (langCode: string) => {
    setLanguageState(langCode);
  };

  const t = useCallback(async (text: string | string[]): Promise<string | string[]> => {
    if (language === 'en') {
      return text;
    }
    const langName = languages.find(l => l.code === language)?.name || 'English';
    const result = await translateText({ text, targetLanguage: langName });
    return result.translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages: languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
