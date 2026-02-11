import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getTelegramInitData, isTelegramEnvironment } from '@/services/telegram/telegram';

const TOKEN_KEY = 'vseonix_access_token';
const REFRESH_KEY = 'vseonix_refresh_token';

const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Webapp API client — baseURL includes /api/webapp prefix
// Used for existing Telegram webapp endpoints (user, payment, subscriptions, etc.)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/webapp',
  timeout,
  headers: { 'Content-Type': 'application/json' },
});

// Root API client — no path prefix, resolves from origin
// Used for auth (/api/auth/*) and web chat (/api/web/chat/*) routes
export const rootApiClient = axios.create({
  timeout,
  headers: { 'Content-Type': 'application/json' },
});

// Shared request interceptor: attach auth headers
function attachAuth(config: InternalAxiosRequestConfig) {
  if (isTelegramEnvironment()) {
    const initData = getTelegramInitData();
    if (initData) {
      config.headers['X-Telegram-Init-Data'] = initData;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const tgid = urlParams.get('tgid');
    if (tgid) {
      config.headers['X-Telegram-Id'] = tgid;
    }
  } else {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
}

apiClient.interceptors.request.use(attachAuth);
rootApiClient.interceptors.request.use(attachAuth);

// Handle responses and token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

function createResponseInterceptor(client: typeof apiClient) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/api/auth/') &&
        !isTelegramEnvironment()
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return client(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (refreshToken) {
          try {
            const { data } = await axios.post('/api/auth/refresh', {
              refreshToken,
            });

            localStorage.setItem(TOKEN_KEY, data.accessToken);
            localStorage.setItem(REFRESH_KEY, data.refreshToken);

            processQueue(null, data.accessToken);
            isRefreshing = false;

            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
            return client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);

            if (window.location.pathname !== '/login') {
              window.location.href = '/auth/login';
            }

            return Promise.reject(refreshError);
          }
        }
      }

      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data?.message || 'An error occurred';
        return Promise.reject(new Error(message));
      }
      return Promise.reject(error);
    },
  );
}

createResponseInterceptor(apiClient);
createResponseInterceptor(rootApiClient);

export default apiClient;
