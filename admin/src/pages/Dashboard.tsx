import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { Users, Zap, DollarSign, CreditCard, Activity, Database, Cpu, Clock } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const RANGES = ['24h', '7d', '30d', 'all'] as const;
const PIE_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState<string>('30d');

  const { data: stats } = useQuery({
    queryKey: ['admin-stats', range],
    queryFn: () => api.get(`/stats?range=${range}`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: charts } = useQuery({
    queryKey: ['admin-charts'],
    queryFn: () => api.get('/stats/charts').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: processing } = useQuery({
    queryKey: ['admin-processing'],
    queryFn: () => api.get('/stats/processing').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => api.get('/stats/subscriptions').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: health } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api.get('/system-health').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title={t('dashboard.totalUsers')} value={stats?.totalUsers ?? 0} icon={Users} color="blue" />
        <StatCard title={t('dashboard.newUsers')} value={stats?.newUsers ?? 0} icon={Users} color="emerald" />
        <StatCard title={t('dashboard.requests')} value={stats?.recentRequests ?? 0} icon={Zap} color="purple" />
        <StatCard title={t('dashboard.revenue')} value={`${(stats?.recentRevenue ?? 0).toLocaleString()} ₽`} icon={DollarSign} color="yellow" />
        <StatCard title={t('dashboard.activeSubs')} value={stats?.activeSubscriptions ?? 0} icon={CreditCard} color="emerald" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('dashboard.userGrowth')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={charts?.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#9ca3af' }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('dashboard.dailyRevenue')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts?.revenueByDay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#9ca3af' }} />
              <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subscriptions & Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Breakdown */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('dashboard.subscriptionsByPlan')}</h3>
          {subscriptions?.byTier && (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={subscriptions.byTier}
                    dataKey="count"
                    nameKey="tier"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {subscriptions.byTier.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {subscriptions.byTier.map((tier: { tier: string; count: number }, i: number) => (
                  <div key={tier.tier} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-400">{tier.tier}</span>
                    </div>
                    <span className="text-white font-medium">{tier.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {subscriptions && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('dashboard.mrr')}</span>
                <span className="text-white font-bold">{(subscriptions.mrr || 0).toLocaleString()} ₽</span>
              </div>
              {subscriptions.pastDue > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-yellow-400">{t('dashboard.pastDue')}</span>
                  <span className="text-yellow-400 font-medium">{subscriptions.pastDue}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Processing Analytics */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('dashboard.processingAnalytics')}</h3>
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Clock size={14} />
                {t('dashboard.avgProcessingTime')}
              </div>
              <div className="text-xl font-bold text-white">
                {processing ? formatTime(Math.round(processing.avgProcessingTime / 1000)) : '—'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-1">{t('dashboard.errorRate24h')}</div>
              <div className="text-xl font-bold text-white">
                {processing?.errorRate24h?.total
                  ? `${((processing.errorRate24h.failed / processing.errorRate24h.total) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <div className="text-xs text-gray-500">
                {t('dashboard.failedOf', { failed: processing?.errorRate24h?.failed ?? 0, total: processing?.errorRate24h?.total ?? 0 })}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-1">{t('dashboard.errorRate7d')}</div>
              <div className="text-xl font-bold text-white">
                {processing?.errorRate7d?.total
                  ? `${((processing.errorRate7d.failed / processing.errorRate7d.total) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('dashboard.systemHealth')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Database size={14} /> {t('dashboard.database')}
              </div>
              <StatusBadge status={health?.database ? 'ACTIVE' : 'FAILED'} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Database size={14} /> {t('dashboard.redis')}
              </div>
              <StatusBadge status={health?.redis ? 'ACTIVE' : 'FAILED'} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Cpu size={14} /> {t('dashboard.memory')}
              </div>
              <span className="text-sm text-white">{health?.memory?.usagePercent ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Activity size={14} /> {t('dashboard.uptime')}
              </div>
              <span className="text-sm text-white">{health ? formatTime(health.uptime) : '—'}</span>
            </div>

            {/* Queue Status */}
            {health?.queues && (
              <div className="mt-4 pt-3 border-t border-gray-800">
                <div className="text-xs text-gray-500 mb-2">{t('dashboard.queueStatus')}</div>
                {health.queues.map((q: { name: string; waiting: number; active: number; failed: number }) => (
                  <div key={q.name} className="flex items-center justify-between text-sm py-1">
                    <span className="text-gray-400 capitalize">{q.name}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-yellow-400">{q.waiting}w</span>
                      <span className="text-blue-400">{q.active}a</span>
                      {q.failed > 0 && <span className="text-red-400">{q.failed}f</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
