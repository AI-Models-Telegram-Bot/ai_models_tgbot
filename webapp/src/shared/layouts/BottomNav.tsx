import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { hapticSelection } from '@/services/telegram/haptic';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
}

const UserIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CrownIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 16l2-8 5 4 5-4 2 8H5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 16h14" />
  </svg>
);

const HandshakeIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const navItems: NavItem[] = [
  { path: '/', labelKey: 'subscriptions:title', icon: <CrownIcon /> },
  { path: '/profile', labelKey: 'profile:title', icon: <UserIcon /> },
  { path: '/referral', labelKey: 'referral:title', icon: <HandshakeIcon /> },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-bg/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                hapticSelection();
                navigate(item.path);
              }}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive ? 'text-brand-primary' : 'text-content-tertiary'
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium mt-1">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
