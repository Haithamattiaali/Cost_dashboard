import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'blue' | 'success' | 'warning';
  trend?: {
    value: number;
    isPositive: boolean;
    deltaValue?: string; // Formatted delta value to show alongside percentage
  } | null;
  subtitle?: string;
}

const colorClasses = {
  primary: 'border-[#9e1f63] text-[#9e1f63]',
  secondary: 'border-[#424046] text-[#424046]',
  accent: 'border-[#e05e3d] text-[#e05e3d]',
  blue: 'border-[#005b8c] text-[#005b8c]',
  success: 'border-green-500 text-green-600',
  warning: 'border-yellow-500 text-yellow-600',
};

export default function MetricCard({ title, value, icon, color = 'primary', trend, subtitle }: MetricCardProps) {
  return (
    <div className={`metric-card ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : ''} {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
                {trend.deltaValue && ` (${trend.deltaValue})`}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}