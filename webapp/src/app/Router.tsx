import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { AudioLayout } from '@/shared/layouts/AudioLayout';
import { ImageLayout } from '@/shared/layouts/ImageLayout';
import { VideoLayout } from '@/shared/layouts/VideoLayout';
import { Skeleton } from '@/shared/ui';

const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SubscriptionsPage = lazy(() => import('@/pages/SubscriptionsPage'));
const ReferralPage = lazy(() => import('@/pages/ReferralPage'));

const ElevenLabsVoicePage = lazy(() => import('@/pages/audio/ElevenLabsVoicePage'));
const SunoSettingsPage = lazy(() => import('@/pages/audio/SunoSettingsPage'));
const SoundGeneratorPage = lazy(() => import('@/pages/audio/SoundGeneratorPage'));

const ImageSettingsPage = lazy(() => import('@/pages/image/ImageSettingsPage'));
const VideoSettingsPage = lazy(() => import('@/pages/video/VideoSettingsPage'));

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
          <Route path="/" element={<SubscriptionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/referral" element={<ReferralPage />} />
        </Route>
        <Route element={<AudioLayout />}>
          <Route path="/audio/elevenlabs-voice" element={<ElevenLabsVoicePage />} />
          <Route path="/audio/suno" element={<SunoSettingsPage />} />
          <Route path="/audio/sound-generator" element={<SoundGeneratorPage />} />
        </Route>
        <Route element={<ImageLayout />}>
          <Route path="/image/settings" element={<ImageSettingsPage />} />
        </Route>
        <Route element={<VideoLayout />}>
          <Route path="/video/settings" element={<VideoSettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
