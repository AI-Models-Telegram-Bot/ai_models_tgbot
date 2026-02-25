import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Plus } from 'lucide-react';

const STATUSES = ['', 'DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'CANCELLED', 'FAILED'];

export default function Broadcasts() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-broadcasts', page, status],
    queryFn: () =>
      api.get('/broadcasts', { params: { page, limit: 20, status: status || undefined } })
        .then((r) => r.data),
  });

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (b: any) => (
        <div>
          <div className="text-white font-medium">{b.name}</div>
          <div className="text-xs text-gray-500">
            Target: {b.targetType}
            {b.targetPlans?.length > 0 && ` (${b.targetPlans.join(', ')})`}
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (b: any) => <StatusBadge status={b.status} /> },
    {
      key: 'delivery',
      header: 'Delivery',
      render: (b: any) => {
        if (b.totalRecipients === 0) return <span className="text-gray-500">—</span>;
        const pct = Math.round((b.sentCount / b.totalRecipients) * 100);
        return (
          <div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400">{pct}%</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {b.sentCount}/{b.totalRecipients} sent
              {b.failedCount > 0 && <span className="text-red-400 ml-1">({b.failedCount} failed)</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'admin',
      header: 'Admin',
      render: (b: any) => <span className="text-gray-400">{b.admin?.username || '—'}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (b: any) => <span className="text-gray-500 text-xs">{new Date(b.createdAt).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Broadcasts</h1>
        <div className="flex gap-3">
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
          <button
            onClick={() => navigate('/broadcasts/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus size={16} /> New Broadcast
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.broadcasts || []}
        page={page}
        totalPages={data?.totalPages || 1}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowClick={(b: any) => navigate(`/broadcasts/${b.id}`)}
        isLoading={isLoading}
      />
    </div>
  );
}
