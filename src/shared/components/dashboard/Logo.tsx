import { useUIStore } from '../../../core/stores';

/**
 * The main  KYVZON logo component for the application.
 * Designed to be placed in the sidebar or header.
 */
export function Logo() {
  const { setActiveView } = useUIStore();

  const handleNavigateHome = () => {
    // Navigate to the main dashboard view, respecting the app's navigation logic
    setActiveView('employee-dashboard');
  };

  return (
    <div className="py-6 px-4 text-center border-b border-slate-700/50">
      <button onClick={handleNavigateHome} className="inline-block" aria-label="Go to homepage">
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '1.25rem', // 20px
            fontWeight: 900,
            letterSpacing: '0.05em',
            background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 70%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 15px rgba(255,255,255,0.2)',
          }}
          className="transition-transform duration-300 ease-in-out hover:scale-105"
        >
           KYVZON
        </div>
      </button>
    </div>
  );
}