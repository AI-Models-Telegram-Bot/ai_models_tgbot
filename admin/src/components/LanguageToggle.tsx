import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.startsWith('ru') ? 'ru' : 'en';

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'en' ? 'ru' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
    >
      <Globe size={16} />
      <span className="flex gap-1">
        <span className={currentLang === 'en' ? 'text-white font-medium' : 'text-gray-500'}>
          {t('language.en')}
        </span>
        <span className="text-gray-600">/</span>
        <span className={currentLang === 'ru' ? 'text-white font-medium' : 'text-gray-500'}>
          {t('language.ru')}
        </span>
      </span>
    </button>
  );
}
