import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export default function LandingPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: 'Text AI',
      desc: 'GPT-4, Claude, Gemini and more',
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Image AI',
      desc: 'DALL-E, Flux, Midjourney',
      color: 'text-image-primary',
      bg: 'bg-image-primary/10',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Video AI',
      desc: 'Kling, Sora, Runway, Luma',
      color: 'text-video-primary',
      bg: 'bg-video-primary/10',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
      ),
      title: 'Audio AI',
      desc: 'ElevenLabs, Suno, voice cloning',
      color: 'text-audio-primary',
      bg: 'bg-audio-primary/10',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero */}
      <section className="px-4 pt-16 pb-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-content-primary mb-6 leading-tight">
            {t('auth:welcomeTitle', 'Welcome to VseoNix AI')}
          </h1>
          <p className="text-lg text-content-secondary mb-10 max-w-xl mx-auto">
            {t('auth:welcomeSubtitle', 'Access powerful AI models for text, image, video, and audio generation')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center" style={{ rowGap: 16, columnGap: 16 }}>
            {isAuthenticated ? (
              <Link
                to="/create"
                className="px-8 py-3 bg-brand-primary text-surface-bg font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors text-lg"
              >
                Start Creating
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/register"
                  className="px-8 py-3 bg-brand-primary text-surface-bg font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors text-lg"
                >
                  {t('auth:register', 'Get Started Free')}
                </Link>
                <Link
                  to="/auth/login"
                  className="px-8 py-3 border border-white/10 text-content-primary font-medium rounded-xl hover:bg-white/5 transition-colors text-lg"
                >
                  {t('auth:login', 'Log In')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ rowGap: 20, columnGap: 20 }}>
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-surface-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className={`w-14 h-14 ${f.bg} rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="text-content-primary font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-content-secondary text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="px-4 pb-20 text-center">
        <div className="max-w-2xl mx-auto bg-surface-card rounded-2xl p-10 border border-white/5">
          <h2 className="text-2xl font-display font-bold text-content-primary mb-4">
            Ready to start?
          </h2>
          <p className="text-content-secondary mb-8">
            Get free credits on signup. Upgrade anytime for more.
          </p>
          <Link
            to="/pricing"
            className="inline-block px-6 py-3 border border-brand-primary text-brand-primary font-medium rounded-xl hover:bg-brand-primary/10 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
