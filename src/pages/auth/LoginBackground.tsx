/**
 * ════════════════════════════════════════════════════════════════
 *  LoginBackground - خلفية صفحة تسجيل الدخول
 *  (aurora متحركة + شبكة خفيفة — تصميم مبسّط ومقصود)
 * ════════════════════════════════════════════════════════════════
 *
 *  بصري بحت، بدون أي منطق. يمكن استبداله لاحقاً (مثلاً حسب شعار
 *  الشركة في نسخة Multi-Tenant) دون لمس منطق الفورم أو الأمان.
 * ════════════════════════════════════════════════════════════════
 */

export default function LoginBackground() {
  return (
    <>
      {/* الخلفية المتدرّجة الأساسية */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />

      {/* كرات Aurora الضوئية المتحركة */}
      <div
        className="login-aurora-blob"
        style={{
          width: 500,
          height: 500,
          top: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, #6366f1, transparent 70%)',
          animation: 'login-aurora-1 18s ease-in-out infinite',
        }}
      />
      <div
        className="login-aurora-blob"
        style={{
          width: 450,
          height: 450,
          bottom: '-10%',
          left: '-5%',
          background: 'radial-gradient(circle, #8b5cf6, transparent 70%)',
          animation: 'login-aurora-2 22s ease-in-out infinite',
        }}
      />
      <div
        className="login-aurora-blob"
        style={{
          width: 350,
          height: 350,
          top: '40%',
          left: '40%',
          background: 'radial-gradient(circle, #4f46e5, transparent 70%)',
          opacity: 0.35,
          animation: 'login-aurora-3 25s ease-in-out infinite',
        }}
      />

      {/* شبكة خفيفة */}
      <div className="login-grid-overlay absolute inset-0 opacity-[0.04]" aria-hidden="true" />
    </>
  );
}
