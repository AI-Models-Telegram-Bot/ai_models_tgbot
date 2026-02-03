import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Target older browsers/WebViews for Telegram mobile compatibility
    // Safari 14 = iOS 14 WebView, Chrome 87 = older Android WebView
    target: ['es2015', 'chrome87', 'safari14'],
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'react-hot-toast'],
        },
      },
    },
  },
});
