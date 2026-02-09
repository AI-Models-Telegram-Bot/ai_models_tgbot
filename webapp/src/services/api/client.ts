import axios from 'axios';
import { getTelegramInitData } from '@/services/telegram/telegram';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Telegram init data to every request
apiClient.interceptors.request.use((config) => {
  const initData = getTelegramInitData();
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }

  // Fallback: pass telegramId from URL query param (set by bot WebApp buttons)
  const urlParams = new URLSearchParams(window.location.search);
  const tgid = urlParams.get('tgid');
  if (tgid) {
    config.headers['X-Telegram-Id'] = tgid;
  }

  return config;
});

// Handle API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const message = error.response.data?.message || 'An error occurred';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
