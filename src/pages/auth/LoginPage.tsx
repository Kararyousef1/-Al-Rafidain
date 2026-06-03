import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validate = (): boolean => {
    if (!username.trim()) { setError('يرجى إدخال اسم المستخدم'); return false; }
    if (!password) { setError('يرجى إدخال كلمة المرور'); return false; }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;
    setLoading(true);

    try {
      // تسجيل الدخول عبر Supabase Authentication فقط (لا حسابات محلية)
      const finalEmail = username.includes('@') ? username.trim() : `${username.trim()}@kayan.hr`;
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password,
      });
      if (signInError) throw signInError;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const userRole = profile?.role ?? 'employee';
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);

        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          username: (profile?.email ?? finalEmail).split('@')[0],
          role: userRole,
          full_name: profile?.full_name ?? data.user.user_metadata?.full_name ?? 'مستخدم',
        }));
        localStorage.setItem('userRole', userRole);
      }

      setSuccess('تم تسجيل الدخول بنجاح!');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } catch (err: any) {
      const m = err?.message ?? '';
      if (m.includes('Email not confirmed')) setError('الحساب غير مؤكد');
      else if (m.includes('Invalid login credentials') || m.includes('invalid_credentials')) setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      else if (m.includes('Too many')) setError('محاولات كثيرة - انتظر قليلاً');
      else setError('خطأ في الاتصال - تحقق من اتصالك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">شركة وادي الرافدين</h1>
          <p className="text-indigo-600 font-bold text-sm mt-1">لإنتاج المواد الصيدلانية</p>
          <p className="text-slate-500 mt-3">سجل الدخول إلى نظام إدارة الموارد البشرية</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="أدخل اسم المستخدم"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 pl-12"
                placeholder="********"
                required
              />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}