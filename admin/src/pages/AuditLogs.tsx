import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import DataTable from '../components/DataTable';

const ACTIONS = [
  '', 'LOGIN_SUCCESS', 'LOGOUT', 'BAN_USER', 'UNBAN_USER',
  'UPDATE_PLAN', 'UPDATE_USER', 'CHANGE_PASSWORD',
  'CREATE_BROADCAST', 'SEND_BROADCAST', 'CANCEL_BROADCAST',
];

const actionColors: Record<string, string> = {
  LOGIN_SUCCESS: 'text-emerald-400',
  LOGOUT: 'text-gray-400',
  BAN_USER: 'text-red-400',
  UNBAN_USER: 'text-emerald-400',
  UPDATE_PLAN: 'text-blue-400',
  UPDATE_USER: 'text-blue-400',
  CHANGE_PASSWORD: 'text-yellow-400',
  CREATE_BROADCAST: 'text-purple-400',
  SEND_BROADCAST: 'text-purple-400',
  CANCEL_BROADCAST: 'text-red-400',
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, action],
    queryFn: () =>
      api.get('/audit-logs', { params: { page, limit: 20, action: action || undefined } })
        .then((r) => r.data),
  });

  const columns = [
    {
      key: 'time',
      header: 'Time',
      render: (l: any) => (
        <span className="text-gray-400 text-xs">{new Date(l.createdAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
      render: (l: any) => <span className="text-white">{l.admin?.username || '—'}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (l: any) => (
        <span className={`font-medium text-sm ${actionColors[l.action] || 'text-gray-400'}`}>
          {l.action}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (l: any) => (
        <div className="text-gray-400 text-xs">
          {l.targetType && <span>{l.targetType}: </span>}
          {l.targetId && <span className="font-mono">{l.targetId.slice(0, 12)}...</span>}
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (l: any) => (
        <span className="text-gray-500 text-xs font-mono max-w-xs truncate block">
          {l.details ? JSON.stringify(l.details) : '—'}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (l: any) => <span className="text-gray-500 text-xs font-mono">{l.ipAddress || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">All Actions</option>
          {ACTIONS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.logs || []}
        page={page}
        totalPages={data?.totalPages || 1}
        total={data?.total || 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
