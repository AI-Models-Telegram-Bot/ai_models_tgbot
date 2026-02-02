import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { Skeleton } from '@/shared/ui';

const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ReferralPage = lazy(() => import('@/pages/ReferralPage'));

function LoadingFallback() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-28" variant="rectangular" />
      <Skeleton className="h-24" variant="rectangular" />
      <Skeleton className="h-64" variant="rectangular" />
    </div>
  );
}

export function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<ProfilePage />} />
          <Route path="/referral" element={<ReferralPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
