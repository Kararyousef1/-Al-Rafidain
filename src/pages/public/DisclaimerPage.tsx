import { useState } from 'react';

const ACCESS_CODE = 'admin';

export default function DisclaimerPage({ onAccess }: { onAccess: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toLowerCase() === ACCESS_CODE) {
      onAccess();
    } else {
      setError('رمز الدخول غير صحيح · Invalid access code');
      // إعلام المطور (محاكاة)
      fetch('https://api.telegram.org/bot/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: 'developer',
          text: `⚠️ محاولة دخول فاشلة: ${code} في ${new Date().toISOString()}`
        })
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
        {/* أيقونة التنبيه */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* العنوان */}
        <h1 className="text-3xl font-bold text-white text-center mb-4">
          ⚠️ تنبيه مهم
        </h1>

        {/* نص التنويه */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10 space-y-4 text-right">
          <p className="text-gray-300 leading-relaxed text-lg">
            هذا الموقع <strong className="text-amber-400">قيد التطوير والإعداد</strong> وتم نشره لعرض الإصدار التجريبي.
          </p>
          <p className="text-gray-400 leading-relaxed">
            تم أخذ بعض البيانات من موقع الشركة الرسمي (كالصور والمنتجات والموقع والاسم) لغرض <strong className="text-indigo-400">محاكاة الواقع وإعداد البيئة التجريبية</strong>.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 font-semibold">
              🚫 غير مسموح للأشخاص غير المصرح لهم بالدخول.
              أي محاولات تسجيل دخول فاشلة سيتم إعلام المطور بها.
            </p>
          </div>
        </div>

        {/* حقل رمز الدخول */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2 text-center">
              الرجاء إدخال رمز الدخول للمتابعة
            </label>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              placeholder="أدخل رمز الدخول"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm font-semibold text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold transition-all duration-200 shadow-lg shadow-indigo-600/25"
          >
            دخول · Enter
          </button>
        </form>

        <p className="text-gray-600 text-xs text-center mt-6">
          هذا النظام مملوك لشركة الرافدين لإنتاج المواد الصيدلانية © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}