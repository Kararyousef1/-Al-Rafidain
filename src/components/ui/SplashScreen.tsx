/**
 * ════════════════════════════════════════════════════════════════
 *  SplashScreen - شاشة التحميل الرئيسية (KOFRX Style)
 * ════════════════════════════════════════════════════════════════
 */

type SplashScreenProps = {
  timedOut?: boolean;
  mini?: boolean;
  message?: string;
};

const SPIN_CSS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes prog{from{width:15%}to{width:85%}}`;

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
          gap: '16px',
        }}
      >
        <style>{SPIN_CSS}</style>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 15px rgba(0,212,255,0.4))',
          }}
        >
          KOFRX
        </div>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00d4ff',
            boxShadow: '0 0 8px #00d4ff',
            animation: 'dotBounce 1.4s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes dotBounce {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
            50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ✅ شاشة كاملة (AuthLoader / Splash)
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
        position: 'relative',
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      <style>{`
        /* خلفية متحركة */
        @keyframes bgPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes textGlow {
          0%, 100% {
            filter: brightness(1) drop-shadow(0 0 20px rgba(0,212,255,0.6));
          }
          50% {
            filter: brightness(1.3) drop-shadow(0 0 40px rgba(0,212,255,0.9));
          }
        }

        @keyframes lineExpand {
          0%, 100% { width: 200px; opacity: 0.6; }
          50% { width: 350px; opacity: 1; }
        }

        @keyframes dotBounce {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-15px) scale(1.2); opacity: 1; }
        }

        @keyframes prog {
          from { width: 15%; }
          to { width: 85%; }
        }
      `}</style>

      {/* خلفية متحركة - حلقة ضوئية */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(15,111,255,0.1) 0%, transparent 50%)',
          animation: 'bgPulse 4s ease-in-out infinite',
        }}
      />

      {/* شبكة خفيفة */}
      <div
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
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        {/* كلمة KOFRX */}
        <div
          style={{
            fontSize: mini ? '2rem' : '5rem',
            fontWeight: 900,
            letterSpacing: '0.15em',
            background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'textGlow 3s ease-in-out infinite',
            textShadow:
              '0 0 40px rgba(0,212,255,0.5), 0 0 80px rgba(0,102,255,0.3)',
            marginBottom: '30px',
          }}
        >
          KOFRX
        </div>

        {/* خط مضيء */}
        <div
          style={{
            height: '2px',
            margin: '0 auto',
            background: 'linear-gradient(90deg, transparent 0%, #0066ff 50%, transparent 100%)',
            boxShadow: '0 0 10px #0066ff, 0 0 20px rgba(0,102,255,0.5)',
            animation: 'lineExpand 2s ease-in-out infinite',
          }}
        />

        {/* نقاط التحميل */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00d4ff',
              boxShadow: '0 0 10px #00d4ff',
              animation: 'dotBounce 1.4s ease-in-out infinite',
              animationDelay: '0s',
            }}
          />
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00d4ff',
              boxShadow: '0 0 10px #00d4ff',
              animation: 'dotBounce 1.4s ease-in-out infinite',
              animationDelay: '0.2s',
            }}
          />
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00d4ff',
              boxShadow: '0 0 10px #00d4ff',
              animation: 'dotBounce 1.4s ease-in-out infinite',
              animationDelay: '0.4s',
            }}
          />
        </div>

        {/* رسالة إضافية */}
        {(timedOut || message) && (
          <p
            style={{
              color: timedOut ? '#f87171' : '#94a3b8',
              fontSize: '0.9rem',
              marginTop: '24px',
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
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
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #0066ff, #00d4ff)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
              fontWeight: 600,
            }}
          >
            إعادة المحاولة
          </button>
        )}
      </div>

      {/* Responsive via media query */}
      <style>{`
        @media (max-width: 768px) {
          .splash-logo { font-size: 3rem !important; }
        }
        @media (max-width: 480px) {
          .splash-logo { font-size: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}