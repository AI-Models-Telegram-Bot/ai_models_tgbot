import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Search, Download } from 'lucide-react';

const PLANS = ['', 'FREE', 'STARTER', 'PRO', 'PREMIUM', 'BUSINESS', 'ENTERPRISE'];
const STATUSES = ['', 'active', 'blocked'];

export default function Users() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, plan, status],
    queryFn: () =>
      api.get('/users', { params: { page, limit: 20, search, plan: plan || undefined, status: status || undefined } })
        .then((r) => r.data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const exportCsv = () => {
    if (!data?.users) return;
    const headers = [t('users.csvUsername'), t('users.csvName'), t('users.csvEmail'), t('users.plan'), t('users.balance'), t('users.requests'), t('users.joined')];
    const rows = data.users.map((u: any) => [
      u.username || '',
      `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      u.email || '',
      u.subscription?.tier || 'FREE',
      u.wallet?.tokenBalance?.toFixed(2) || '0',
      u._count?.requests || 0,
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'user',
      header: t('users.user'),
      render: (u: any) => (
        <div>
          <div className="text-white font-medium">
            {u.firstName || u.username || t('common.unknown')}
            {u.lastName ? ` ${u.lastName}` : ''}
          </div>
          <div className="text-xs text-gray-500">{u.email || `@${u.username || '—'}`}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: t('users.plan'),
      render: (u: any) => <StatusBadge status={u.subscription?.tier || 'FREE'} />,
    },
    {
      key: 'status',
      header: t('users.status'),
      render: (u: any) => <StatusBadge status={u.isBlocked ? 'blocked' : 'active'} />,
    },
    {
      key: 'balance',
      header: t('users.balance'),
      render: (u: any) => (
        <span className="text-white">{(u.wallet?.tokenBalance || 0).toFixed(1)}</span>
      ),
    },
    {
      key: 'requests',
      header: t('users.requests'),
      render: (u: any) => <span className="text-gray-400">{u._count?.requests || 0}</span>,
    },
    {
      key: 'createdAt',
      header: t('users.joined'),
      render: (u: any) => (
        <span className="text-gray-400 text-xs">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('users.title')}</h1>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          <Download size={16} /> {t('users.exportCsv')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </form>
        <select
          value={plan}
          onChange={(e) => { setPlan(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">{t('common.allPlans')}</option>
          {PLANS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">{t('common.allStatuses')}</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.users || []}
        page={page}
        totalPages={data?.totalPages || 1}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowClick={(u: any) => navigate(`/users/${u.id}`)}
        isLoading={isLoading}
      />
    </div>
  );
}
