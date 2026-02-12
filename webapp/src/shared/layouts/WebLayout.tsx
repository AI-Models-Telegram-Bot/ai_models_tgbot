import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export const WebLayout: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'auth']);
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { to: '/create', label: t('common:create'), icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )},
        { to: '/subscriptions', label: t('common:subscriptions', 'Pricing'), icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )},
        { to: '/profile', label: t('common:profile', 'Profile'), icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )},
      ]
    : [
        { to: '/pricing', label: t('common:subscriptions', 'Pricing'), icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )},
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userName = user?.firstName || user?.email?.split('@')[0] || 'User';

  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  const toggleLanguage = () => {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-bg to-surface-secondary flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(15,15,35,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0" style={{ columnGap: 10 }}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center shadow-neon">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-white font-display font-bold text-lg">VseoNix</span>
            </Link>

            {/* Desktop Nav — center */}
            <nav className="hidden md:flex items-center bg-surface-card/60 rounded-xl border border-white/[0.06] p-1" style={{ columnGap: 2 }}>
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-primary/15 text-brand-primary shadow-sm'
                        : 'text-content-secondary hover:text-white hover:bg-white/[0.04]'
                    }`}
                    style={{ columnGap: 6 }}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth section + lang — right */}
            <div className="hidden md:flex items-center" style={{ columnGap: 10 }}>
              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-surface-card/40 text-xs font-semibold text-content-secondary hover:text-white hover:border-white/[0.12] transition-all"
                style={{ columnGap: 4 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
                {currentLang === 'ru' ? 'RU' : 'EN'}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center" style={{ columnGap: 10 }}>
                  <div className="flex items-center bg-surface-card/60 rounded-xl px-3 py-1.5 border border-white/[0.06]" style={{ columnGap: 8 }}>
                    <div className="w-7 h-7 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                      <span className="text-brand-primary text-xs font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-content-secondary font-medium">
                      {userName}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-content-tertiary hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.04]"
                    title={t('auth:logout', 'Log Out')}
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center" style={{ columnGap: 8 }}>
                  <Link
                    to="/auth/login"
                    className="text-sm font-medium text-content-secondary hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]"
                  >
                    {t('auth:login', 'Log In')}
                  </Link>
                  <Link
                    to="/auth/register"
                    className="text-sm font-semibold bg-brand-primary text-surface-bg px-5 py-2 rounded-xl hover:bg-brand-primary-light transition-colors"
                  >
                    {t('auth:register', 'Sign Up')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-content-secondary p-2 rounded-lg hover:bg-white/[0.04]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-white/[0.06]">
              <div className="flex flex-col" style={{ rowGap: 2 }}>
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'text-brand-primary bg-brand-primary/10'
                          : 'text-content-secondary hover:text-white hover:bg-white/[0.04]'
                      }`}
                      style={{ columnGap: 8 }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  );
                })}
                {/* Language toggle — mobile */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center text-sm font-medium text-content-secondary px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                  style={{ columnGap: 8 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  {currentLang === 'ru' ? 'English' : 'Русский'}
                </button>
                <div className="h-px bg-white/[0.06] my-2" />
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center text-sm text-content-tertiary hover:text-white text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                    style={{ columnGap: 8 }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('auth:logout', 'Log Out')}
                  </button>
                ) : (
                  <>
                    <Link
                      to="/auth/login"
                      className="text-sm text-content-secondary px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('auth:login', 'Log In')}
                    </Link>
                    <Link
                      to="/auth/register"
                      className="text-sm font-semibold text-brand-primary px-3 py-2.5 rounded-lg hover:bg-brand-primary/10 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('auth:register', 'Sign Up')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between" style={{ rowGap: 16 }}>
          <div className="flex items-center" style={{ columnGap: 8 }}>
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">AI</span>
            </div>
            <span className="text-sm text-content-tertiary">
              &copy; {new Date().getFullYear()} VseoNix AI
            </span>
          </div>
          <div className="flex items-center" style={{ columnGap: 20 }}>
            <Link to="/pricing" className="text-sm text-content-tertiary hover:text-content-secondary transition-colors">
              {t('common:subscriptions', 'Pricing')}
            </Link>
            <a href="https://t.me/vseonix_support" target="_blank" rel="noopener noreferrer" className="text-sm text-content-tertiary hover:text-content-secondary transition-colors">
              {t('common:support', 'Support')}
            </a>
            <Link to="/terms" className="text-sm text-content-tertiary hover:text-content-secondary transition-colors">
              {t('common:terms', 'Terms')}
            </Link>
            <Link to="/privacy" className="text-sm text-content-tertiary hover:text-content-secondary transition-colors">
              {t('common:privacy', 'Privacy')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
