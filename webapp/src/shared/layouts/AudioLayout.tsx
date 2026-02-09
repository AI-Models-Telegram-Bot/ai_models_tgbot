import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export const AudioLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-audio-surface to-surface-secondary flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1a3d30',
            color: '#e2e8f0',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          },
        }}
      />
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
    </div>
  );
};
