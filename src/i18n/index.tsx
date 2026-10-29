import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { formatDate, formatMoney, formatNumber, monthLabel } from '@/lib/format';

import de from './locales/de';
import en, { type Translation, type TranslationKey } from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import it from './locales/it';
import pt from './locales/pt';
import ru from './locales/ru';
import tr from './locales/tr';

export type LanguageCode = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';
export type LanguageChoice = LanguageCode | 'system';

const TRANSLATIONS: Record<LanguageCode, Translation> = { en, tr, de, fr, es, it, pt, ru };

// Each language written in itself, so anyone can find their own in the list
export const LANGUAGES: { code: LanguageCode; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
];

const STORAGE_KEY = 'fuel-tracker/language';

// Notifications and number formatting live outside React, so I keep the active language here too
let activeLanguage: LanguageCode = 'en';

export function setActiveLanguage(code: LanguageCode) {
  activeLanguage = code;
}

export function getActiveLanguage() {
  return activeLanguage;
}

type Params = Record<string, string | number>;

export function translate(key: TranslationKey, params?: Params) {
  return translateIn(activeLanguage, key, params);
}

function translateIn(language: LanguageCode, key: TranslationKey, params?: Params) {
  let text = TRANSLATIONS[language][key] ?? en[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}

function isSupported(code: string | null | undefined): code is LanguageCode {
  return !!code && code in TRANSLATIONS;
}

// The helpers are rebuilt for every language on purpose. The React Compiler caches
// calls by their inputs, so a plain shared t() would keep showing the old language.
function makeHelpers(language: LanguageCode) {
  return {
    t: (key: TranslationKey, params?: Params) => translateIn(language, key, params),
    number: (value: number, digits = 0) => formatNumber(value, digits, language),
    money: (value: number) => formatMoney(value, language),
    date: (text: string) => formatDate(text, language),
    month: (key: string) => monthLabel(key, language),
  };
}

type I18nContextValue = ReturnType<typeof makeHelpers> & {
  language: LanguageCode;
  choice: LanguageChoice;
  setChoice: (choice: LanguageChoice) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locales = useLocales();
  const [choice, setChoiceState] = useState<LanguageChoice | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setChoiceState(isSupported(saved) ? saved : 'system'))
      .catch(() => setChoiceState('system'));
  }, []);

  if (!choice) return null;

  const phoneLanguage = locales[0]?.languageCode;
  const language: LanguageCode =
    choice === 'system' ? (isSupported(phoneLanguage) ? phoneLanguage : 'en') : choice;
  // Safe to do while rendering: it only ever sets the same value for the same choice
  setActiveLanguage(language);

  function setChoice(next: LanguageChoice) {
    setChoiceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  return (
    <I18nContext.Provider value={{ ...makeHelpers(language), language, choice, setChoice }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
