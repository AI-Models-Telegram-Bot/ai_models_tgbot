import React from 'react';
import { Card } from '@/shared/ui';
import { BalanceDisplay } from './BalanceDisplay';
import { getTelegramUser } from '@/services/telegram/telegram';
import type { User, UserWallet } from '@/types/user.types';

interface UserCardProps {
  user: User;
  wallet: UserWallet;
}

export const UserCard: React.FC<UserCardProps> = ({ user, wallet }) => {
  const displayName = user.firstName || user.username || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.profilePhoto || user.avatarUrl || getTelegramUser()?.photo_url;

  return (
    <Card>
      <div className="flex items-center">
        {/* Avatar */}
        <div
          className="rounded-full border border-border-strong bg-surface-elevated flex items-center justify-center overflow-hidden shrink-0"
          style={{ width: 56, height: 56, minWidth: 56 }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              width={56}
              height={56}
              className="object-cover rounded-full"
              style={{ width: 56, height: 56, display: 'block' }}
            />
          ) : (
            <span className="text-xl font-semibold text-content-secondary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + Balance */}
        <div className="flex-1 min-w-0 ml-3">
          <p className="text-content-primary text-lg font-semibold truncate">
            {displayName}
          </p>
          {user.username ? (
            <p className="text-content-secondary text-sm truncate">
              @{user.username}
            </p>
          ) : user.email ? (
            <p className="text-content-secondary text-sm truncate">
              {user.email}
            </p>
          ) : null}
        </div>
      </div>

      {/* Expandable balance section */}
      <div className="mt-4 pt-4 border-t border-border">
        <BalanceDisplay wallet={wallet} />
      </div>
    </Card>
  );
};
