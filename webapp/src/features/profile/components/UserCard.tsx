import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/shared/ui';
import { BalanceDisplay } from './BalanceDisplay';
import type { User, UserWallet } from '@/types/user.types';

interface UserCardProps {
  user: User;
  wallet: UserWallet;
}

export const UserCard: React.FC<UserCardProps> = ({ user, wallet }) => {
  const displayName = user.firstName || user.username || 'User';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-[72px] h-[72px] rounded-full border-2 border-brand-primary/30 bg-surface-elevated flex items-center justify-center overflow-hidden shrink-0">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-brand-primary/70">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name + Balance */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white text-xl font-semibold truncate">
                  {displayName}
                </p>
                {user.username && (
                  <p className="text-content-secondary text-sm truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expandable balance section */}
        <div className="mt-3">
          <BalanceDisplay wallet={wallet} />
        </div>
      </Card>
    </motion.div>
  );
};
