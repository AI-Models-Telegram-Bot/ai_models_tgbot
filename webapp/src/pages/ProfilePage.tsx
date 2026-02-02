import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useProfileStore } from '@/features/profile/store/profileStore';
import { usePackagesStore } from '@/features/packages/store/packagesStore';
import { UserCard } from '@/features/profile/components/UserCard';
import { CurrentPlanCard } from '@/features/profile/components/CurrentPlanCard';
import { PackageCard } from '@/features/packages/components/PackageCard';
import { PackageDetailsModal } from '@/features/packages/components/PackageDetailsModal';
import { PaymentMethodSelector } from '@/features/payment/components/PaymentMethodSelector';
import { Skeleton } from '@/shared/ui';
import { getTelegramUser } from '@/services/telegram/telegram';
import type { PaymentMethod } from '@/types/payment.types';
import type { Package } from '@/types/package.types';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, wallet, currentPlan, isLoading, error, fetchUserProfile } =
    useProfileStore();
  const { packages, fetchPackages } = usePackagesStore();

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      fetchUserProfile(tgUser.id.toString());
    }
    fetchPackages();
  }, [fetchUserProfile, fetchPackages]);

  const handleDetailsClick = useCallback((packageId: string) => {
    setSelectedPackageId(packageId);
    setDetailsModalOpen(true);
  }, []);

  const handlePurchaseClick = useCallback((pkg: Package) => {
    setSelectedPackage(pkg);
    setPaymentModalOpen(true);
  }, []);

  const handlePaymentMethodSelect = useCallback((_method: PaymentMethod) => {
    // TODO: initiate payment flow with selected method
    setPaymentModalOpen(false);
  }, []);

  const scrollToPackages = useCallback(() => {
    document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-28 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-6 w-32 rounded" variant="rectangular" />
        <Skeleton className="h-72 rounded-2xl" variant="rectangular" />
        <Skeleton className="h-72 rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-text text-sm">{error}</p>
        <button
          onClick={() => {
            const tgUser = getTelegramUser();
            if (tgUser) fetchUserProfile(tgUser.id.toString());
          }}
          className="mt-4 text-purple-primary text-sm font-medium"
        >
          {t('common:retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* User profile + balance */}
      {user && wallet && (
        <>
          <UserCard user={user} wallet={wallet} />
          <CurrentPlanCard plan={currentPlan} onBuyCredits={scrollToPackages} />
        </>
      )}

      {/* Packages */}
      <section id="packages-section">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white text-xl font-bold mb-4"
        >
          {t('packages:title')}
        </motion.h2>

        <div className="space-y-4">
          {packages.map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={index}
              onDetailsClick={() => handleDetailsClick(pkg.id)}
              onPurchaseClick={() => handlePurchaseClick(pkg)}
            />
          ))}
        </div>

        {packages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-text">No packages available yet.</p>
          </motion.div>
        )}
      </section>

      {/* Modals */}
      <PackageDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        packageId={selectedPackageId}
      />

      <PaymentMethodSelector
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        pkg={selectedPackage}
        onSelect={handlePaymentMethodSelect}
      />
    </div>
  );
};

export default ProfilePage;
