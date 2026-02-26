import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enAdmin from './locales/en/admin.json';
import ruAdmin from './locales/ru/admin.json';

const resources = {
  en: { admin: enAdmin },
  ru: { admin: ruAdmin },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'admin',
    ns: ['admin'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'admin_i18nextLng',
    },
  });

export default i18n;
