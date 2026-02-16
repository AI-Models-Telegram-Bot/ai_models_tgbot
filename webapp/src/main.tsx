import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { initTelegramWebApp } from './services/telegram/telegram';
import './i18n/config';
import './styles/index.css';

// Signal to the timeout detector in index.html that the JS bundle loaded
(window as any).__appLoaded = true;

// When the user navigates back from an external page (e.g. YooKassa payment),
// the browser may restore a cached blank page. Force a reload to re-init the SPA.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

try {
  initTelegramWebApp();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  const msg = err instanceof Error ? err.message + '\n' + err.stack : String(err);
  const el = document.getElementById('loading-fallback');
  if (el) {
    el.style.whiteSpace = 'pre-wrap';
    el.style.padding = '20px';
    el.style.fontSize = '12px';
    el.style.color = '#ff6b6b';
    el.textContent = 'App failed to load:\n\n' + msg;
  }
  console.error('App failed to load:', err);
}
