/**
 * ════════════════════════════════════════════════════════════════
 *  LoginForm - نموذج تسجيل الدخول
 *  (الحقول + تنبيه القفل + رسائل الخطأ/النجاح + زر الإرسال)
 * ════════════════════════════════════════════════════════════════
 *
 *  لا يعرف شيئاً عن Supabase أو الـ store — يستقبل كل شيء عبر props
 *  ويُبلّغ الأب فقط بتغييرات الحقول والإرسال. هذا يجعله قابلاً
 *  للاختبار بمعزل عن منطق تسجيل الدخول الفعلي.
 * ════════════════════════════════════════════════════════════════
 */

import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  username: string;
  password: string;
  showPass: boolean;
  loading: boolean;
  isLocked: boolean;
  error: string;
  success: string;
  lockoutMinutes: number;
  lockoutSeconds: number;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleShowPass: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  username,
  password,
  showPass,
  loading,
  isLocked,
  error,
  success,
  lockoutMinutes,
  lockoutSeconds,
  onUsernameChange,
  onPasswordChange,
  onToggleShowPass,
  onSubmit,
}: LoginFormProps) {
  const lockoutLabel = `${lockoutMinutes > 0 ? `${lockoutMinutes}:` : ''}${String(
    lockoutSeconds,
  ).padStart(2, '0')}`;

  return (
    <>
      {/* تنبيه القفل */}
      {isLocked && (
        <div className="mb-4 bg-orange-500/15 border border-orange-400/30 rounded-2xl px-4 py-3 flex items-start gap-3 backdrop-blur-sm">
          <AlertCircle size={18} className="text-orange-300 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-100">
            <p className="font-semibold">الحساب مؤمَّن مؤقتاً</p>
            <p className="mt-0.5">
              انتظر <span className="font-mono font-bold">{lockoutLabel}</span> ثانية قبل
              المحاولة مجدداً
            </p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {/* حقل اسم المستخدم */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-white/80 mb-1.5">
            اسم المستخدم
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="login-input w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 focus:bg-white/10 placeholder:text-white/35 disabled:opacity-50"
            placeholder="مثال: ahmed.ali"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            disabled={loading || isLocked}
            required
          />
          <p className="mt-1.5 text-xs text-white/40">اسم المستخدم أو البريد الإلكتروني الكامل</p>
        </div>

        {/* حقل كلمة المرور */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-white/80 mb-1.5">
            كلمة المرور
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="login-input w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 focus:bg-white/10 placeholder:text-white/35 disabled:opacity-50 pl-12"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading || isLocked}
              required
            />
            <button
              type="button"
              onClick={onToggleShowPass}
              aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors p-1 rounded"
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="bg-red-500/15 border border-red-400/30 text-red-100 rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm backdrop-blur-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* رسالة النجاح */}
        {success && (
          <div className="bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium backdrop-blur-sm">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* زر تسجيل الدخول */}
        <button
          type="submit"
          disabled={loading || isLocked}
          className="relative w-full bg-gradient-to-l from-indigo-600 to-indigo-500 text-white rounded-xl py-3.5 font-bold hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_30px_-5px_rgba(99,102,241,0.5)] overflow-hidden"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>جاري تسجيل الدخول...</span>
            </>
          ) : isLocked ? (
            <span>انتظر {lockoutLabel} ث</span>
          ) : (
            <>
              <span>تسجيل الدخول</span>
              <ArrowRight size={18} />
              <span className="login-shimmer-btn absolute inset-0 pointer-events-none" />
            </>
          )}
        </button>
      </form>

      {/* تذييل */}
      <p className="text-center text-xs text-white/40 mt-6">
        للمساعدة التقنية تواصل مع <span className="text-indigo-300 font-medium">مدير النظام</span>
      </p>
    </>
  );
}
