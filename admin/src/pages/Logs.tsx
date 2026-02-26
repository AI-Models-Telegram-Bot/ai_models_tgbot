import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { RefreshCw } from 'lucide-react';

const SERVICES = ['api', 'bot', 'worker', 'webapp', 'admin'];
const LINE_COUNTS = [50, 100, 200, 500];

export default function Logs() {
  const { t } = useTranslation();
  const [service, setService] = useState('api');
  const [type, setType] = useState<'out' | 'stderr'>('out');
  const [lines, setLines] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const containerRef = useRef<HTMLPreElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-logs', service, type, lines],
    queryFn: () => api.get(`/logs/${service}`, { params: { type, lines } }).then((r) => r.data),
    refetchInterval: autoRefresh ? 10_000 : false,
  });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [data]);

  const colorize = (line: string) => {
    if (/error/i.test(line)) return 'text-red-400';
    if (/warn/i.test(line)) return 'text-yellow-400';
    if (/success|completed/i.test(line)) return 'text-emerald-400';
    if (/info/i.test(line)) return 'text-blue-300';
    return 'text-gray-300';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('logs.title')}</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {SERVICES.map((s) => (
            <button
              key={s}
              onClick={() => setService(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                service === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          <button
            onClick={() => setType('out')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              type === 'out' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('logs.stdout')}
          </button>
          <button
            onClick={() => setType('stderr')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              type === 'stderr' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('logs.stderr')}
          </button>
        </div>

        <select
          value={lines}
          onChange={(e) => setLines(Number(e.target.value))}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
        >
          {LINE_COUNTS.map((n) => (
            <option key={n} value={n}>{t('logs.lines', { count: n })}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded bg-gray-700 border-gray-600"
          />
          {t('logs.autoRefresh')}
        </label>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <pre
          ref={containerRef}
          className="p-4 overflow-auto max-h-[600px] text-xs font-mono leading-5"
        >
          {isLoading ? (
            <span className="text-gray-500">{t('logs.loadingLogs')}</span>
          ) : data?.logs ? (
            data.logs.split('\n').map((line: string, i: number) => (
              <div key={i} className={colorize(line)}>
                {line}
              </div>
            ))
          ) : (
            <span className="text-gray-500">{t('logs.noLogs')}</span>
          )}
        </pre>
      </div>
    </div>
  );
}
