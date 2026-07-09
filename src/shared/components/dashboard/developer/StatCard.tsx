/**
 * ════════════════════════════════════════════════════════════════
 *  StatCard - بطاقة إحصائية قابلة لإعادة الاستخدام
 *  مستخرجة من DeveloperDashboard لتحسين قابلية الصيانة
 * ════════════════════════════════════════════════════════════════
 */

import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  gradient: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all p-6">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -translate-y-8 translate-x-8`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon size={24} className="text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-lg ${
              trend === 'up'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}>
              {trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-3xl font-black text-gray-900 font-mono tracking-tight">{value}</p>
        <p className="text-base text-gray-600 mt-2">{title}</p>
      </div>
    </div>
  );
}
