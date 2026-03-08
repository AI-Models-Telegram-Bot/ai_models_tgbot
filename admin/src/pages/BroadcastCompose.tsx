import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToastStore } from '../stores/toastStore';
import { ArrowLeft, Send, Save, Trash2, XCircle, Bold, Italic, Code, Link, Plus, X, Search, ExternalLink, Smartphone, MessageSquare } from 'lucide-react';

const TIERS = ['FREE', 'STARTER', 'PRO', 'PREMIUM', 'BUSINESS', 'ENTERPRISE'];
const SUB_STATUSES = ['ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE', 'TRIALING'];

type ButtonType = 'url' | 'webapp' | 'channel';

interface InlineButton {
  id: string;
  text: string;
  type: ButtonType;
  value: string;
}

const BUTTON_TYPE_OPTIONS: { value: ButtonType; labelKey: string; icon: typeof ExternalLink }[] = [
  { value: 'url', labelKey: 'broadcastCompose.typeUrl', icon: ExternalLink },
  { value: 'webapp', labelKey: 'broadcastCompose.typeMiniapp', icon: Smartphone },
  { value: 'channel', labelKey: 'broadcastCompose.typeChannel', icon: MessageSquare },
];

export default function BroadcastCompose() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { t } = useTranslation();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<string>('ALL');
  const [targetPlans, setTargetPlans] = useState<string[]>([]);
  const [targetStatuses, setTargetStatuses] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState('');
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Inline buttons
  const [buttons, setButtons] = useState<InlineButton[]>([]);

  // Selected users
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; username: string; firstName: string; telegramId: string }[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: broadcast } = useQuery({
    queryKey: ['admin-broadcast', id],
    queryFn: () => api.get(`/broadcasts/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  useEffect(() => {
    if (broadcast) {
      setName(broadcast.name);
      setMessage(broadcast.message);
      setTargetType(broadcast.targetType);
      setTargetPlans(broadcast.targetPlans || []);
      setTargetStatuses(broadcast.targetStatuses || []);
      setScheduledFor(broadcast.scheduledFor ? new Date(broadcast.scheduledFor).toISOString().slice(0, 16) : '');
      setButtons(Array.isArray(broadcast.buttons) ? broadcast.buttons : []);
      // Load selected users if SELECTED_USERS
      if (broadcast.targetType === 'SELECTED_USERS' && broadcast.targetUserIds?.length) {
        api.post('/broadcasts/resolve-users', { userIds: broadcast.targetUserIds })
          .then((r) => setSelectedUsers(r.data.users || []))
          .catch(() => {});
      }
    }
  }, [broadcast]);

  const { data: preview } = useQuery({
    queryKey: ['admin-broadcast-preview', targetType, targetPlans, targetStatuses, selectedUsers.map((u) => u.id)],
    queryFn: () => {
      if (targetType === 'SELECTED_USERS') {
        return { count: selectedUsers.length };
      }
      return api.post('/broadcasts/preview', { targetType, targetPlans, targetStatuses }).then((r) => r.data);
    },
  });

  // Debounced user search
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get('/users', { params: { search: query, limit: 10 } });
      const users = res.data.users || [];
      // Filter out already selected
      const selectedIds = new Set(selectedUsers.map((u) => u.id));
      setUserSearchResults(users.filter((u: any) => !selectedIds.has(u.id)));
    } catch {
      setUserSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedUsers]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(userSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, searchUsers]);

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      isNew ? api.post('/broadcasts', data) : api.put(`/broadcasts/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      addToast(t('broadcastCompose.broadcastSaved'), 'success');
      if (isNew) navigate(`/broadcasts/${res.data.id}`);
    },
    onError: (err: any) => addToast(err.response?.data?.error || t('broadcastCompose.saveFailed'), 'error'),
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/broadcasts/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcast', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      addToast(t('broadcastCompose.broadcastSendingStarted'), 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.error || t('broadcastCompose.sendFailed'), 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/broadcasts/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcast', id] });
      addToast(t('broadcastCompose.broadcastCancelled'), 'info');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/broadcasts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      addToast(t('broadcastCompose.broadcastDeleted'), 'info');
      navigate('/broadcasts');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      name,
      message,
      targetType,
      targetPlans,
      targetStatuses,
      targetUserIds: selectedUsers.map((u) => u.id),
      buttons,
      scheduledFor: scheduledFor || null,
    });
  };

  const insertTag = (tag: string) => {
    const textarea = document.getElementById('broadcast-message') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = message.slice(start, end);
    const wrapped = `<${tag}>${selected}</${tag}>`;
    setMessage(message.slice(0, start) + wrapped + message.slice(end));
  };

  // Button management
  const addButton = () => {
    setButtons([...buttons, { id: crypto.randomUUID(), text: '', type: 'url', value: '' }]);
  };

  const updateButton = (btnId: string, field: keyof InlineButton, val: string) => {
    setButtons(buttons.map((b) => (b.id === btnId ? { ...b, [field]: val } : b)));
  };

  const removeButton = (btnId: string) => {
    setButtons(buttons.filter((b) => b.id !== btnId));
  };

  // User selection
  const addUser = (user: any) => {
    setSelectedUsers([...selectedUsers, { id: user.id, username: user.username, firstName: user.firstName, telegramId: String(user.telegramId) }]);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const isDraft = !broadcast || broadcast.status === 'DRAFT';
  const isSending = broadcast?.status === 'SENDING';

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate('/broadcasts')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
        <ArrowLeft size={16} /> {t('broadcastCompose.backToBroadcasts')}
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {isNew ? t('broadcastCompose.newBroadcast') : broadcast?.name || t('broadcastCompose.editBroadcast')}
        </h1>
        {broadcast && <StatusBadge status={broadcast.status} />}
      </div>

      {/* Progress bar for sending */}
      {isSending && broadcast && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">{t('broadcastCompose.sending')}</span>
            <span className="text-white">
              {broadcast.sentCount}/{broadcast.totalRecipients}
              {broadcast.failedCount > 0 && <span className="text-red-400 ml-1">({broadcast.failedCount} {t('common.failed')})</span>}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${broadcast.totalRecipients ? (broadcast.sentCount / broadcast.totalRecipients) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('broadcastCompose.broadcastName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isDraft}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm disabled:opacity-50"
              placeholder={t('broadcastCompose.broadcastNamePlaceholder')}
            />
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('broadcastCompose.messageHtml')}</label>
            {isDraft && (
              <div className="flex gap-1 mb-2">
                <button onClick={() => insertTag('b')} className="p-1.5 bg-gray-800 rounded hover:bg-gray-700" title="Bold"><Bold size={14} /></button>
                <button onClick={() => insertTag('i')} className="p-1.5 bg-gray-800 rounded hover:bg-gray-700" title="Italic"><Italic size={14} /></button>
                <button onClick={() => insertTag('code')} className="p-1.5 bg-gray-800 rounded hover:bg-gray-700" title="Code"><Code size={14} /></button>
                <button onClick={() => insertTag('a href=""')} className="p-1.5 bg-gray-800 rounded hover:bg-gray-700" title="Link"><Link size={14} /></button>
              </div>
            )}
            <textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isDraft}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-mono disabled:opacity-50 resize-y"
              placeholder={t('broadcastCompose.messagePlaceholder')}
            />
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">{t('broadcastCompose.preview')}</div>
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div
                  className="text-sm text-white prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br>') }}
                />
                {/* Button preview */}
                {buttons.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-gray-700/50 pt-3">
                    {buttons.map((btn) => (
                      <div
                        key={btn.id}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#3390ec]/20 border border-[#3390ec]/40 rounded-lg text-[#3390ec] text-sm font-medium"
                      >
                        {btn.type === 'url' && <ExternalLink size={13} />}
                        {btn.type === 'webapp' && <Smartphone size={13} />}
                        {btn.type === 'channel' && <MessageSquare size={13} />}
                        {btn.text || t('broadcastCompose.buttonPlaceholder')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inline Buttons Editor */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-400">{t('broadcastCompose.inlineButtons')}</label>
              {isDraft && (
                <button
                  onClick={addButton}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Plus size={14} /> {t('broadcastCompose.addButton')}
                </button>
              )}
            </div>

            {buttons.length === 0 && (
              <p className="text-xs text-gray-600">{t('broadcastCompose.noButtons')}</p>
            )}

            <div className="space-y-3">
              {buttons.map((btn) => (
                <div key={btn.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={btn.text}
                        onChange={(e) => updateButton(btn.id, 'text', e.target.value)}
                        disabled={!isDraft}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
                        placeholder={t('broadcastCompose.buttonText')}
                      />
                      <select
                        value={btn.type}
                        onChange={(e) => updateButton(btn.id, 'type', e.target.value)}
                        disabled={!isDraft}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
                      >
                        {BUTTON_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={btn.value}
                      onChange={(e) => updateButton(btn.id, 'value', e.target.value)}
                      disabled={!isDraft}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
                      placeholder={
                        btn.type === 'url' ? 'https://example.com'
                          : btn.type === 'webapp' ? 'https://webapp.example.com'
                            : '@channel_username'
                      }
                    />
                  </div>
                  {isDraft && (
                    <button
                      onClick={() => removeButton(btn.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 mt-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Targeting & Actions */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('broadcastCompose.targetAudience')}</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              disabled={!isDraft}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm mb-3 disabled:opacity-50"
            >
              <option value="ALL">{t('broadcastCompose.allUsers')}</option>
              <option value="BY_PLAN">{t('broadcastCompose.byPlan')}</option>
              <option value="BY_STATUS">{t('broadcastCompose.byStatus')}</option>
              <option value="SELECTED_USERS">{t('broadcastCompose.selectedUsers')}</option>
            </select>

            {targetType === 'BY_PLAN' && (
              <div className="space-y-1">
                {TIERS.map((tier) => (
                  <label key={tier} className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={targetPlans.includes(tier)}
                      onChange={(e) =>
                        setTargetPlans(e.target.checked ? [...targetPlans, tier] : targetPlans.filter((p) => p !== tier))
                      }
                      disabled={!isDraft}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    {tier}
                  </label>
                ))}
              </div>
            )}

            {targetType === 'BY_STATUS' && (
              <div className="space-y-1">
                {SUB_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={targetStatuses.includes(s)}
                      onChange={(e) =>
                        setTargetStatuses(e.target.checked ? [...targetStatuses, s] : targetStatuses.filter((st) => st !== s))
                      }
                      disabled={!isDraft}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    {s}
                  </label>
                ))}
              </div>
            )}

            {targetType === 'SELECTED_USERS' && isDraft && (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                    placeholder={t('broadcastCompose.searchUsers')}
                  />
                </div>

                {/* Search results dropdown */}
                {userSearchResults.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                    {userSearchResults.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => addUser(u)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm flex items-center gap-2"
                      >
                        <span className="text-white">{u.username || u.firstName || 'User'}</span>
                        {u.telegramId && <span className="text-gray-500 text-xs">#{String(u.telegramId)}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {isSearching && <p className="text-xs text-gray-500">{t('common.loading')}</p>}

                {/* Selected users chips */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedUsers.map((u) => (
                      <span
                        key={u.id}
                        className="flex items-center gap-1 bg-blue-600/20 text-blue-300 text-xs px-2 py-1 rounded-full"
                      >
                        {u.username || u.firstName || 'User'}
                        <button onClick={() => removeUser(u.id)} className="hover:text-white">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Show selected users read-only when not draft */}
            {targetType === 'SELECTED_USERS' && !isDraft && selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full"
                  >
                    {u.username || u.firstName || 'User'}
                  </span>
                ))}
              </div>
            )}

            {preview && (
              <div className="mt-3 p-2 bg-gray-800/50 rounded-lg text-center">
                <span className="text-2xl font-bold text-white">{preview.count}</span>
                <span className="text-gray-400 text-sm ml-1">{t('common.recipients')}</span>
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('broadcastCompose.scheduleOptional')}</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              disabled={!isDraft}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {isDraft && (
              <>
                <button
                  onClick={handleSave}
                  disabled={!name || !message}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
                >
                  <Save size={16} /> {t('broadcastCompose.saveDraft')}
                </button>
                {!isNew && (
                  <button
                    onClick={() => setConfirmSend(true)}
                    disabled={!name || !message}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                  >
                    <Send size={16} /> {t('broadcastCompose.sendNow')}
                  </button>
                )}
                {!isNew && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg"
                  >
                    <Trash2 size={16} /> {t('common.delete')}
                  </button>
                )}
              </>
            )}
            {isSending && (
              <button
                onClick={() => cancelMutation.mutate()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg"
              >
                <XCircle size={16} /> {t('broadcastCompose.cancelSending')}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSend}
        title={t('broadcastCompose.sendBroadcast')}
        message={t('broadcastCompose.sendConfirmMessage', { count: preview?.count || '?' })}
        confirmLabel={t('broadcastCompose.sendNow')}
        onConfirm={() => { sendMutation.mutate(); setConfirmSend(false); }}
        onCancel={() => setConfirmSend(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={t('broadcastCompose.deleteBroadcast')}
        message={t('broadcastCompose.deleteConfirmMessage')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => { deleteMutation.mutate(); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
