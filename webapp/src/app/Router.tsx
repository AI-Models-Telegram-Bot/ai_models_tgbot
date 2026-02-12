import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { WebLayout } from '@/shared/layouts/WebLayout';
import { AudioLayout } from '@/shared/layouts/AudioLayout';
import { ImageLayout } from '@/shared/layouts/ImageLayout';
import { VideoLayout } from '@/shared/layouts/VideoLayout';
import { Skeleton } from '@/shared/ui';
import { isTelegramEnvironment } from '@/services/telegram/telegram';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

// Existing pages
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SubscriptionsPage = lazy(() => import('@/pages/SubscriptionsPage'));
const ReferralPage = lazy(() => import('@/pages/ReferralPage'));

const ElevenLabsVoicePage = lazy(() => import('@/pages/audio/ElevenLabsVoicePage'));
const SunoSettingsPage = lazy(() => import('@/pages/audio/SunoSettingsPage'));
const SoundGeneratorPage = lazy(() => import('@/pages/audio/SoundGeneratorPage'));

const ImageSettingsPage = lazy(() => import('@/pages/image/ImageSettingsPage'));
const VideoSettingsPage = lazy(() => import('@/pages/video/VideoSettingsPage'));

// New web pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const CreatePage = lazy(() => import('@/pages/CreatePage'));

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// Payment pages
const PaymentSuccessPage = lazy(() => import('@/pages/payment/PaymentSuccessPage'));
const PaymentFailedPage = lazy(() => import('@/pages/payment/PaymentFailedPage'));

// Legal pages
const PublicOfferPage = lazy(() => import('@/pages/legal/PublicOfferPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'));
const ContactsPage = lazy(() => import('@/pages/legal/ContactsPage'));

function LoadingFallback() {
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
      <Skeleton className="h-28 w-full rounded-2xl" variant="rectangular" />
      <Skeleton className="h-24 w-full rounded-2xl" variant="rectangular" />
      <Skeleton className="h-64 w-full rounded-2xl" variant="rectangular" />
    </div>
  );
}

/**
 * Auth guard — redirects to login if not authenticated.
 * In Telegram environment, always allows access.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isTelegramEnvironment()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Redirect away from auth pages if already logged in.
 */
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isTelegramEnvironment()) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to="/create" replace />;
  }

  return <>{children}</>;
}

export function Router() {
  const isTelegram = isTelegramEnvironment();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {isTelegram ? (
          // ── Telegram mini app routes (existing behavior) ──
          <>
            <Route element={<MainLayout />}>
              <Route path="/" element={<SubscriptionsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
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
          </>
        ) : (
          // ── Web browser routes ──
          <>
            {/* Public auth routes */}
            <Route path="/auth/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
            <Route path="/auth/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            {/* Payment callback pages (public) */}
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failed" element={<PaymentFailedPage />} />

            {/* Web layout routes */}
            <Route element={<WebLayout />}>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<SubscriptionsPage />} />
              <Route path="/public-offer" element={<PublicOfferPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contacts" element={<ContactsPage />} />

              {/* Protected */}
              <Route path="/create" element={<RequireAuth><CreatePage /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/subscriptions" element={<RequireAuth><SubscriptionsPage /></RequireAuth>} />
              <Route path="/referral" element={<RequireAuth><ReferralPage /></RequireAuth>} />

              {/* Settings (protected) */}
              <Route path="/audio/elevenlabs-voice" element={<RequireAuth><ElevenLabsVoicePage /></RequireAuth>} />
              <Route path="/audio/suno" element={<RequireAuth><SunoSettingsPage /></RequireAuth>} />
              <Route path="/audio/sound-generator" element={<RequireAuth><SoundGeneratorPage /></RequireAuth>} />
              <Route path="/image/settings" element={<RequireAuth><ImageSettingsPage /></RequireAuth>} />
              <Route path="/video/settings" element={<RequireAuth><VideoSettingsPage /></RequireAuth>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Suspense>
  );
}
