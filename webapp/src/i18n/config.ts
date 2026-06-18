import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enProfile from './locales/en/profile.json';
import enPackages from './locales/en/packages.json';
import enReferral from './locales/en/referral.json';
import enSubscriptions from './locales/en/subscriptions.json';
import enAudio from './locales/en/audio.json';
import enImage from './locales/en/image.json';
import enVideo from './locales/en/video.json';
import enAuth from './locales/en/auth.json';
import enChat from './locales/en/chat.json';
import enCreate from './locales/en/create.json';

import ruCommon from './locales/ru/common.json';
import ruProfile from './locales/ru/profile.json';
import ruPackages from './locales/ru/packages.json';
import ruReferral from './locales/ru/referral.json';
import ruSubscriptions from './locales/ru/subscriptions.json';
import ruAudio from './locales/ru/audio.json';
import ruImage from './locales/ru/image.json';
import ruVideo from './locales/ru/video.json';
import ruAuth from './locales/ru/auth.json';
import ruChat from './locales/ru/chat.json';
import ruCreate from './locales/ru/create.json';

// Ensure Russian is the default language when no explicit choice has been saved.
// LanguageDetector would otherwise pick the browser's navigator language (often 'en').
try {
  if (!localStorage.getItem('i18nextLng')) {
    localStorage.setItem('i18nextLng', 'ru');
  }
} catch {
  // localStorage may throw in restrictive WebView environments — ignore
}

const resources = {
  en: {
    common: enCommon,
    profile: enProfile,
    packages: enPackages,
    referral: enReferral,
    subscriptions: enSubscriptions,
    audio: enAudio,
    image: enImage,
    video: enVideo,
    auth: enAuth,
    chat: enChat,
    create: enCreate,
  },
  ru: {
    common: ruCommon,
    profile: ruProfile,
    packages: ruPackages,
    referral: ruReferral,
    subscriptions: ruSubscriptions,
    audio: ruAudio,
    image: ruImage,
    video: ruVideo,
    auth: ruAuth,
    chat: ruChat,
    create: ruCreate,
  },
};

try {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'ru',
      defaultNS: 'common',
      ns: ['common', 'profile', 'packages', 'referral', 'subscriptions', 'audio', 'image', 'video', 'auth', 'chat', 'create'],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        // Only use navigator — avoid localStorage/sessionStorage which can throw in
        // restricted WebView environments (Telegram mobile)
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
    });
} catch {
  // Fallback: initialize without LanguageDetector if it crashes in mobile WebView
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'ru',
      fallbackLng: 'ru',
      defaultNS: 'common',
      ns: ['common', 'profile', 'packages', 'referral', 'subscriptions', 'audio', 'image', 'video', 'auth', 'chat', 'create'],
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
