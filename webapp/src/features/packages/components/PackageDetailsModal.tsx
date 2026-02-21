import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Modal, Badge, Skeleton } from '@/shared/ui';
import { usePackagesStore } from '@/features/packages/store/packagesStore';
import type { ModelCategory } from '@/types/model.types';

interface PackageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string | null;
}

const categoryIcons: Record<ModelCategory, string> = {
  VIDEO: '🎬',
  IMAGE: '🖼',
  AUDIO: '🎵',
  TEXT: '🤖',
};

const categoryOrder: ModelCategory[] = ['VIDEO', 'IMAGE', 'TEXT'];

export const PackageDetailsModal: React.FC<PackageDetailsModalProps> = ({
  isOpen,
  onClose,
  packageId,
}) => {
  const { t } = useTranslation();
  const { selectedPackageModels, isLoadingModels, fetchPackageModels, clearSelectedModels } =
    usePackagesStore();

  useEffect(() => {
    if (isOpen && packageId) {
      fetchPackageModels(packageId);
    }
    return () => clearSelectedModels();
  }, [isOpen, packageId, fetchPackageModels, clearSelectedModels]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('packages:whatsIncluded')}
      size="lg"
    >
      {isLoadingModels ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11" variant="rectangular" />
          ))}
        </div>
      ) : selectedPackageModels ? (
        <div className="pb-6">
          {categoryOrder.map((category) => {
            const models = selectedPackageModels.models[category];
            if (!models?.length) return null;

            return (
              <div key={category}>
                {/* Sticky category header */}
                <div className="sticky top-0 z-10 bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    {categoryIcons[category]} {category}
                  </span>
                </div>

                {/* Model list */}
                {models.map((model, i) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-900 text-[15px]">
                      {model.name}
                    </span>
                    <span className="shrink-0 ml-3">
                      {model.creditCost === 'unlimited' ? (
                        <Badge variant="cyan">
                          {t('models:unlimited', { defaultValue: 'Unlimited' })}
                        </Badge>
                      ) : model.creditRange ? (
                        <span className="text-gray-400 text-sm tabular-nums">
                          {model.creditRange[0]}-{model.creditRange[1]} tk
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm tabular-nums">
                          {model.creditCost} tk
                        </span>
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </Modal>
  );
};
