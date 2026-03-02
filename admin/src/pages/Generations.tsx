import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Search, X, Clock, Zap, User, Cpu, AlertTriangle, Image, FileText } from 'lucide-react';

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

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-request-detail', selectedId],
    queryFn: () => api.get(`/requests/${selectedId}`).then((r) => r.data),
    enabled: !!selectedId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const columns = [
    {
      key: 'input',
      header: t('generations.input'),
      render: (r: any) => (
        <div className="max-w-xs truncate text-white">{r.inputText || t('common.noText')}</div>
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
      render: (r: any) => <StatusBadge status={r.status} />,
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

      {/* Detail Drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedId(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-lg bg-gray-900 border-l border-gray-800 overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-white">{t('generations.requestDetail')}</h2>
              <button onClick={() => setSelectedId(null)} className="p-1 hover:bg-gray-800 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : detail ? (
              <div className="p-4 space-y-4">
                {/* Status + Timing */}
                <div className="flex gap-3">
                  <StatusBadge status={detail.status} />
                  <StatusBadge status={detail.model?.category || '—'} />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Clock size={12} />
                      {t('generations.time')}
                    </div>
                    <div className="text-white font-medium">
                      {detail.processingTime ? `${(detail.processingTime / 1000).toFixed(1)}s` : '—'}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Zap size={12} />
                      {t('generations.credits')}
                    </div>
                    <div className="text-white font-medium">
                      {detail.creditsCharged?.toFixed(2) || '0'}
                    </div>
                  </div>
                </div>

                {/* User */}
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                    <User size={12} />
                    {t('generations.user')}
                  </div>
                  <div className="text-white text-sm">
                    {detail.user?.firstName || detail.user?.username || '—'}
                    {detail.user?.username && <span className="text-gray-500 ml-1">@{detail.user.username}</span>}
                  </div>
                  {detail.user?.telegramId && (
                    <div className="text-gray-500 text-xs mt-0.5">TG: {detail.user.telegramId}</div>
                  )}
                </div>

                {/* Model */}
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                    <Cpu size={12} />
                    {t('generations.model')}
                  </div>
                  <div className="text-white text-sm">{detail.model?.name || '—'}</div>
                  <div className="text-gray-500 text-xs">{detail.model?.provider} &middot; {detail.model?.slug}</div>
                  {detail.actualProvider && detail.actualProvider !== detail.model?.provider && (
                    <div className="text-yellow-400 text-xs mt-1">Actual: {detail.actualProvider}</div>
                  )}
                </div>

                {/* Input */}
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                    <FileText size={12} />
                    {t('generations.input')}
                  </div>
                  <div className="text-white text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {detail.inputText || t('common.noText')}
                  </div>
                  {detail.inputFileId && (
                    <div className="text-blue-400 text-xs mt-2">File: {detail.inputFileId}</div>
                  )}
                </div>

                {/* Output */}
                {(detail.outputText || detail.outputFileUrl) && (
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <Image size={12} />
                      {t('generations.output')}
                    </div>
                    {detail.outputText && (
                      <div className="text-white text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                        {detail.outputText}
                      </div>
                    )}
                    {detail.outputFileUrl && (
                      <div className="mt-2">
                        {detail.model?.category === 'IMAGE' ? (
                          <img
                            src={detail.outputFileUrl}
                            alt="output"
                            className="rounded-lg max-h-60 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <a
                            href={detail.outputFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm underline break-all"
                          >
                            {detail.outputFileUrl}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {detail.errorMessage && (
                  <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
                      <AlertTriangle size={12} />
                      {t('generations.error')}
                    </div>
                    <div className="text-red-300 text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto font-mono">
                      {detail.errorMessage}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-gray-800/50 rounded-xl p-3 space-y-1.5">
                  <div className="text-gray-500 text-xs font-medium mb-2">{t('generations.metadata')}</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ID</span>
                    <span className="text-gray-300 font-mono">{detail.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{t('generations.created')}</span>
                    <span className="text-gray-300">{new Date(detail.createdAt).toLocaleString()}</span>
                  </div>
                  {detail.completedAt && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t('generations.completed')}</span>
                      <span className="text-gray-300">{new Date(detail.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {detail.tokensCost > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t('generations.tokensCost')}</span>
                      <span className="text-gray-300">{detail.tokensCost}</span>
                    </div>
                  )}
                  {detail.walletCategory && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t('generations.walletCategory')}</span>
                      <span className="text-gray-300">{detail.walletCategory}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-gray-500 text-center">{t('generations.notFound')}</div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
