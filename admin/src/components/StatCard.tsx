import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'emerald' | 'purple' | 'yellow' | 'red';
}

const colorMap = {
  blue: 'bg-blue-600/20 text-blue-400',
  emerald: 'bg-emerald-600/20 text-emerald-400',
  purple: 'bg-purple-600/20 text-purple-400',
  yellow: 'bg-yellow-600/20 text-yellow-400',
  red: 'bg-red-600/20 text-red-400',
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {trend && (
        <div className="mt-1 text-xs">
          <span className={trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray-500 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
