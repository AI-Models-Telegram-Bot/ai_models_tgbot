import { useEffect, useRef, useState } from 'react';
import { chatApi } from '@/services/api/chat.api';
import { useSectionsStore, type Category } from '../store/useSectionsStore';
import { isTelegramEnvironment, getTelegramInitData } from '@/services/telegram/telegram';

const TOKEN_KEY = 'vseonix_access_token';
const MAX_RECONNECT_DELAY = 16000;

/**
 * SSE hook for a specific section.
 * Writes to useSectionsStore for the given category.
 */
export function useSectionSSE(
  category: Category,
  conversationId: string | null,
  _resultMessageId: string | null,
) {
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);

  useEffect(() => {
    if (!conversationId) {
      cleanup();
      return;
    }

    connect(conversationId);

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function cleanup() {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setIsConnected(false);
  }

  function connect(convId: string) {
    cleanup();

    const baseUrl = chatApi.getStreamUrl(convId);
    const sep = baseUrl.includes('?') ? '&' : '?';

    let authParam: string;
    if (isTelegramEnvironment()) {
      const initData = getTelegramInitData();
      authParam = `initData=${encodeURIComponent(initData)}`;
    } else {
      const token = localStorage.getItem(TOKEN_KEY) ?? '';
      authParam = `token=${encodeURIComponent(token)}`;
    }

    const url = `${baseUrl}${sep}${authParam}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      reconnectDelayRef.current = 1000;
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          messageId?: string;
          content?: string;
          fileUrl?: string;
          status?: 'COMPLETED' | 'FAILED';
          error?: string;
        };

        if (!data.messageId) return;

        const store = useSectionsStore.getState();
        const section = store.sections[category];

        // Only process events for our result message
        if (section.resultMessageId && data.messageId !== section.resultMessageId) return;

        if (data.content) {
          store._appendContent(category, data.content);
        }

        if (data.fileUrl) {
          store._setResult(category, { resultFileUrl: data.fileUrl });
        }

        if (data.status === 'COMPLETED') {
          store._setResult(category, { resultStatus: 'COMPLETED' });
        } else if (data.status === 'FAILED') {
          store._setResult(category, {
            resultStatus: 'FAILED',
            resultError: data.error ?? 'Unknown error',
          });
        }
      } catch {
        // Ignore unparseable events
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      esRef.current = null;

      const delay = reconnectDelayRef.current;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        connect(convId);
      }, delay);
    };
  }

  return { isConnected };
}
