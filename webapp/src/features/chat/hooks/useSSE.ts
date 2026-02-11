import { useEffect, useRef, useState } from 'react';
import { chatApi } from '@/services/api/chat.api';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { isTelegramEnvironment, getTelegramInitData } from '@/services/telegram/telegram';

const TOKEN_KEY = 'vseonix_access_token';
const MAX_RECONNECT_DELAY = 16000;

/**
 * Custom hook that manages an EventSource (SSE) connection for a conversation.
 *
 * - Passes JWT auth via `?token=` query param (EventSource doesn't support headers).
 * - In Telegram environments, passes `?initData=` instead.
 * - Handles reconnection on disconnect with exponential back-off.
 * - Parses incoming events and updates the Zustand chat store.
 */
export function useSSE(conversationId: string | null) {
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
      reconnectDelayRef.current = 1000; // reset back-off
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

        const store = useChatStore.getState();

        // If content is streamed in, append token
        if (data.content) {
          store._appendContentToMessage(data.messageId, data.content);
        }

        // If fileUrl arrives, set it
        if (data.fileUrl) {
          store._updateMessage(data.messageId, { fileUrl: data.fileUrl });
        }

        // Terminal statuses
        if (data.status === 'COMPLETED') {
          store._updateMessage(data.messageId, { status: 'COMPLETED' });
        } else if (data.status === 'FAILED') {
          store._updateMessage(data.messageId, {
            status: 'FAILED',
            error: data.error ?? 'Unknown error',
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

      // Exponential back-off reconnect
      const delay = reconnectDelayRef.current;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        connect(convId);
      }, delay);
    };
  }

  return { isConnected };
}
