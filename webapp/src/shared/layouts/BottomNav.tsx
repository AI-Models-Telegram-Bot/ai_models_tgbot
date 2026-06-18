import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { hapticSelection } from '@/services/telegram/haptic';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
}

// Flat line icons. Single stroke, currentColor — no gradients, no glow.
const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ChatIcon = () => (
  <svg {...iconProps}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V16H5.5A1.5 1.5 0 0 1 4 14.5z" />
  </svg>
);

const PlansIcon = () => (
  <svg {...iconProps}>
    <path d="M3.5 8.5 7 11l5-6 5 6 3.5-2.5L19 18H5z" />
    <path d="M5 18h14" />
  </svg>
);

const UserIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 19.5c0-3.2 3.1-5.5 7-5.5s7 2.3 7 5.5" />
  </svg>
);

const ReferralIcon = () => (
  <svg {...iconProps}>
    <circle cx="7.5" cy="7.5" r="2.75" />
    <circle cx="16.5" cy="7.5" r="2.75" />
    <path d="M3 19c0-2.5 2-4.25 4.5-4.25S12 16.5 12 19" />
    <path d="M12 19c0-2.5 2-4.25 4.5-4.25S21 16.5 21 19" />
  </svg>
);

const navItems: NavItem[] = [
  { path: '/chat', labelKey: 'chat:title', icon: <ChatIcon />, match: (p) => p.startsWith('/chat') },
  { path: '/', labelKey: 'subscriptions:title', icon: <PlansIcon />, match: (p) => p === '/' || p === '/subscriptions' },
  { path: '/profile', labelKey: 'profile:title', icon: <UserIcon />, match: (p) => p.startsWith('/profile') },
  { path: '/referral', labelKey: 'referral:title', icon: <ReferralIcon />, match: (p) => p.startsWith('/referral') },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-bg border-t border-border safe-area-bottom z-50">
      <div className="flex items-stretch justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.match(location.pathname);
          return (
            <button
              key={item.path}
              onClick={() => {
                hapticSelection();
                navigate(item.path);
              }}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-200',
                isActive ? 'text-brand-primary' : 'text-content-tertiary hover:text-content-secondary'
              )}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-primary" />
              )}
              {item.icon}
              <span className={cn('text-[10px] tracking-tight', isActive ? 'font-semibold' : 'font-medium')}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
