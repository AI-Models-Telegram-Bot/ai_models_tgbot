import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enProfile from './locales/en/profile.json';
import enPackages from './locales/en/packages.json';
import enReferral from './locales/en/referral.json';
import enSubscriptions from './locales/en/subscriptions.json';

import ruCommon from './locales/ru/common.json';
import ruProfile from './locales/ru/profile.json';
import ruPackages from './locales/ru/packages.json';
import ruReferral from './locales/ru/referral.json';
import ruSubscriptions from './locales/ru/subscriptions.json';

const resources = {
  en: {
    common: enCommon,
    profile: enProfile,
    packages: enPackages,
    referral: enReferral,
    subscriptions: enSubscriptions,
  },
  ru: {
    common: ruCommon,
    profile: ruProfile,
    packages: ruPackages,
    referral: ruReferral,
    subscriptions: ruSubscriptions,
  },
};

try {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'profile', 'packages', 'referral', 'subscriptions'],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        // Only use navigator — avoid localStorage/sessionStorage which can throw in
        // restricted WebView environments (Telegram mobile)
        order: ['navigator'],
        caches: [],
        lookupLocalStorage: undefined,
        lookupSessionStorage: undefined,
      },
    });
} catch {
  // Fallback: initialize without LanguageDetector if it crashes in mobile WebView
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'profile', 'packages', 'referral', 'subscriptions'],
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
