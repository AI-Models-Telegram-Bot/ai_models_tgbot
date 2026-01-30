import { en, Locale } from './en';
import { ru } from './ru';

export type Language = 'en' | 'ru';

const locales: Record<Language, Locale> = {
  en,
  ru,
};

export function t(lang: Language, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = locales[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      value = locales.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = (value as Record<string, unknown>)[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace params
  if (params) {
    let result = value;
    for (const [param, val] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(val));
    }
    return result;
  }

  return value;
}

export function getLocale(lang: Language): Locale {
  return locales[lang] || locales.en;
}

export { en, ru };
export type { Locale };
