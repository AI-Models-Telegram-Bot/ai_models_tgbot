import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Search } from 'lucide-react';

const CATEGORIES = ['', 'TEXT', 'IMAGE', 'VIDEO', 'AUDIO'];
const STATUSES = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

export default function Generations() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

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
      key: 'input',
      header: 'Input',
      render: (r: any) => (
        <div className="max-w-xs truncate text-white">{r.inputText || '(no text)'}</div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (r: any) => (
        <div className="text-gray-400 text-xs">
          {r.user?.firstName || r.user?.username || r.user?.email || '—'}
        </div>
      ),
    },
    {
      key: 'model',
      header: 'Model',
      render: (r: any) => (
        <div>
          <div className="text-white text-xs">{r.model?.name || '—'}</div>
          <div className="text-gray-500 text-xs">{r.model?.provider}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r: any) => <StatusBadge status={r.model?.category || '—'} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: any) => <StatusBadge status={r.status} />,
    },
    {
      key: 'credits',
      header: 'Credits',
      render: (r: any) => (
        <span className="text-gray-400">{r.creditsCharged?.toFixed(2) || '—'}</span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (r: any) => (
        <span className="text-gray-400 text-xs">
          {r.processingTime ? `${(r.processingTime / 1000).toFixed(1)}s` : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (r: any) => (
        <span className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Generations</h1>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by input text..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </form>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
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
      />
    </div>
  );
}
