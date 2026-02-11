import axios from 'axios';
import { getTelegramInitData, isTelegramEnvironment } from '@/services/telegram/telegram';

const TOKEN_KEY = 'vseonix_access_token';
const REFRESH_KEY = 'vseonix_refresh_token';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth headers to every request
apiClient.interceptors.request.use((config) => {
  if (isTelegramEnvironment()) {
    // Telegram environment: use init data
    const initData = getTelegramInitData();
    if (initData) {
      config.headers['X-Telegram-Init-Data'] = initData;
    }

    // Fallback: pass telegramId from URL query param
    const urlParams = new URLSearchParams(window.location.search);
    const tgid = urlParams.get('tgid');
    if (tgid) {
      config.headers['X-Telegram-Id'] = tgid;
    }
  } else {
    // Web environment: use JWT token
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return config;
});

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not a refresh/auth request, try to refresh token
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
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
            { refreshToken }
          );

          localStorage.setItem(TOKEN_KEY, data.accessToken);
          localStorage.setItem(REFRESH_KEY, data.refreshToken);

          processQueue(null, data.accessToken);
          isRefreshing = false;

          originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          // Clear tokens and redirect to login
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);

          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      }
    }

    // Extract error message
    if (axios.isAxiosError(error) && error.response) {
      const message = error.response.data?.message || 'An error occurred';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
