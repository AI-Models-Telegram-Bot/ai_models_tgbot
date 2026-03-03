import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  Users,
  Zap,
  DollarSign,
  FileText,
  Send,
  Terminal,
  Server,
  Wallet,
  Settings,
  LogOut,
  Shield,
  TrendingUp,
} from 'lucide-react';
import LanguageToggle from './LanguageToggle';

export default function Sidebar() {
  const { admin, logout } = useAuthStore();
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/users', icon: Users, label: t('sidebar.users') },
    { to: '/generations', icon: Zap, label: t('sidebar.generations') },
    { to: '/trends', icon: TrendingUp, label: t('sidebar.trends') },
    { to: '/revenue', icon: DollarSign, label: t('sidebar.revenue') },
    { to: '/providers', icon: Server, label: t('sidebar.providers') },
    { to: '/audit-logs', icon: FileText, label: t('sidebar.auditLogs') },
    { to: '/broadcasts', icon: Send, label: t('sidebar.broadcasts') },
    { to: '/withdrawals', icon: Wallet, label: t('sidebar.withdrawals') },
    { to: '/logs', icon: Terminal, label: t('sidebar.systemLogs') },
    { to: '/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">{t('sidebar.adminPanel')}</h1>
            <p className="text-xs text-gray-500">{t('sidebar.aiModelsBot')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Admin info + logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
            {admin?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin?.username}</p>
            <p className="text-xs text-gray-500">{admin?.role}</p>
          </div>
        </div>
        <LanguageToggle />
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors mt-1"
        >
          <LogOut size={16} />
          {t('sidebar.signOut')}
        </button>
      </div>
    </aside>
  );
}
