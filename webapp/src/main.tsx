import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { initTelegramWebApp } from './services/telegram/telegram';
import './i18n/config';
import './styles/index.css';

// Initialize Telegram WebApp SDK
initTelegramWebApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
