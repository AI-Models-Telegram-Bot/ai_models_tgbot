import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useToastStore } from '../stores/toastStore';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react';

const STATUSES = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'] as const;

export default function Withdrawals() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionDialog, setActionDialog] = useState<{ id: string; action: 'approve' | 'reject' | 'paid' } | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: () => api.get('/withdrawals', { params: { status: statusFilter === 'ALL' ? undefined : statusFilter } }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: string; note?: string }) =>
      api.post(`/withdrawals/${id}/${action}`, { adminNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      addToast(t('withdrawals.updated'), 'success');
      setActionDialog(null);
      setAdminNote('');
    },
    onError: (err: any) => addToast(err.response?.data?.error || t('withdrawals.actionFailed'), 'error'),
  });

  const withdrawals = data?.withdrawals || [];
  const stats = data?.stats || { pending: 0, totalPending: 0, totalPaid: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('withdrawals.title')}</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">{t('withdrawals.pendingRequests')}</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-gray-500 mt-1">{stats.totalPending.toFixed(2)} ₽</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">{t('withdrawals.totalPaid')}</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.totalPaid.toFixed(2)} ₽</div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">{t('withdrawals.totalRequests')}</div>
          <div className="text-2xl font-bold text-white">{withdrawals.length}</div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('withdrawals.user')}</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">{t('withdrawals.amount')}</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('withdrawals.status')}</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('withdrawals.adminNote')}</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">{t('withdrawals.date')}</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">{t('withdrawals.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{t('common.loading')}</td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</td></tr>
            ) : (
              withdrawals.map((wr: any) => (
                <tr key={wr.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <div className="text-white">{wr.user?.firstName || wr.user?.username || '—'}</div>
                    {wr.user?.username && <div className="text-xs text-gray-500">@{wr.user.username}</div>}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">{wr.amount.toFixed(2)} {wr.currency}</td>
                  <td className="px-4 py-3"><StatusBadge status={wr.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{wr.adminNote || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(wr.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {wr.status === 'PENDING' && (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setActionDialog({ id: wr.id, action: 'approve' }); setAdminNote(''); }}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-600/20 rounded"
                          title={t('withdrawals.approve')}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => { setActionDialog({ id: wr.id, action: 'reject' }); setAdminNote(''); }}
                          className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"
                          title={t('withdrawals.reject')}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                    {wr.status === 'APPROVED' && (
                      <button
                        onClick={() => { setActionDialog({ id: wr.id, action: 'paid' }); setAdminNote(''); }}
                        className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"
                        title={t('withdrawals.markPaid')}
                      >
                        <DollarSign size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action dialog */}
      {actionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setActionDialog(null)} />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-4">
              {actionDialog.action === 'approve' && t('withdrawals.approveRequest')}
              {actionDialog.action === 'reject' && t('withdrawals.rejectRequest')}
              {actionDialog.action === 'paid' && t('withdrawals.markAsPaid')}
            </h3>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={t('withdrawals.notePlaceholder')}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm mb-4 h-20 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionDialog(null)}
                className="px-4 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => actionMutation.mutate({ id: actionDialog.id, action: actionDialog.action, note: adminNote })}
                className={`px-4 py-2 text-sm text-white rounded-lg ${
                  actionDialog.action === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
