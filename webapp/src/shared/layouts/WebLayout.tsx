import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export const WebLayout: React.FC = () => {
  const { t } = useTranslation(['common', 'auth']);
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { to: '/chat', label: 'Chat' },
        { to: '/subscriptions', label: t('common:subscriptions', 'Pricing') },
        { to: '/profile', label: t('common:profile', 'Profile') },
      ]
    : [
        { to: '/pricing', label: t('common:subscriptions', 'Pricing') },
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-bg to-surface-secondary flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-bg/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center" style={{ columnGap: 8 }}>
              <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                <span className="text-brand-primary font-bold text-sm">AI</span>
              </div>
              <span className="text-content-primary font-display font-bold text-lg">VseoNix</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center" style={{ columnGap: 24 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'text-brand-primary'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center" style={{ columnGap: 12 }}>
              {isAuthenticated ? (
                <div className="flex items-center" style={{ columnGap: 12 }}>
                  <span className="text-sm text-content-secondary">
                    {user?.firstName || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-content-secondary hover:text-content-primary transition-colors"
                  >
                    {t('auth:logout', 'Log Out')}
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
                  >
                    {t('auth:login', 'Log In')}
                  </Link>
                  <Link
                    to="/auth/register"
                    className="text-sm font-medium bg-brand-primary text-surface-bg px-4 py-2 rounded-lg hover:bg-brand-primary/90 transition-colors"
                  >
                    {t('auth:register', 'Sign Up')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-content-secondary p-2"
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
            <div className="md:hidden py-4 border-t border-white/5">
              <div className="flex flex-col" style={{ rowGap: 12 }}>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-sm font-medium px-2 py-1 ${
                      location.pathname === link.to
                        ? 'text-brand-primary'
                        : 'text-content-secondary'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-sm text-content-secondary text-left px-2 py-1"
                  >
                    {t('auth:logout', 'Log Out')}
                  </button>
                ) : (
                  <>
                    <Link
                      to="/auth/login"
                      className="text-sm text-content-secondary px-2 py-1"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('auth:login', 'Log In')}
                    </Link>
                    <Link
                      to="/auth/register"
                      className="text-sm text-brand-primary px-2 py-1"
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
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between" style={{ rowGap: 16 }}>
          <span className="text-sm text-content-tertiary">
            &copy; {new Date().getFullYear()} VseoNix AI
          </span>
          <div className="flex items-center" style={{ columnGap: 16 }}>
            <Link to="/pricing" className="text-sm text-content-tertiary hover:text-content-secondary transition-colors">
              {t('common:subscriptions', 'Pricing')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
