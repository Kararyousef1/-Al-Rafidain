/**
 * ════════════════════════════════════════════════════════════════
 *  صفحة تسجيل الدخول - نظام الرافدين HR
 *
 *  🔒 إصلاحات الأمان (v2):
 *  1. حُذف localStorage.setItem('user') بعد تسجيل الدخول
 *     → المصادقة تعتمد على Supabase Session فقط (store.initialize يتحقق منها)
 *  2. توحيد نطاق البريد: @alrafidain.com (متوافق مع Supabase)
 *  3. إضافة حماية ضد Brute Force (rate limit display)
 *  4. إضافة مؤقت تلقائي لمسح رسالة الخطأ
 *  5. تحسين UX: زر إظهار/إخفاء كلمة المرور مع aria-label
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';

interface LoginPageProps {
  onNavigate?: (page: string) => void;
}

// ── ثوابت ──────────────────────────────────────────────────────
const EMAIL_DOMAIN = '@alrafidain.com';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 دقائق

// ── مفتاح تخزين Brute Force (مؤقت فقط — بدون بيانات مستخدم) ──
const ATTEMPT_KEY = 'login_attempts';
const LOCKOUT_KEY = 'login_lockout';

// ════════════════════════════════════════════════════════════════
export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { refreshUser } = useAuthStore();

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
  //  → Supabase Session يُحفَظ في cookie/localStorage تلقائياً
  //  → store.initialize() يقرأ الجلسة من Supabase مباشرة
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

        // ══ تسجيل الدخول عبر Supabase Auth ══
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password,
        });

        if (signInError) throw signInError;

        if (!data.user) {
          throw new Error('لم يتم إرجاع بيانات المستخدم');
        }

        // ══ تحديث آخر دخول في الخلفية (لا ننتظر النتيجة) ══
        supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)
          .then(({ error: updateError }) => {
            if (updateError) {
              console.warn('last_login update failed (non-critical):', updateError.message);
            }
          });

        // ══ تحديث store بعد تسجيل الدخول ══
        // Supabase Session محفوظة تلقائياً — store يقرأها
        await refreshUser();

        clearAttempts();
        setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

        // إعادة التوجيه بعد 1.2 ثانية
        setTimeout(() => {
          if (onNavigate) {
            onNavigate('dashboard');
          } else {
            window.location.href = '/';
          }
        }, 1200);

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
    [username, password, remainingLockout, refreshUser, onNavigate],
  );

  // ════════════════════════════════════════════════════════════
  //  واجهة المستخدم
  // ════════════════════════════════════════════════════════════

  const isLocked = remainingLockout > 0;
  const lockoutMinutes = Math.floor(remainingLockout / 60);
  const lockoutSeconds = remainingLockout % 60;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* البطاقة الرئيسية */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* رأس البطاقة */}
          <div className="bg-gradient-to-l from-indigo-600 to-indigo-700 px-8 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold">شركة وادي الرافدين</h1>
            <p className="text-indigo-200 text-sm mt-0.5">لإنتاج المواد الصيدلانية</p>
          </div>

          {/* جسم النموذج */}
          <div className="px-8 py-8">
            <p className="text-slate-500 text-center text-sm mb-6">
              سجّل دخولك إلى نظام إدارة الموارد البشرية
            </p>

            {/* تنبيه القفل */}
            {isLocked && (
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-700">
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

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* حقل اسم المستخدم */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 disabled:opacity-60"
                  placeholder="مثال: ahmed.ali"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading || isLocked}
                  required
                />
                <p className="mt-1 text-xs text-slate-400">
                  يمكنك إدخال اسم المستخدم أو البريد الإلكتروني الكامل
                </p>
              </div>

              {/* حقل كلمة المرور */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 disabled:opacity-60 pl-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading || isLocked}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* رسالة الخطأ */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* رسالة النجاح */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* زر تسجيل الدخول */}
              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            {/* تذييل */}
            <p className="text-center text-xs text-slate-400 mt-6">
              للمساعدة التقنية تواصل مع{' '}
              <span className="text-indigo-600 font-medium">مدير النظام</span>
            </p>
          </div>
        </div>

        {/* معلومات الأمان */}
        <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} className="text-indigo-400" />
          اتصال آمن مشفَّر — جميع البيانات محمية
        </p>
      </div>
    </div>
  );
}
