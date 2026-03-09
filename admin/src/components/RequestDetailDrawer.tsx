import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from './StatusBadge';
import { MediaDisplay, ErrorDisplay } from './MediaPreview';
import { X, Clock, Zap, User, Cpu, FileText, Image, AlertTriangle, ExternalLink } from 'lucide-react';

interface RequestDetailDrawerProps {
  requestId: string | null;
  onClose: () => void;
  showUserLink?: boolean;
}

export default function RequestDetailDrawer({ requestId, onClose, showUserLink = true }: RequestDetailDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['admin-request-detail', requestId],
    queryFn: () => api.get(`/requests/${requestId}`).then((r) => r.data),
    enabled: !!requestId,
  });

  if (!requestId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-gray-900 border-l border-gray-800 overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-white">{t('generations.requestDetail')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : detail ? (
          <div className="p-4 space-y-4">
            {/* Status + Category */}
            <div className="flex gap-3 flex-wrap">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.model?.category || '—'} />
              {detail.actualProvider && detail.actualProvider !== detail.model?.provider && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800/50">
                  Routed: {detail.actualProvider}
                </span>
              )}
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
            {showUserLink && (
              <div
                className="bg-gray-800/50 rounded-xl p-3 cursor-pointer hover:bg-gray-800/80 transition-colors"
                onClick={() => { onClose(); navigate(`/users/${detail.user?.id}`); }}
              >
                <div className="flex items-center justify-between">
                  <div>
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
                  <ExternalLink size={14} className="text-gray-600" />
                </div>
              </div>
            )}

            {/* Model */}
            <div className="bg-gray-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Cpu size={12} />
                {t('generations.model')}
              </div>
              <div className="text-white text-sm">{detail.model?.name || '—'}</div>
              <div className="text-gray-500 text-xs">{detail.model?.provider} &middot; {detail.model?.slug}</div>
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
                <div className="text-blue-400 text-xs mt-2 font-mono">File: {detail.inputFileId}</div>
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
                <MediaDisplay url={detail.outputFileUrl} category={detail.model?.category} />
              </div>
            )}

            {/* Error */}
            {detail.errorMessage && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
                  <AlertTriangle size={12} />
                  {t('generations.error')}
                </div>
                <ErrorDisplay error={detail.errorMessage} />
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-800/50 rounded-xl p-3 space-y-1.5">
              <div className="text-gray-500 text-xs font-medium mb-2">{t('generations.metadata')}</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">ID</span>
                <span className="text-gray-300 font-mono text-[11px]">{detail.id}</span>
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
