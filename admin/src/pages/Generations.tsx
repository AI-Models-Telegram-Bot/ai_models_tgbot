import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { MediaThumbnail } from '../components/MediaPreview';
import RequestDetailDrawer from '../components/RequestDetailDrawer';
import { Search } from 'lucide-react';

const CATEGORIES = ['', 'TEXT', 'IMAGE', 'VIDEO', 'AUDIO'];
const STATUSES = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

export default function Generations() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-requests', page, search, category, status],
    queryFn: () =>
      api.get('/requests', {
        params: { page, limit: 20, search: search || undefined, category: category || undefined, status: status || undefined },
      }).then((r) => r.data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const columns = [
    {
      key: 'preview',
      header: '',
      className: 'w-12',
      render: (r: any) => (
        <MediaThumbnail url={r.outputFileUrl} category={r.model?.category} />
      ),
    },
    {
      key: 'input',
      header: t('generations.input'),
      render: (r: any) => (
        <div className="max-w-xs truncate text-white text-sm">{r.inputText || t('common.noText')}</div>
      ),
    },
    {
      key: 'user',
      header: t('generations.user'),
      render: (r: any) => (
        <div className="text-gray-400 text-xs">
          {r.user?.firstName || r.user?.username || r.user?.email || '—'}
        </div>
      ),
    },
    {
      key: 'model',
      header: t('generations.model'),
      render: (r: any) => (
        <div>
          <div className="text-white text-xs">{r.model?.name || '—'}</div>
          <div className="text-gray-500 text-xs">{r.model?.provider}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('generations.category'),
      render: (r: any) => <StatusBadge status={r.model?.category || '—'} />,
    },
    {
      key: 'status',
      header: t('generations.status'),
      render: (r: any) => (
        <div>
          <StatusBadge status={r.status} />
          {r.status === 'FAILED' && r.errorMessage && (
            <div className="text-red-400/70 text-[10px] mt-0.5 max-w-[120px] truncate" title={r.errorMessage}>
              {r.errorMessage.slice(0, 50)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'credits',
      header: t('generations.credits'),
      render: (r: any) => (
        <span className="text-gray-400">{r.creditsCharged?.toFixed(2) || '—'}</span>
      ),
    },
    {
      key: 'time',
      header: t('generations.time'),
      render: (r: any) => (
        <span className="text-gray-400 text-xs">
          {r.processingTime ? `${(r.processingTime / 1000).toFixed(1)}s` : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('generations.created'),
      render: (r: any) => (
        <span className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('generations.title')}</h1>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('generations.searchPlaceholder')}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </form>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">{t('common.allCategories')}</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
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
        data={data?.requests || []}
        page={page}
        totalPages={data?.totalPages || 1}
        total={data?.total || 0}
        onPageChange={setPage}
        isLoading={isLoading}
        onRowClick={(row: any) => setSelectedId(row.id)}
      />

      <RequestDetailDrawer requestId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
