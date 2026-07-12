/**
 * hooks.ts — الخطافات (hooks) المشتركة بين مكوّنات صفحة الهبوط.
 */
import { useEffect, useRef, useState } from 'react';

/** يكشف عندما يدخل عنصر ما نطاق الرؤية، لتشغيل حركة الظهور مرة واحدة فقط */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // يحترم تفضيل المستخدم بتقليل الحركة: يظهر العنصر مباشرة بلا انتظار.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/** يُحرّك رقماً من 0 إلى القيمة المستهدفة عند دخوله نطاق الرؤية */
export function useCountUp(target: number, durationMs = 1400) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.4);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // easeOutExpo — تسارع سريع في البداية وهبوط ناعم قرب النهاية
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target, durationMs]);

  return { ref, value };
}

/** حالة التمرير العامة: هل تجاوزنا الأعلى، نسبة التمرير، وهل نظهر زر العودة للأعلى */
export function useScrollMeta() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        const totalH = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(sy > 50);
        setShowTop(sy > 400);
        setScrollPct(totalH > 0 ? (sy / totalH) * 100 : 0);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrolled, scrollPct, showTop };
}

/** يتتبّع القسم الظاهر حالياً على الشاشة عبر IntersectionObserver (أدق وأخف من حساب يدوي) */
export function useScrollSpy(ids: string[], rootMargin = '-45% 0px -50% 0px') {
  const [activeId, setActiveId] = useState(ids[0] ?? '');

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin, threshold: 0 },
    );
    elements.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids, rootMargin]);

  return activeId;
}

/** دوران تلقائي بين عناصر (يُستخدم في عرض البوابات) — يمكن إيقافه (مثلاً في previewMode) */
export function useAutoRotate(length: number, intervalMs = 5000, enabled = true) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled || length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(timer);
  }, [length, intervalMs, enabled]);
  return [index, setIndex] as const;
}
