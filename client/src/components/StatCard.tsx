import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-teal-600',
  iconBg = 'bg-teal-50',
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-200 hover:shadow-md ${
        highlight
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 shadow-sm'
          : 'bg-white text-slate-800 border-slate-200/80 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-semibold ${
                  trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`mt-1 text-xs ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl shrink-0 ${highlight ? 'bg-white/10 text-teal-400' : `${iconBg} ${iconColor}`}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
