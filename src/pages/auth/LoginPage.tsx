import { useState } from 'react';
import { Eye, EyeOff, Shield, BarChart3, Users, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

const WPC_LOGO = 'data:image/jpeg;base64,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';

// الحسابات المحلية - يمكن تسجيل الدخول مباشرة بدون Supabase
const LOCAL_ACCOUNTS: Record<string, { username: string; password: string; role: string; full_name: string }> = {
  'dev': {
    username: 'dev',
    password: 'dev123',
    role: 'developer',
    full_name: 'مطور النظام',
  },
  'admin': {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    full_name: 'مدير النظام',
  },
  'hr': {
    username: 'hr',
    password: 'hr123',
    role: 'hr',
    full_name: 'مسؤول الموارد البشرية',
  },
  'gatekeeper': {
    username: 'gatekeeper',
    password: 'gate123',
    role: 'gatekeeper',
    full_name: 'مسؤول البوابة',
  },
  'employee': {
    username: 'employee',
    password: 'emp123',
    role: 'employee',
    full_name: 'موظف',
  },
};

const ROLE_MAP: Record<string, string> = {
  'dev': 'developer',
  'admin': 'admin',
  'hr': 'hr',
  'gatekeeper': 'gatekeeper',
  'employee': 'employee',
  'developer': 'developer',
  'administrator': 'admin',
};

const features = [
  { icon: Shield,   en: 'Privacy First',    ar: 'الخصوصية أولاً',    desc: 'Anonymous reporting · الإبلاغ المجهول' },
  { icon: BarChart3,en: 'Smart Analytics',  ar: 'تحليلات ذكية',      desc: 'Real-time insights · رؤى فورية' },
  { icon: Users,    en: 'Team Connect',     ar: 'تواصل الفريق',     desc: 'Secure channels · قنوات آمنة' },
  { icon: Zap,      en: 'AI-Powered',       ar: 'ذكاء اصطناعي',     desc: 'Auto analysis · تحليل تلقائي' },
];

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const clearErr = () => setError('');

  const validate = (): boolean => {
    if (!username.trim()) { setError('يرجى إدخال اسم المستخدم · Please enter your username'); return false; }
    if (username.trim().length < 2) { setError('اسم المستخدم قصير جداً · Username is too short (min 2)'); return false; }
    if (!password) { setError('يرجى إدخال كلمة المرور · Please enter your password'); return false; }
    if (password.length < 5) { setError('كلمة المرور قصيرة جداً · Password is too short (min 5)'); return false; }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validate()) return;
    setLoading(true);
    
    try {
      // التحقق من الحسابات المحلية أولاً
      const localAccount = LOCAL_ACCOUNTS[username.trim().toLowerCase()];
      if (localAccount && password === localAccount.password) {
        // تسجيل دخول محلي باستخدام store
        const { loginLocal } = useAuthStore.getState();
        loginLocal(localAccount.username, localAccount.role, localAccount.full_name);
        
        // ── حفظ جميع الحسابات المحلية في localStorage للوحات العرض ──
        // يتم دمجها مع أي مستخدمين محليين موجودين (لا نحذف المحذوفين)
        const existingLocal = (() => { try { return JSON.parse(localStorage.getItem('local_employees') || '[]'); } catch { return []; } })();
        const existingIds = new Set(existingLocal.map((e: any) => e.id));
        const allLocalEmployees = Object.entries(LOCAL_ACCOUNTS).map(([key, acc]) => {
          const existing = existingLocal.find((e: any) => e.id === `local-${key}`);
          if (existing) return existing; // Keep existing (may have been modified/deleted)
          return {
            id: `local-${key}`,
            full_name: acc.full_name,
            email: `${acc.username}@kayan.hr`,
            role: acc.role,
            department: acc.role === 'gatekeeper' ? 'الأمن' : acc.role === 'hr' ? 'الموارد البشرية' : acc.role === 'developer' ? 'تقنية المعلومات' : acc.role === 'admin' ? 'الإدارة' : 'الإنتاج',
            position: acc.role === 'developer' ? 'مطور نظام' : acc.role === 'admin' ? 'مدير نظام' : acc.role === 'hr' ? 'مسؤول موارد بشرية' : acc.role === 'gatekeeper' ? 'حارس أمن' : 'موظف',
            phone: null,
            status: 'active',
            rank: 'employee',
            manufacturing_dept: 'management',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });
        localStorage.setItem('local_employees', JSON.stringify(allLocalEmployees));
        
        const roleNames: Record<string, string> = {
          'developer': 'مطور النظام',
          'admin': 'مدير النظام',
          'hr': 'مسؤول الموارد البشرية',
          'gatekeeper': 'مسؤول البوابة',
          'employee': 'موظف',
        };
        
        setSuccess(`تم تسجيل الدخول بنجاح! مرحباً ${roleNames[localAccount.role] || 'مستخدم'} · Login successful!`);
        setTimeout(() => { window.location.href = '/'; }, 1200);
        return;
      }
      
      // التحقق عبر Supabase باستخدام البريد/اسم المستخدم
      // اسم المستخدم بدون @ يُحوَّل تلقائياً إلى صيغة البريد الداخلي المعتمدة
      // في إنشاء الحسابات (username@kayan.hr) لضمان تطابق طريقة الدخول مع طريقة الإنشاء.
      const finalEmail = username.includes('@') ? username.trim() : `${username.trim()}@kayan.hr`;
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password,
      });
      if (signInError) throw signInError;
      if (data.user) {
        // جلب الملف الشخصي الفعلي من قاعدة البيانات (الدور والصلاحيات الحقيقية)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const userRole = profile?.role ?? ROLE_MAP[username.trim().toLowerCase()] ?? 'employee';

        // تحديث وقت آخر دخول (لا نعيد كتابة الدور حتى لا نطمس قيمة المدير)
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);

        // حفظ بيانات المستخدم في localStorage كاحتياط
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          username: (profile?.email ?? finalEmail).split('@')[0],
          role: userRole,
          full_name: profile?.full_name ?? data.user.user_metadata?.full_name ?? 'مستخدم النظام',
        }));
        localStorage.setItem('userRole', userRole);
      }
      setSuccess('تم تسجيل الدخول بنجاح! · Login successful! Redirecting…');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } catch (err: any) {
      const m = err?.message ?? '';
      if (m.includes('Email not confirmed'))           setError('الحساب غير مؤكد · Account unconfirmed — disable "Confirm email" in Supabase');
      else if (m.includes('Invalid login credentials') || m.includes('invalid_credentials')) setError('اسم المستخدم أو كلمة المرور غير صحيحة · Invalid username or password');
      else if (m.includes('Too many'))                 setError('محاولات كثيرة — انتظر قليلاً · Too many attempts, please wait');
      else if (m.includes('network') || m.includes('fetch')) setError('خطأ في الاتصال · Network error — check your connection');
      else                                             setError('حدث خطأ · An error occurred — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes lr-spin    { to { transform: rotate(360deg); } }
        @keyframes lr-fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lr-slideIn { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lr-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.45);} 60%{box-shadow:0 0 0 7px rgba(34,197,94,0);} }

        .lr-root {
          min-height: 100vh;
          display: flex;
          background: #f5f2ee;
          font-family: 'Cairo', 'Outfit', sans-serif;
        }

        /* ── Brand Panel ─────────────────────────────── */
        .lr-brand {
          width: 460px;
          flex-shrink: 0;
          background: #080808;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 2.75rem 2.5rem;
        }
        .lr-brand::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 180px; height: 180px;
          background: #c41c1c;
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
        .lr-brand::after {
          content: '';
          position: absolute;
          bottom: -130px; left: -130px;
          width: 380px; height: 380px;
          border: 1px solid rgba(196,28,28,.14);
          border-radius: 50%;
        }
        .lr-brand-inner {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* logo row */
        .lr-logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 3.5rem;
        }
        .lr-logo-badge {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          flex-shrink: 0;
        }
        .lr-logo-badge img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .lr-logo-name {
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: white;
          letter-spacing: .06em;
          line-height: 1.15;
        }
        .lr-logo-sub {
          font-family: 'Cairo', sans-serif;
          font-size: .72rem;
          color: rgba(255,255,255,.45);
          margin-top: 3px;
          letter-spacing: .01em;
        }

        /* headline */
        .lr-headline { margin-top: auto; }
        .lr-head-en {
          font-family: 'Outfit', sans-serif;
          font-size: 2.35rem;
          font-weight: 900;
          color: white;
          line-height: 1.15;
        }
        .lr-head-ar {
          font-family: 'Cairo', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: rgba(255,255,255,.45);
          margin-top: 6px;
        }
        .lr-rule {
          width: 36px; height: 3px;
          background: #c41c1c;
          border-radius: 2px;
          margin: 1.4rem 0;
        }
        .lr-desc {
          font-size: .88rem;
          color: rgba(255,255,255,.38);
          line-height: 1.85;
          font-family: 'Cairo', sans-serif;
          margin-bottom: 2rem;
        }

        /* features */
        .lr-features { display: flex; flex-direction: column; gap: .65rem; }
        .lr-feat {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: .8rem 1rem;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px;
          background: rgba(255,255,255,.025);
          transition: border-color .22s, background .22s;
        }
        .lr-feat:hover {
          border-color: rgba(196,28,28,.35);
          background: rgba(196,28,28,.06);
        }
        .lr-feat-icon {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: rgba(196,28,28,.18);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lr-feat-en {
          font-family: 'Outfit', sans-serif;
          font-size: .8rem;
          font-weight: 700;
          color: white;
        }
        .lr-feat-ar {
          font-family: 'Cairo', sans-serif;
          font-size: .72rem;
          color: rgba(255,255,255,.38);
          margin-top: 2px;
        }

        /* version badge */
        .lr-badge {
          margin-top: 1.75rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 40px;
          font-size: .73rem;
          color: rgba(255,255,255,.45);
          font-family: 'Outfit', sans-serif;
          letter-spacing: .03em;
        }
        .lr-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: lr-pulse 2.4s infinite;
        }

        /* ── Form Panel ──────────────────────────────── */
        .lr-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          position: relative;
          background: #f5f2ee;
        }
        .lr-form-panel::before {
          content:'';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(ellipse at 70% 15%, rgba(196,28,28,.05) 0%, transparent 55%);
          pointer-events: none;
        }

        .lr-form-wrap {
          width: 100%;
          max-width: 410px;
          animation: lr-fadeUp .45s ease both;
        }

        /* mobile logo */
        .lr-mob-logo {
          display: none;
          align-items: center;
          gap: 12px;
          margin-bottom: 2rem;
        }
        .lr-mob-logo-badge {
          width: 46px; height: 46px;
          border-radius: 11px;
          background: white;
          display: flex; align-items: center; justify-content: center;
          padding: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,.1);
        }
        .lr-mob-logo-badge img { width:100%; height:100%; object-fit:contain; }
        .lr-mob-en {
          font-family: 'Outfit', sans-serif;
          font-size: .95rem; font-weight: 800;
          color: #0a0a0a; letter-spacing:.04em;
        }
        .lr-mob-ar {
          font-family: 'Cairo', sans-serif;
          font-size: .72rem; color: #999; margin-top: 2px;
        }

        /* welcome */
        .lr-welcome-en {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem; font-weight: 900;
          color: #0a0a0a; line-height: 1.15;
        }
        .lr-welcome-ar {
          font-family: 'Cairo', sans-serif;
          font-size: 1rem; font-weight: 600;
          color: #888; margin-top: 6px;
        }
        .lr-form-rule {
          width: 28px; height: 3px;
          background: #c41c1c;
          border-radius: 2px;
          margin: 1.25rem 0 2rem;
        }

        /* fields */
        .lr-fields { display:flex; flex-direction:column; gap:1.25rem; margin-bottom:1.25rem; }

        .lr-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }
        .lr-label-en {
          font-family: 'Outfit', sans-serif;
          font-size: .72rem; font-weight: 700;
          color: #444; letter-spacing: .08em;
          text-transform: uppercase;
        }
        .lr-label-ar {
          font-family: 'Cairo', sans-serif;
          font-size: .8rem; font-weight: 600;
          color: #888; margin-right: 6px;
          text-transform: none; letter-spacing: 0;
        }
        .lr-forgot {
          font-family: 'Cairo', sans-serif;
          font-size: .78rem; font-weight: 700;
          color: #c41c1c;
          background: none; border: none;
          cursor: pointer;
          transition: opacity .18s;
        }
        .lr-forgot:hover { opacity: .65; }

        .lr-input-wrap { position: relative; }
        .lr-input {
          width: 100%;
          padding: .88rem 1.1rem;
          background: white;
          border: 1.5px solid #e5e0d8;
          border-radius: 12px;
          font-size: .95rem;
          color: #0a0a0a;
          font-family: 'Outfit', 'Cairo', sans-serif;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .lr-input:focus {
          border-color: #c41c1c;
          box-shadow: 0 0 0 3px rgba(196,28,28,.09);
        }
        .lr-input::placeholder { color: #c5bfb5; }
        .lr-input-pass { padding-left: 3.2rem; }

        .lr-eye {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer;
          color: #b0a89e;
          display: flex; align-items: center;
          transition: color .2s;
          padding: 0;
        }
        .lr-eye:hover { color: #c41c1c; }

        /* alerts */
        .lr-alert {
          border-radius: 10px;
          padding: .72rem 1rem;
          font-size: .85rem;
          margin-bottom: 1rem;
          font-family: 'Cairo', sans-serif;
          animation: lr-slideIn .22s ease;
          line-height: 1.55;
        }
        .lr-alert-err { background:#fff1f2; border:1px solid #fecdd3; color:#b91c1c; }
        .lr-alert-ok  { background:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; font-weight:600; text-align:center; }

        /* submit */
        .lr-submit {
          width: 100%;
          padding: 1rem;
          background: #0a0a0a;
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: .95rem;
          letter-spacing: .03em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
          transition: box-shadow .25s, transform .15s;
        }
        .lr-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #c41c1c;
          transform: translateX(101%);
          transition: transform .32s cubic-bezier(.4,0,.2,1);
        }
        .lr-submit:hover::before   { transform: translateX(0); }
        .lr-submit:hover           { box-shadow: 0 8px 24px rgba(196,28,28,.28); }
        .lr-submit:active          { transform: scale(.985); }
        .lr-submit:disabled        { opacity:.6; cursor:not-allowed; }
        .lr-submit:disabled::before{ display:none; }
        .lr-submit-inner           { position:relative; z-index:1; display:flex; align-items:center; gap:9px; }
        .lr-spinner {
          width: 17px; height: 17px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: white;
          border-radius: 50%;
          animation: lr-spin .7s linear infinite;
        }

        /* footer */
        .lr-footer {
          text-align: center;
          margin-top: 1.4rem;
          font-size: .85rem;
          color: #999;
          font-family: 'Cairo', sans-serif;
        }
        .lr-footer button {
          color: #c41c1c; font-weight: 700;
          background: none; border: none;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: .85rem;
          transition: opacity .18s;
          margin-right: 4px;
        }
        .lr-footer button:hover { opacity: .65; }

        /* ── Responsive ───────────────────────────────── */
        @media (max-width: 1024px) {
          .lr-brand    { display: none; }
          .lr-mob-logo { display: flex; }
          .lr-form-panel { align-items: flex-start; padding-top: 3.5rem; }
        }
        @media (max-width: 520px) {
          .lr-form-panel { padding: 2.5rem 1.25rem; }
          .lr-welcome-en { font-size: 1.7rem; }
        }
      `}</style>

      <div className="lr-root" dir="rtl">

        {/* ── Brand Panel ── */}
        <aside className="lr-brand">
          <div className="lr-brand-inner">

            <div className="lr-logo-row">
              <div className="lr-logo-badge">
                <img src={WPC_LOGO} alt="WPC Logo" />
              </div>
              <div>
                <div className="lr-logo-name">AL-RAFIDAIN HR</div>
                <div className="lr-logo-sub">الرافدين للموارد البشرية</div>
              </div>
            </div>

            <div className="lr-headline">
              <div className="lr-head-en">Human Resources<br />Management</div>
              <div className="lr-head-ar">نظام إدارة الموارد البشرية</div>
              <div className="lr-rule" />
              <p className="lr-desc">
                منصة متكاملة لمصانع الأدوية تدعم<br />
                الذكاء الاصطناعي وتحليل المشاعر<br />
                A complete HR platform for pharmaceutical factories
              </p>
            </div>

            <div className="lr-features">
              {features.map(({ icon: Icon, en, ar, desc }, i) => (
                <div key={i} className="lr-feat">
                  <div className="lr-feat-icon">
                    <Icon size={16} color="#c41c1c" />
                  </div>
                  <div>
                    <div className="lr-feat-en">{en} · <span style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 400, color: 'rgba(255,255,255,.55)', fontSize: '.76rem' }}>{ar}</span></div>
                    <div className="lr-feat-ar">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lr-badge">
              <span className="lr-dot" />
              Version 2.0 — Production Ready · جاهز للإنتاج
            </div>
          </div>
        </aside>

        {/* ── Form Panel ── */}
        <main className="lr-form-panel">
          <div className="lr-form-wrap">

            {/* Mobile logo */}
            <div className="lr-mob-logo">
              <div className="lr-mob-logo-badge">
                <img src={WPC_LOGO} alt="WPC" />
              </div>
              <div>
                <div className="lr-mob-en">AL-RAFIDAIN HR</div>
                <div className="lr-mob-ar">الرافدين للموارد البشرية</div>
              </div>
            </div>

            <div className="lr-welcome-en">Welcome Back</div>
            <div className="lr-welcome-ar">مرحباً بعودتك — سجّل الدخول إلى حسابك</div>
            <div className="lr-form-rule" />

            <form onSubmit={handleLogin} noValidate>
              <div className="lr-fields">

                {/* Username */}
                <div>
                  <div className="lr-label-row">
                    <span className="lr-label-en">Username <span className="lr-label-ar">اسم المستخدم</span></span>
                  </div>
                  <input
                    className="lr-input"
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); clearErr(); }}
                    placeholder="أدخل اسم المستخدم"
                    autoComplete="username"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="lr-label-row">
                    <span className="lr-label-en">Password <span className="lr-label-ar">كلمة المرور</span></span>
                    <button type="button" className="lr-forgot" onClick={() => onNavigate('forgot-password')}>
                      Forgot? · نسيت؟
                    </button>
                  </div>
                  <div className="lr-input-wrap">
                    <input
                      className="lr-input lr-input-pass"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearErr(); }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" className="lr-eye" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

              </div>

              {error   && <div className="lr-alert lr-alert-err">⚠️ {error}</div>}
              {success && <div className="lr-alert lr-alert-ok">✅ {success}</div>}

              <button type="submit" className="lr-submit" disabled={loading}>
                <span className="lr-submit-inner">
                  {loading ? (
                    <><div className="lr-spinner" /><span>Signing in… · جاري الدخول</span></>
                  ) : (
                    <span>Sign In — تسجيل الدخول</span>
                  )}
                </span>
              </button>
            </form>

            <p className="lr-footer">
              Don't have an account? · ليس لديك حساب؟
              <button onClick={() => onNavigate('register')}>Contact Admin · تواصل مع المشرف</button>
            </p>

          </div>
        </main>
      </div>
    </>
  );
}