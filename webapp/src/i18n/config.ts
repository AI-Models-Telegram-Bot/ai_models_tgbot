import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enProfile from './locales/en/profile.json';
import enPackages from './locales/en/packages.json';
import enReferral from './locales/en/referral.json';

import ruCommon from './locales/ru/common.json';
import ruProfile from './locales/ru/profile.json';
import ruPackages from './locales/ru/packages.json';
import ruReferral from './locales/ru/referral.json';

const resources = {
  en: {
    common: enCommon,
    profile: enProfile,
    packages: enPackages,
    referral: enReferral,
  },
  ru: {
    common: ruCommon,
    profile: ruProfile,
    packages: ruPackages,
    referral: ruReferral,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'profile', 'packages', 'referral'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'navigator'],
      caches: [],
    },
  });

export default i18n;
