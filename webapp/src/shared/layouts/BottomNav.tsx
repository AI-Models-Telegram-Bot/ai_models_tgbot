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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="userGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="8" r="4.5" fill="url(#userGrad)" opacity="0.9" />
    <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="url(#userGrad)" opacity="0.7" />
  </svg>
);

const CrownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="crownGrad" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fbbf24" />
        <stop offset="1" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    <path d="M3 17l2.5-9L10 12l2-6 2 6 4.5-4L21 17H3z" fill="url(#crownGrad)" opacity="0.9" />
    <rect x="3" y="17" width="18" height="2.5" rx="1.25" fill="url(#crownGrad)" opacity="0.7" />
  </svg>
);

const HandshakeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="refGrad" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <circle cx="8" cy="7" r="3" fill="url(#refGrad)" opacity="0.9" />
    <circle cx="16" cy="7" r="3" fill="url(#refGrad)" opacity="0.9" />
    <path d="M2 20c0-2.761 2.686-5 6-5 1.075 0 2.088.216 3 .6" fill="url(#refGrad)" opacity="0.6" />
    <path d="M22 20c0-2.761-2.686-5-6-5-1.075 0-2.088.216-3 .6" fill="url(#refGrad)" opacity="0.6" />
    <path d="M9 18.5l2-1.5 2 1.5 2-1.5" stroke="url(#refGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
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
                'flex flex-col items-center justify-center flex-1 h-full transition-all',
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
