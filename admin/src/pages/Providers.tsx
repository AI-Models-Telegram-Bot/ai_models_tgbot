import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { Server, Zap, DollarSign, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
const CATEGORIES = ['ALL', 'TEXT', 'IMAGE', 'VIDEO', 'AUDIO'] as const;

export default function Providers() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>('ALL');

  const { data: providerData } = useQuery({
    queryKey: ['admin-providers-stats'],
    queryFn: () => api.get('/providers/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ['admin-providers-balances'],
    queryFn: () => api.get('/providers/balances').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const agg = providerData?.aggregates || {
    totalProviders: 0,
    totalRequests: 0,
    estimatedTotalSpend: 0,
    activeProviders: 0,
    overallSuccessRate: 100,
  };
  const stats = providerData?.stats || [];
  const circuitBreakers = providerData?.circuitBreakers || {};
  const costBreakdown = providerData?.costBreakdown || [];
  const balances = balancesData?.balances || [];

  // Only show providers that have been used (requests > 0) or are currently active
  const activeStats = stats.filter((s: any) => s.requests > 0 || s.enabled);
  const filteredStats = category === 'ALL' ? activeStats : activeStats.filter((s: any) => s.category === category);

  const openRouterBalance = balances.find((b: any) => b.provider === 'openrouter');
  const elevenLabsBalance = balances.find((b: any) => b.provider === 'elevenlabs');

  const cbEntries = Object.entries(circuitBreakers) as [string, { failures: number; isOpen: boolean; cooldownRemaining: number }][];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('providers.title')}</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-500">{t('providers.autoRefresh')}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('providers.totalProviders')} value={activeStats.length} icon={Server} color="blue" />
        <StatCard title={t('providers.totalRequests')} value={agg.totalRequests} icon={Zap} color="purple" />
        <StatCard
          title={t('providers.estTotalSpend')}
          value={`$${agg.estimatedTotalSpend.toFixed(4)}`}
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title={t('providers.activeHealthy')}
          value={`${agg.activeProviders} / ${activeStats.length}`}
          icon={Activity}
          color="emerald"
          trend={{ value: agg.overallSuccessRate, label: t('providers.successRate') }}
        />
      </div>

      {/* External Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* OpenRouter */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">{t('providers.openRouterCredits')}</h3>
            {openRouterBalance?.status === 'ok' && (
              <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full">{t('providers.connected')}</span>
            )}
          </div>
          {balancesLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-gray-800 rounded w-32" />
              <div className="h-2 bg-gray-800 rounded w-full" />
            </div>
          ) : openRouterBalance?.status === 'ok' ? (
            <>
              <div className="text-2xl font-bold text-white mb-1">
                ${(openRouterBalance.data.remaining as number).toFixed(4)}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                Used ${(openRouterBalance.data.totalUsage as number).toFixed(4)} of ${(openRouterBalance.data.totalCredits as number).toFixed(4)}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((openRouterBalance.data.totalUsage as number) / Math.max(0.01, openRouterBalance.data.totalCredits as number)) * 100)}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-red-400">{openRouterBalance?.error || t('providers.noApiKey')}</div>
          )}
        </div>

        {/* ElevenLabs */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">{t('providers.elevenLabsCharacters')}</h3>
            {elevenLabsBalance?.status === 'ok' && (
              <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full">
                {(elevenLabsBalance.data.tier as string)?.toUpperCase()}
              </span>
            )}
          </div>
          {balancesLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-gray-800 rounded w-32" />
              <div className="h-2 bg-gray-800 rounded w-full" />
            </div>
          ) : elevenLabsBalance?.status === 'ok' ? (
            <>
              <div className="text-2xl font-bold text-white mb-1">
                {(elevenLabsBalance.data.remaining as number).toLocaleString()} chars
              </div>
              <div className="text-xs text-gray-500 mb-3">
                Used {(elevenLabsBalance.data.characterCount as number).toLocaleString()} of {(elevenLabsBalance.data.characterLimit as number).toLocaleString()}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((elevenLabsBalance.data.characterCount as number) / Math.max(1, elevenLabsBalance.data.characterLimit as number)) * 100)}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-red-400">{elevenLabsBalance?.error || t('providers.noApiKey')}</div>
          )}
        </div>
      </div>

      {/* Charts + Circuit Breaker Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost Pie Chart */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('providers.costByProvider')}</h3>
          {costBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    dataKey="totalCost"
                    nameKey="provider"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                  >
                    {costBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(val: number) => `$${val.toFixed(6)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3">
                {costBreakdown.map((entry: any, i: number) => (
                  <div key={entry.provider} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-400 capitalize">{entry.provider}</span>
                    <span className="text-gray-500">${entry.totalCost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">
              {t('providers.noCostData')}
            </div>
          )}
        </div>

        {/* Circuit Breaker Status */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('providers.circuitBreakers')}</h3>
          {cbEntries.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-8 justify-center">
              <CheckCircle size={18} />
              {t('providers.allCircuitsClosed')}
            </div>
          ) : (
            <div className="space-y-3">
              {cbEntries.map(([name, state]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    {state.isOpen ? (
                      <AlertTriangle size={14} className="text-red-400" />
                    ) : (
                      <CheckCircle size={14} className="text-emerald-400" />
                    )}
                    <span className="text-gray-300 capitalize">{name}</span>
                  </div>
                  <div className="text-xs">
                    {state.isOpen ? (
                      <span className="text-red-400">
                        OPEN ({Math.ceil(state.cooldownRemaining / 1000)}s)
                      </span>
                    ) : state.failures > 0 ? (
                      <span className="text-yellow-400">{state.failures} failures</span>
                    ) : (
                      <span className="text-emerald-400">OK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Filter + Stats Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-1 p-4 border-b border-gray-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('providers.provider')}</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('providers.category')}</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('providers.priority')}</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('providers.status')}</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">{t('providers.requests')}</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">{t('providers.successPercent')}</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">{t('providers.avgCost')}</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">{t('providers.avgTime')}</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">{t('providers.totalCost')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {t('providers.noProviderData')}
                  </td>
                </tr>
              ) : (
                filteredStats.map((s: any, i: number) => {
                  const cb = circuitBreakers[s.provider];
                  let statusLabel = 'ACTIVE';
                  if (!s.enabled) statusLabel = 'CANCELED';
                  else if (cb?.isOpen) statusLabel = 'FAILED';

                  return (
                    <tr key={`${s.provider}-${s.category}-${i}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-white font-medium capitalize">{s.provider}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.category} /></td>
                      <td className="px-4 py-3 text-gray-400">#{s.priority}</td>
                      <td className="px-4 py-3"><StatusBadge status={statusLabel} /></td>
                      <td className="px-4 py-3 text-right text-white">{s.requests.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            s.successRate >= 90
                              ? 'text-emerald-400'
                              : s.successRate >= 70
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }
                        >
                          {s.requests > 0 ? `${s.successRate.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">${s.avgCost.toFixed(6)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {s.requests > 0 ? `${(s.avgTime / 1000).toFixed(2)}s` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">${s.totalCost.toFixed(4)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
