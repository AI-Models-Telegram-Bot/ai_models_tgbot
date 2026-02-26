const statusColors: Record<string, string> = {
  // Request status
  PENDING: 'bg-yellow-600/20 text-yellow-400',
  PROCESSING: 'bg-blue-600/20 text-blue-400',
  COMPLETED: 'bg-emerald-600/20 text-emerald-400',
  FAILED: 'bg-red-600/20 text-red-400',
  STREAMING: 'bg-blue-600/20 text-blue-400',

  // Subscription status
  ACTIVE: 'bg-emerald-600/20 text-emerald-400',
  CANCELED: 'bg-gray-600/20 text-gray-400',
  EXPIRED: 'bg-red-600/20 text-red-400',
  PAST_DUE: 'bg-yellow-600/20 text-yellow-400',
  TRIALING: 'bg-purple-600/20 text-purple-400',

  // Subscription tiers
  FREE: 'bg-gray-600/20 text-gray-400',
  STARTER: 'bg-blue-600/20 text-blue-400',
  PRO: 'bg-purple-600/20 text-purple-400',
  PREMIUM: 'bg-yellow-600/20 text-yellow-400',
  BUSINESS: 'bg-emerald-600/20 text-emerald-400',
  ENTERPRISE: 'bg-red-600/20 text-red-400',

  // Broadcast status
  DRAFT: 'bg-gray-600/20 text-gray-400',
  SCHEDULED: 'bg-blue-600/20 text-blue-400',
  SENDING: 'bg-yellow-600/20 text-yellow-400',
  CANCELLED: 'bg-red-600/20 text-red-400',

  // Payment status
  SUCCEEDED: 'bg-emerald-600/20 text-emerald-400',
  WAITING_FOR_CAPTURE: 'bg-yellow-600/20 text-yellow-400',

  // User status
  blocked: 'bg-red-600/20 text-red-400',
  active: 'bg-emerald-600/20 text-emerald-400',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const color = statusColors[status] || 'bg-gray-600/20 text-gray-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
