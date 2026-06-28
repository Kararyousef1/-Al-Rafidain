/**
 * ════════════════════════════════════════════════════════════════
 *  Toast — إشعارات الـ UI السريعة
 * ════════════════════════════════════════════════════════════════
 *
 *  ✅ إصلاح #1: RTL — ثابت يمين بدل يسار (right-6 بدل left-6)
 *  ✅ إصلاح #2: انيميشن من اليمين (slide-in-from-right) صحيح للعربي
 *  ✅ إضافة: دعم duration مخصص لكل toast
 *  ✅ إضافة: أنواع واضحة لـ ToastType
 *
 * ════════════════════════════════════════════════════════════════
 */

import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store';

// ─── إعداد الألوان والأيقونات لكل نوع ──────────────────────────

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-500',
  },
} as const;

// ─── المكوّن ────────────────────────────────────────────────────

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    /*
     * ✅ RTL Fix:
     *   - right-6  بدل left-6  (يظهر في الزاوية السفلية اليمنى)
     *   - animate-in slide-in-from-right بدل slide-in-from-left
     */
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2"
      role="region"
      aria-label="الإشعارات"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const config =
          TYPE_CONFIG[toast.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={[
              'flex items-center gap-3 p-4 rounded-xl border shadow-lg',
              'animate-in slide-in-from-right-5 duration-300',
              'max-w-sm w-full',
              config.bg,
            ].join(' ')}
            role="alert"
          >
            <Icon
              size={18}
              className={`${config.iconColor} flex-shrink-0`}
              aria-hidden="true"
            />
            <p className={`text-sm font-medium flex-1 leading-snug ${config.text}`}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`${config.text} hover:opacity-70 transition-opacity flex-shrink-0 p-0.5 rounded`}
              aria-label="إغلاق الإشعار"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}