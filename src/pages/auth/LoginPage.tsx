/**
 * ════════════════════════════════════════════════════════════════
 *  صفحة تسجيل الدخول - نظام الرافدين HR
 *  (إعادة تصميم — بطاقة زجاجية Glassmorphism)
 *
 *  🔒 الأمان (محفوظ كما هو):
 *  1. لا localStorage.setItem('user') بعد تسجيل الدخول
 *     → المصادقة تعتمد على Supabase Session فقط
 *  2. نطاق البريد الموحَّد: @alrafidain.com
 *  3. حماية ضد Brute Force (rate limit) في sessionStorage
 *  4. مؤقت تلقائي لمسح رسالة الخطأ
 *  5. زر إظهار/إخفاء كلمة المرور مع aria-label
 *
 *  ✨ التحسينات في هذه النسخة:
 *  • تصميم زجاجي عصري (backdrop-blur + aurora متحركة)
 *  • زر "العودة للرئيسية" لإخراج المستخدم من الفخ
 *  • إزالة window.location.href = '/' — الاعتماد على store فقط
 *  • شريط ثقة (مشفّر / سريع / موثوق) لإحساس احترافي
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,
  ShieldCheck, ArrowRight, Lock, Zap, ArrowRight as ArrowBack,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';

interface LoginPageProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

// ── ثوابت ──────────────────────────────────────────────────────
const EMAIL_DOMAIN = '@alrafidain.com';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 دقائق

// ── مفتاح تخزين Brute Force (مؤقت فقط — بدون بيانات مستخدم) ──
const ATTEMPT_KEY = 'login_attempts';
const LOCKOUT_KEY = 'login_lockout';

// ════════════════════════════════════════════════════════════════
export default function LoginPage({ onNavigate, onBack }: LoginPageProps) {
  const { login: storeLogin } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingLockout, setRemainingLockout] = useState(0);

  // ── فحص الـ lockout عند التحميل ──────────────────────────────
  useEffect(() => {
    checkLockout();
    const interval = setInterval(() => {
      const remaining = getLockoutRemaining();
      setRemainingLockout(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── مسح رسالة الخطأ بعد 6 ثوانٍ ────────────────────────────
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  // ════════════════════════════════════════════════════════════
  //  Brute Force Protection (client-side layer)
  //  ملاحظة: الحماية الحقيقية تأتي من Supabase Auth rate limiting
  // ════════════════════════════════════════════════════════════

  const getLockoutRemaining = (): number => {
    const lockoutTime = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
    if (!lockoutTime) return 0;
    const remaining = lockoutTime - Date.now();
    if (remaining <= 0) {
      sessionStorage.removeItem(LOCKOUT_KEY);
      sessionStorage.removeItem(ATTEMPT_KEY);
      return 0;
    }
    return Math.ceil(remaining / 1000);
  };

  const checkLockout = () => {
    const remaining = getLockoutRemaining();
    setRemainingLockout(remaining);
  };

  const recordFailedAttempt = () => {
    const attempts = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10) + 1;
    sessionStorage.setItem(ATTEMPT_KEY, attempts.toString());

    if (attempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      sessionStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      setRemainingLockout(LOCKOUT_DURATION_MS / 1000);
    }
  };

  const clearAttempts = () => {
    sessionStorage.removeItem(ATTEMPT_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
    setRemainingLockout(0);
  };

  // ════════════════════════════════════════════════════════════
  //  التحقق من المدخلات
  // ════════════════════════════════════════════════════════════

  const validate = (): boolean => {
    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم');
      return false;
    }
    if (username.trim().length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return false;
    }
    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return false;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    return true;
  };

  // ════════════════════════════════════════════════════════════
  //  تسجيل الدخول
  //  🔒 لا localStorage.setItem('user') هنا
  //  → storeLogin يتولى: Supabase Auth + جلب البروفايل + تعيين isAuthenticated
  //  → بما في ذلك الإشعارات + الاشتراك في Realtime
  // ════════════════════════════════════════════════════════════

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      // فحص الـ lockout
      if (getLockoutRemaining() > 0) {
        setError(`تم تأمين الحساب مؤقتاً. انتظر ${remainingLockout} ثانية.`);
        return;
      }

      if (!validate()) return;
      setLoading(true);

      try {
        // ══ بناء البريد الإلكتروني ══
        // إذا أدخل المستخدم بريداً كاملاً → استخدمه مباشرة
        // وإلا → أضف النطاق الافتراضي
        const finalEmail = username.includes('@')
          ? username.trim().toLowerCase()
          : `${username.trim().toLowerCase()}${EMAIL_DOMAIN}`;

        // ══ تسجيل الدخول عبر دالة store.login() ══
        // هذه الدالة تتولى كل شيء:
        //   1. Supabase Auth (signInWithPassword)
        //   2. جلب البروفايل من profiles/employees
        //   3. تعيين isAuthenticated = true ← هذا ما كان مفقوداً!
        //   4. إرسال إشعارات الترحيب وتسجيل الدخول
        //   5. اشتراك Realtime لتحديثات البروفايل
        const success = await storeLogin(finalEmail, password);

        if (!success) {
          throw new Error('فشل تسجيل الدخول — تحقق من بياناتك');
        }

        clearAttempts();
        setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

      } catch (err: any) {
        recordFailedAttempt();

        const message = err?.message || '';

        if (
          message.includes('Invalid login credentials') ||
          message.includes('invalid_credentials')
        ) {
          const attempts = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10);
          const remaining = MAX_ATTEMPTS - attempts;
          setError(
            remaining > 0
              ? `اسم المستخدم أو كلمة المرور غير صحيحة. (${remaining} محاولة متبقية)`
              : 'تم تجاوز الحد المسموح به من المحاولات. انتظر 5 دقائق.',
          );
        } else if (message.includes('Email not confirmed')) {
          setError('الحساب غير مفعَّل. يرجى التواصل مع مدير النظام.');
        } else if (message.includes('Too many requests')) {
          setError('محاولات كثيرة جداً — انتظر بضع دقائق ثم حاول مجدداً.');
        } else if (message.includes('User not found')) {
          setError('المستخدم غير موجود في النظام.');
        } else if (
          message.includes('network') ||
          message.includes('fetch') ||
          message.includes('Failed to fetch')
        ) {
          setError('خطأ في الاتصال — تحقق من اتصالك بالإنترنت.');
        } else {
          setError(`خطأ غير متوقع: ${message}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [username, password, remainingLockout, storeLogin],
  );

  // ════════════════════════════════════════════════════════════
  //  واجهة المستخدم — بطاقة زجاجية
  // ════════════════════════════════════════════════════════════

  const isLocked = remainingLockout > 0;
  const lockoutMinutes = Math.floor(remainingLockout / 60);
  const lockoutSeconds = remainingLockout % 60;

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      dir="rtl"
    >
      {/* ══ أنماط محلية (aurora متحركة + شبكة + بطاقة زجاجية) ══ */}
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 20px) scale(0.95); }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 30px) scale(1.15); }
        }
        @keyframes aurora3 {
          0%, 100% { transform: translate(0, 0) scale(0.9); }
          50% { transform: translate(30px, 40px) scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }
        .aurora-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6; pointer-events: none; }
        .glass-card {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .login-input {
          transition: all 0.25s ease;
        }
        .login-input:focus {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }
        .shimmer-btn {
          background-image: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: shimmer 2.5s infinite;
        }
      `}</style>

      {/* ══ الخلفية المتدرّجة الأساسية ══ */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />

      {/* ══ كرات Aurora الضوئية المتحركة ══ */}
      <div
        className="aurora-blob"
        style={{
          width: 500, height: 500,
          top: '-10%', right: '-5%',
          background: 'radial-gradient(circle, #6366f1, transparent 70%)',
          animation: 'aurora1 18s ease-in-out infinite',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 450, height: 450,
          bottom: '-10%', left: '-5%',
          background: 'radial-gradient(circle, #8b5cf6, transparent 70%)',
          animation: 'aurora2 22s ease-in-out infinite',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 350, height: 350,
          top: '40%', left: '40%',
          background: 'radial-gradient(circle, #4f46e5, transparent 70%)',
          opacity: 0.35,
          animation: 'aurora3 25s ease-in-out infinite',
        }}
      />

      {/* ══ شبكة خفيفة ══ */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* ══ البطاقة الزجاجية ══ */}
      <div className="glass-card relative w-full max-w-md z-10">
        {/* زر العودة للرئيسية */}
        {onBack && (
          <button
            onClick={onBack}
            className="group absolute -top-14 right-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm font-semibold transition-all"
          >
            <ArrowBack size={16} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            العودة للرئيسية
          </button>
        )}

        {/* ══ البطاقة نفسها ══ */}
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* لمعة علوية */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* ══ الرأس (الشعار + الهوية) ══ */}
          <div className="px-8 pt-10 pb-7 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-[0_10px_30px_-5px_rgba(99,102,241,0.6)] mb-5 ring-1 ring-white/20">
              <ShieldCheck size={40} className="text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">شركة وادي الرافدين</h1>
            <p className="text-indigo-200/80 text-sm font-medium">لإنتاج المواد الصيدلانية</p>
          </div>

          {/* ══ جسم النموذج ══ */}
          <div className="px-8 pb-9">
            <p className="text-white/60 text-center text-sm mb-6">
              سجّل دخولك إلى نظام إدارة الموارد البشرية
            </p>

            {/* تنبيه القفل */}
            {isLocked && (
              <div className="mb-4 bg-orange-500/15 border border-orange-400/30 rounded-2xl px-4 py-3 flex items-start gap-3 backdrop-blur-sm">
                <AlertCircle size={18} className="text-orange-300 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-100">
                  <p className="font-semibold">الحساب مؤمَّن مؤقتاً</p>
                  <p className="mt-0.5">
                    انتظر{' '}
                    <span className="font-mono font-bold">
                      {lockoutMinutes > 0 ? `${lockoutMinutes}:` : ''}
                      {String(lockoutSeconds).padStart(2, '0')}
                    </span>{' '}
                    ثانية قبل المحاولة مجدداً
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* حقل اسم المستخدم */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-white/80 mb-1.5"
                >
                  اسم المستخدم
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="login-input w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 focus:bg-white/10 placeholder:text-white/35 disabled:opacity-50"
                  placeholder="مثال: ahmed.ali"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading || isLocked}
                  required
                />
                <p className="mt-1.5 text-xs text-white/40">
                  اسم المستخدم أو البريد الإلكتروني الكامل
                </p>
              </div>

              {/* حقل كلمة المرور */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-white/80 mb-1.5"
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="login-input w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 focus:bg-white/10 placeholder:text-white/35 disabled:opacity-50 pl-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading || isLocked}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
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
                <div className="bg-red-500/15 border border-red-400/30 text-red-100 rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm backdrop-blur-sm animate-[slideUp_0.3s_ease]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* رسالة النجاح */}
              {success && (
                <div className="bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium backdrop-blur-sm animate-[slideUp_0.3s_ease]">
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
                  <span>
                    انتظر {lockoutMinutes > 0 ? `${lockoutMinutes}:` : ''}
                    {String(lockoutSeconds).padStart(2, '0')} ث
                  </span>
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <ArrowRight size={18} />
                    {!loading && (
                      <span className="shimmer-btn absolute inset-0 pointer-events-none" />
                    )}
                  </>
                )}
              </button>
            </form>

            {/* تذييل */}
            <p className="text-center text-xs text-white/40 mt-6">
              للمساعدة التقنية تواصل مع{' '}
              <span className="text-indigo-300 font-medium">مدير النظام</span>
            </p>
          </div>
        </div>

        {/* ══ شريط الثقة ══ */}
        <div className="flex items-center justify-center gap-5 mt-6 text-white/50 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <Lock size={13} className="text-indigo-300" />
            مشفّر
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1.5">
            <Zap size={13} className="text-indigo-300" />
            سريع
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-indigo-300" />
            موثوق
          </span>
        </div>
      </div>
    </div>
  );
}
