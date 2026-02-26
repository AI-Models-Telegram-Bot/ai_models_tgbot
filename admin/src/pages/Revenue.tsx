import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PERIODS = ['7d', '30d', '90d', 'all'] as const;

export default function Revenue() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<string>('30d');
  const [paymentPage, setPaymentPage] = useState(1);

  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue', period],
    queryFn: () => api.get(`/revenue?period=${period}`).then((r) => r.data),
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments', paymentPage],
    queryFn: () => api.get('/payments', { params: { page: paymentPage, limit: 20 } }).then((r) => r.data),
  });

  const paymentColumns = [
    {
      key: 'user',
      header: t('revenue.user'),
      render: (p: any) => (
        <span className="text-white">{p.user?.firstName || p.user?.username || p.user?.email || '—'}</span>
      ),
    },
    { key: 'amount', header: t('revenue.amount'), render: (p: any) => <span className="text-white font-medium">{p.amount} {p.currency}</span> },
    { key: 'provider', header: t('revenue.provider'), render: (p: any) => <span className="text-gray-400">{p.provider}</span> },
    { key: 'status', header: t('revenue.status'), render: (p: any) => <StatusBadge status={p.status} /> },
    { key: 'tier', header: t('revenue.tier'), render: (p: any) => p.tier ? <StatusBadge status={p.tier} /> : <span className="text-gray-500">—</span> },
    { key: 'date', header: t('revenue.date'), render: (p: any) => <span className="text-gray-500 text-xs">{new Date(p.createdAt).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('revenue.title')}</h1>
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('revenue.totalRevenue')} value={`${(revenue?.summary?.total || 0).toLocaleString()} ₽`} icon={DollarSign} color="yellow" />
        <StatCard title={t('revenue.payments')} value={revenue?.summary?.count || 0} icon={CreditCard} color="blue" />
        <StatCard title={t('revenue.avgPayment')} value={`${(revenue?.summary?.avg || 0).toFixed(0)} ₽`} icon={TrendingUp} color="emerald" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 mb-4">{t('revenue.dailyRevenue')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenue?.dailyRevenue || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#9ca3af' }} />
            <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Plan */}
      {revenue?.byPlan?.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-4">{t('revenue.revenueByPlan')}</h3>
          <div className="space-y-2">
            {revenue.byPlan.map((p: any) => (
              <div key={p.tier} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                <StatusBadge status={p.tier} />
                <div className="text-right">
                  <span className="text-white font-medium">{Number(p.total).toLocaleString()} ₽</span>
                  <span className="text-gray-500 text-xs ml-2">{t('revenue.paymentsCount', { count: p.count })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">{t('revenue.recentPayments')}</h3>
        <DataTable
          columns={paymentColumns}
          data={payments?.payments || []}
          page={paymentPage}
          totalPages={payments?.totalPages || 1}
          total={payments?.total || 0}
          onPageChange={setPaymentPage}
          isLoading={paymentsLoading}
        />
      </div>
    </div>
  );
}
