/**
 * ════════════════════════════════════════════════════════════════
 *  PinGate - شاشة التحقق من الهوية (PIN) للوحة المطور
 *  مستخرجة من DeveloperDashboard
 * ════════════════════════════════════════════════════════════════
 */

import { Lock, KeyRound, Shield } from 'lucide-react';

interface PinGateProps {
  pinInput: string;
  onPinChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PinGate({ pinInput, onPinChange, onSubmit }: PinGateProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-800 overflow-hidden animate-fade-in">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Lock size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">منطقة المطورين المحمية</h2>
          <p className="text-gray-400 mb-8 text-sm">
            أدخل رمز الأمان المكون من 4 أرقام للوصول إلى لوحة التحكم المتقدمة.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={20}
              />
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => onPinChange(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-12 py-4 text-center text-3xl font-mono text-white tracking-[0.5em] outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-lg shadow-lg shadow-rose-500/25 transition-all active:scale-95"
            >
              التحقق والدخول
            </button>
          </form>
          <p className="text-xs text-gray-600 mt-6 flex items-center justify-center gap-2">
            <Shield size={12} />
            جميع محاولات الدخول يتم تسجيلها ومراقبتها
          </p>
        </div>
      </div>
    </div>
  );
}
