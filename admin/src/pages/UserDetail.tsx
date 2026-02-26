import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToastStore } from '../stores/toastStore';
import { ArrowLeft, Ban, ShieldCheck, CreditCard, Save } from 'lucide-react';

const TIERS = ['FREE', 'STARTER', 'PRO', 'PREMIUM', 'BUSINESS', 'ENTERPRISE'];
const TAB_KEYS = ['requests', 'payments', 'transactions'] as const;

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<typeof TAB_KEYS[number]>('requests');
  const [confirmAction, setConfirmAction] = useState<null | 'ban' | 'unban'>(null);
  const [planDialog, setPlanDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [editBalance, setEditBalance] = useState<string | null>(null);

  const tabLabels: Record<typeof TAB_KEYS[number], string> = {
    requests: t('userDetail.requests'),
    payments: t('userDetail.payments'),
    transactions: t('userDetail.transactions'),
  };

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const mutation = (action: string, method: 'post' | 'put' = 'post') =>
    useMutation({
      mutationFn: (body?: any) =>
        method === 'post'
          ? api.post(`/users/${id}/${action}`, body)
          : api.put(`/users/${id}/${action}`, body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        addToast(t('userDetail.userUpdated'), 'success');
      },
      onError: (err: any) => addToast(err.response?.data?.error || t('userDetail.actionFailed'), 'error'),
    });

  const banMutation = mutation('ban');
  const unbanMutation = mutation('unban');
  const planMutation = mutation('update-plan');
  const updateMutation = mutation('update');

  if (isLoading) return <div className="text-gray-400">{t('common.loading')}</div>;
  if (!user) return <div className="text-gray-400">{t('userDetail.userNotFound')}</div>;

  const handlePlanChange = () => {
    if (selectedTier) {
      planMutation.mutate({ tier: selectedTier });
      setPlanDialog(false);
    }
  };

  const handleSaveBalance = () => {
    if (editBalance !== null) {
      updateMutation.mutate({ tokenBalance: editBalance });
      setEditBalance(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => navigate('/users')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
        <ArrowLeft size={16} /> {t('userDetail.backToUsers')}
      </button>

      {/* Profile Card */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {user.firstName || user.username || t('common.unknown')}
                {user.lastName ? ` ${user.lastName}` : ''}
              </h2>
              <StatusBadge status={user.isBlocked ? 'blocked' : 'active'} />
              <StatusBadge status={user.subscription?.tier || 'FREE'} />
            </div>
            <div className="mt-1 text-sm text-gray-400 space-x-4">
              {user.username && <span>@{user.username}</span>}
              {user.email && <span>{user.email}</span>}
              {user.telegramId && <span>TG: {user.telegramId}</span>}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setPlanDialog(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg"
            >
              <CreditCard size={14} /> {t('userDetail.changePlan')}
            </button>
            {user.isBlocked ? (
              <button
                onClick={() => setConfirmAction('unban')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg"
              >
                <ShieldCheck size={14} /> {t('userDetail.unban')}
              </button>
            ) : (
              <button
                onClick={() => setConfirmAction('ban')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg"
              >
                <Ban size={14} /> {t('userDetail.ban')}
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-500">{t('userDetail.tokenBalance')}</div>
            <div className="flex items-center gap-2 mt-1">
              {editBalance !== null ? (
                <>
                  <input
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-white text-sm"
                  />
                  <button onClick={handleSaveBalance} className="text-emerald-400 hover:text-emerald-300">
                    <Save size={14} />
                  </button>
                </>
              ) : (
                <span
                  className="text-lg font-bold text-white cursor-pointer hover:text-blue-400"
                  onClick={() => setEditBalance(String(user.wallet?.tokenBalance || 0))}
                >
                  {(user.wallet?.tokenBalance || 0).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-500">{t('userDetail.totalSpent')}</div>
            <div className="text-lg font-bold text-white mt-1">{(user.totalSpent || 0).toLocaleString()} ₽</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-500">{t('userDetail.totalRequests')}</div>
            <div className="text-lg font-bold text-white mt-1">{user.requests?.length || 0}</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-500">{t('userDetail.joined')}</div>
            <div className="text-lg font-bold text-white mt-1">{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit">
        {TAB_KEYS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {activeTab === 'requests' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.model')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.input')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.credits')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.date')}</th>
                </>
              )}
              {activeTab === 'payments' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.provider')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.tier')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.date')}</th>
                </>
              )}
              {activeTab === 'transactions' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.category')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.balanceAfter')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.date')}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {activeTab === 'requests' && user.requests?.map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm text-white">{r.model?.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{r.inputText || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-400">{r.creditsCharged?.toFixed(2) || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {activeTab === 'payments' && user.payments?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm text-white">{p.amount} {p.currency}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{p.provider}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={p.tier || '—'} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {activeTab === 'transactions' && user.walletTransactions?.map((txn: any) => (
              <tr key={txn.id}>
                <td className="px-4 py-3"><StatusBadge status={txn.transactionType} /></td>
                <td className="px-4 py-3"><StatusBadge status={txn.category} /></td>
                <td className="px-4 py-3 text-sm">
                  <span className={txn.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {txn.amount >= 0 ? '+' : ''}{txn.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{txn.balanceAfter?.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(txn.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Ban/Unban Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'ban' ? t('userDetail.banUser') : t('userDetail.unbanUser')}
        message={
          confirmAction === 'ban'
            ? t('userDetail.banConfirmMessage')
            : t('userDetail.unbanConfirmMessage')
        }
        confirmLabel={confirmAction === 'ban' ? t('userDetail.banUser') : t('userDetail.unbanUser')}
        danger={confirmAction === 'ban'}
        onConfirm={() => {
          if (confirmAction === 'ban') banMutation.mutate({});
          else unbanMutation.mutate({});
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Plan Change Dialog */}
      {planDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPlanDialog(false)} />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-4">{t('userDetail.changeSubscriptionPlan')}</h3>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm mb-4"
            >
              <option value="">{t('common.selectPlan')}</option>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPlanDialog(false)}
                className="px-4 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handlePlanChange}
                disabled={!selectedTier}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {t('userDetail.updatePlan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
