import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { MediaThumbnail } from '../components/MediaPreview';
import RequestDetailDrawer from '../components/RequestDetailDrawer';
import { useToastStore } from '../stores/toastStore';
import { ArrowLeft, Ban, ShieldCheck, CreditCard, Save, Users, XCircle } from 'lucide-react';

const TIERS = ['FREE', 'STARTER', 'PRO', 'PREMIUM', 'BUSINESS', 'ENTERPRISE'];
const TAB_KEYS = ['requests', 'payments', 'transactions', 'referrals', 'withdrawals'] as const;

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
  const [editCash, setEditCash] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const tabLabels: Record<typeof TAB_KEYS[number], string> = {
    requests: t('userDetail.requests'),
    payments: t('userDetail.payments'),
    transactions: t('userDetail.transactions'),
    referrals: t('userDetail.referrals'),
    withdrawals: t('userDetail.withdrawals'),
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

  const handleSaveCash = () => {
    if (editCash !== null) {
      updateMutation.mutate({ moneyBalance: editCash });
      setEditCash(null);
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
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
                  <button onClick={() => setEditBalance(null)} className="text-gray-400 hover:text-gray-300">
                    <XCircle size={14} />
                  </button>
                </>
              ) : (
                <span
                  className="text-lg font-bold text-white cursor-pointer hover:text-blue-400"
                  onClick={() => setEditBalance(String(user.wallet?.tokenBalance || 0))}
                  title={t('userDetail.clickToEdit')}
                >
                  {(user.wallet?.tokenBalance || 0).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-500">{t('userDetail.cashBalance')}</div>
            <div className="flex items-center gap-2 mt-1">
              {editCash !== null ? (
                <>
                  <input
                    type="number"
                    value={editCash}
                    onChange={(e) => setEditCash(e.target.value)}
                    className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-white text-sm"
                  />
                  <button onClick={handleSaveCash} className="text-emerald-400 hover:text-emerald-300">
                    <Save size={14} />
                  </button>
                  <button onClick={() => setEditCash(null)} className="text-gray-400 hover:text-gray-300">
                    <XCircle size={14} />
                  </button>
                </>
              ) : (
                <span
                  className="text-lg font-bold text-white cursor-pointer hover:text-blue-400"
                  onClick={() => setEditCash(String(user.wallet?.moneyBalance || 0))}
                  title={t('userDetail.clickToEdit')}
                >
                  {(user.wallet?.moneyBalance || 0).toFixed(2)} ₽
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-500">{t('userDetail.referrals')}</div>
            <div className="flex items-center gap-2 mt-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-lg font-bold text-white">{user._count?.referrals || 0}</span>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase w-12"></th>
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
              {activeTab === 'referrals' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.referralUser')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.referralJoined')}</th>
                </>
              )}
              {activeTab === 'withdrawals' && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.currency')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.adminNote')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('userDetail.date')}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {activeTab === 'requests' && user.requests?.map((r: any) => (
              <tr
                key={r.id}
                onClick={() => setSelectedRequestId(r.id)}
                className="cursor-pointer hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <MediaThumbnail url={r.outputFileUrl} category={r.model?.category} />
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-white">{r.model?.name || '—'}</div>
                  <div className="text-xs text-gray-500">{r.model?.provider}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{r.inputText || '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                  {r.status === 'FAILED' && r.errorMessage && (
                    <div className="text-red-400/70 text-[10px] mt-0.5 max-w-[100px] truncate" title={r.errorMessage}>
                      {r.errorMessage.slice(0, 40)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{r.creditsCharged?.toFixed(2) || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {activeTab === 'payments' && user.payments?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm text-white">{p.amount} ₽</td>
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
            {activeTab === 'referrals' && user.referrals?.map((ref: any) => (
              <tr key={ref.id}>
                <td className="px-4 py-3 text-sm text-white">
                  {ref.firstName || ref.username || '—'}
                  {ref.username && <span className="text-gray-500 ml-2">@{ref.username}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(ref.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {activeTab === 'withdrawals' && user.withdrawalRequests?.map((wr: any) => (
              <tr key={wr.id}>
                <td className="px-4 py-3 text-sm text-white">{wr.amount?.toFixed(2)} ₽</td>
                <td className="px-4 py-3 text-sm text-gray-400">RUB</td>
                <td className="px-4 py-3"><StatusBadge status={wr.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-400">{wr.adminNote || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(wr.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Request Detail Drawer */}
      <RequestDetailDrawer
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        showUserLink={false}
      />

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
