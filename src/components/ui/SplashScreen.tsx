/**
 * ════════════════════════════════════════════════════════════════
 *  SplashScreen - شاشة التحميل الرئيسية (KOFRX Style)
 *  ✓ متجاوبة مع جميع أحجام الشاشات (موبايل، تابلت، ديسكتوب)
 * ════════════════════════════════════════════════════════════════
 */

// ─── ثوابت مشتركة ───────────────────────────────────────────────
const C = {
  cyan: '#00d4ff',
  blue: '#0066ff',
  dark: '#0a0e27',
  darkAlt: '#1a1f3a',
  arabicFont: "'Tajawal', 'Cairo', sans-serif",
  logoFont: "'Orbitron', sans-serif",
} as const;

const LOGO_GRADIENT = `linear-gradient(135deg, #ffffff 0%, ${C.cyan} 50%, ${C.blue} 100%)`;

// ─── CSS Animations (مشتركة بين mini والكاملة) ───────────────────
const SHARED_CSS = `
  @keyframes dotBounce {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
    50% { transform: translateY(-15px) scale(1.2); opacity: 1; }
  }
  @keyframes miniDotBounce {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
    50% { transform: translateY(-8px) scale(1.2); opacity: 1; }
  }
`;

const FULL_CSS = `
  ${SHARED_CSS}
  @keyframes bgPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  @keyframes textGlow {
    0%, 100% { filter: brightness(1) drop-shadow(0 0 20px rgba(0,212,255,0.6)); }
    50% { filter: brightness(1.3) drop-shadow(0 0 40px rgba(0,212,255,0.9)); }
  }
  @keyframes lineExpand {
    0%, 100% { width: 100%; opacity: 0.6; }
    50% { width: 150%; opacity: 1; }
  }

  /* Responsive breakpoints */
  @media (max-width: 1024px) { .splash-grid { background-size: 40px 40px !important; } }
  @media (max-width: 768px)  { .splash-grid { background-size: 30px 30px !important; }
                               .splash-line-container { max-width: 200px !important; } }
  @media (max-width: 480px)  { .splash-grid { background-size: 20px 20px !important; }
                               .splash-line-container { max-width: 150px !important; } }
  @media (max-width: 360px)  { .splash-line-container { max-width: 120px !important; } }
  @media (max-height: 500px) { .splash-dots { margin-top: 16px !important; }
                               .splash-logo { margin-bottom: 12px !important; } }
`;

// ─── الأنماط المشتركة للنقاط ──────────────────────────────────────
const dotBaseStyle = (size: string, delay: string, animName: string): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: C.cyan,
  boxShadow: `0 0 10px ${C.cyan}`,
  animation: `${animName} 1.4s ease-in-out infinite`,
  animationDelay: delay,
});

// ─── نمط الشعار المشترك ───────────────────────────────────────────
const logoGradientStyle: React.CSSProperties = {
  fontFamily: C.logoFont,
  fontWeight: 900,
  background: LOGO_GRADIENT,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// ─── Types ────────────────────────────────────────────────────────
type SplashScreenProps = {
  timedOut?: boolean;
  mini?: boolean;
  message?: string;
};

// ─── Component ───────────────────────────────────────────────────
export default function SplashScreen({ timedOut, mini, message }: SplashScreenProps) {

  // ✅ نسخة مصغّرة للـ PageLoader (داخل الصفحات)
  if (mini) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 'clamp(12px, 3vw, 16px)',
          padding: '0 16px',
        }}
      >
        <style>{SHARED_CSS}</style>

        <div
          style={{
            ...logoGradientStyle,
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            letterSpacing: '0.1em',
            filter: `drop-shadow(0 0 15px rgba(0,212,255,0.4))`,
          }}
        >
          KOFRX
        </div>

        <div style={dotBaseStyle('clamp(5px, 1.5vw, 6px)', '0s', 'miniDotBounce')} />
      </div>
    );
  }

  // ✅ شاشة كاملة (AuthLoader / Splash)
  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.darkAlt} 100%)`,
        position: 'relative',
        fontFamily: C.logoFont,
      }}
    >
      <style>{FULL_CSS}</style>

      {/* خلفية متحركة - حلقة ضوئية */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(15,111,255,0.1) 0%, transparent 50%)`,
          animation: 'bgPulse 4s ease-in-out infinite',
        }}
      />

      {/* شبكة خفيفة */}
      <div
        className="splash-grid"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* الحاوية الرئيسية */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 20px',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {/* شعار KOFRX */}
        <div
          className="splash-logo"
          style={{
            ...logoGradientStyle,
            fontSize: 'clamp(2rem, 8vw, 5rem)',
            letterSpacing: 'clamp(0.08em, 0.15em, 0.2em)',
            animation: 'textGlow 3s ease-in-out infinite',
            textShadow: `0 0 40px rgba(0,212,255,0.5), 0 0 80px rgba(0,102,255,0.3)`,
            marginBottom: 'clamp(16px, 4vw, 30px)',
            whiteSpace: 'nowrap',
          }}
        >
          KOFRX
        </div>

        {/* خط مضيء */}
        <div
          className="splash-line-container"
          style={{
            maxWidth: 'clamp(120px, 40vw, 250px)',
            margin: '0 auto',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '2px',
              background: `linear-gradient(90deg, transparent 0%, ${C.blue} 50%, transparent 100%)`,
              boxShadow: `0 0 10px ${C.blue}, 0 0 20px rgba(0,102,255,0.5)`,
              animation: 'lineExpand 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* نقاط التحميل */}
        <div
          className="splash-dots"
          style={{
            display: 'flex',
            gap: 'clamp(8px, 2.5vw, 14px)',
            justifyContent: 'center',
            marginTop: 'clamp(24px, 5vw, 40px)',
          }}
        >
          {(['0s', '0.2s', '0.4s'] as const).map((delay) => (
            <div
              key={delay}
              style={dotBaseStyle('clamp(6px, 1.8vw, 10px)', delay, 'dotBounce')}
            />
          ))}
        </div>

        {/* رسالة إضافية */}
        {(timedOut || message) && (
          <p
            style={{
              color: timedOut ? '#f87171' : '#94a3b8',
              fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)',
              marginTop: 'clamp(16px, 3vw, 24px)',
              fontFamily: C.arabicFont,
              padding: '0 16px',
              wordBreak: 'break-word',
              lineHeight: 1.5,
            }}
          >
            {timedOut
              ? '⚠️ استغرق الاتصال وقتاً طويلاً — يرجى التحقق من الاتصال بالإنترنت'
              : message}
          </p>
        )}

        {timedOut && (
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: 'clamp(6px, 2vw, 10px) clamp(16px, 4vw, 24px)',
              background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
              fontFamily: C.arabicFont,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  );
}