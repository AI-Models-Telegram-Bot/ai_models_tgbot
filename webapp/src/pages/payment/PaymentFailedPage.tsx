import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PaymentFailedPage() {
  useTranslation(['subscriptions', 'common']);

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-display font-bold text-content-primary mb-3">
          Payment failed
        </h1>
        <p className="text-content-secondary mb-8">
          Something went wrong with your payment. You were not charged. Please try again.
        </p>

        <div className="flex flex-col" style={{ rowGap: 12 }}>
          <Link
            to="/subscriptions"
            className="px-6 py-3 bg-brand-primary text-surface-bg font-medium rounded-xl hover:bg-brand-primary/90 transition-colors"
          >
            Try Again
          </Link>
          <Link
            to="/"
            className="text-brand-primary text-sm hover:underline"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
