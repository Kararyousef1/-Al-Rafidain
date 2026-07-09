/**
 * ════════════════════════════════════════════════════════════════
 *  ServiceCard - بطاقة حالة خدمة
 *  مستخرجة من DeveloperDashboard لتحسين قابلية الصيانة
 * ════════════════════════════════════════════════════════════════
 */

import { Clock } from 'lucide-react';

type ServiceStatus = 'online' | 'offline' | 'degraded';

interface ServiceCardProps {
  service: {
    name: string;
    status: ServiceStatus;
    latency: number;
    uptime: number;
    lastCheck: string;
    icon: React.ComponentType<any>;
  };
}

const statusConfig: Record<ServiceStatus, {
  color: string;
  text: string;
  border: string;
  label: string;
}> = {
  online:   { color: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'متصل' },
  offline:  { color: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200',    label: 'غير متصل' },
  degraded: { color: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'متدهور' },
};

export default function ServiceCard({ service }: ServiceCardProps) {
  const config = statusConfig[service.status];
  const Icon = service.icon;

  return (
    <div className="relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${config.color} ${config.border} border flex items-center justify-center`}>
          <Icon size={18} className={config.text} />
        </div>
        <span className="text-sm font-bold text-gray-900">{service.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-100 rounded-lg px-2 py-1.5">
          <span className="text-gray-600">Latency</span>
          <span className="text-gray-900 font-mono ml-1">{service.latency}ms</span>
        </div>
        <div className="bg-gray-100 rounded-lg px-2 py-1.5">
          <span className="text-gray-600">Uptime</span>
          <span className="text-emerald-600 font-mono ml-1">{service.uptime}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        <Clock size={12} />
        آخر فحص: {service.lastCheck}
      </p>
    </div>
  );
}
