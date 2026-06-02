import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store';

const typeConfig = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-700', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2">
      {toasts.map(toast => {
        const config = typeConfig[toast.type as keyof typeof typeConfig] || typeConfig.info;
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg animate-slide-right max-w-sm ${config.bg}`}
          >
            <Icon size={18} className={config.iconColor} />
            <p className={`text-sm font-medium flex-1 ${config.text}`}>{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className={`${config.text} hover:opacity-70`}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
