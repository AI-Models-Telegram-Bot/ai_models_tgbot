import React from 'react';
import { Outlet } from 'react-router-dom';

export const ImageLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-image-surface to-surface-secondary flex flex-col">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
    </div>
  );
};
