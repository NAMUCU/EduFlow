'use client';

import { memo, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================
// TrendIcon 컴포넌트
// ============================================

interface TrendIconProps {
  trend: 'up' | 'down' | 'stable';
}

export const TrendIcon = memo(function TrendIcon({ trend }: TrendIconProps) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
});

// ============================================
// StatCard 컴포넌트
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: ReactNode;
  icon: ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export const StatCard = memo(function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
});
