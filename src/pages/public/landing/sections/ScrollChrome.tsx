import React from 'react';
import { ChevronUp } from 'lucide-react';
import { useLang } from '../LangContext';

interface ScrollChromeProps {
  scrollPct: number;
  showTop: boolean;
}

export function ScrollProgressBar({ scrollPct }: { scrollPct: number }) {
  return <div className="fixed top-0 left-0 right-0 z-[70] h-[3px] scroll-bar transition-all" style={{ width: `${scrollPct}%` }} />;
}

export function ScrollToTopButton({ showTop }: { showTop: boolean }) {
  const { isRTL, lang } = useLang();
  if (!showTop) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 z-50 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-110"
      style={{ [isRTL ? 'left' : 'right']: '1.5rem', background: 'var(--kv-accent-grad)' }}
      aria-label={lang === 'ar' ? 'العودة للأعلى' : lang === 'en' ? 'Back to top' : 'گەڕانەوە بۆ سەرەوە'}
    >
      <ChevronUp size={18} />
    </button>
  );
}

export function ScrollChrome({ scrollPct, showTop }: ScrollChromeProps) {
  return (
    <>
      <ScrollProgressBar scrollPct={scrollPct} />
      <ScrollToTopButton showTop={showTop} />
    </>
  );
}
