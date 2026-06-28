import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TrainingTimerProps {
  /** معرف العنصر (SOP ID or Course ID) */
  itemId: string;
  /** معرف المستخدم */
  userId: string;
  /** وضع العرض: 'visible' يظهر العداد، 'hidden' يعمل في الخلفية فقط */
  mode?: 'visible' | 'hidden';
  /** دالة تُستدعى كل ثانية مع الوقت المستغرق بالثواني */
  onTick?: (seconds: number) => void;
  /** هل العداد متوقف حالياً؟ */
  paused?: boolean;
}

/**
 * مكون عداد الوقت المستخدم في SOPs ومركز التدريب
 * - في SOPs: يعمل مخفياً (mode='hidden') لتسجيل وقت القراءة
 * - في مركز التدريب: يظهر للمستخدم أثناء مشاهدة الدورة
 */
export default function TrainingTimer({
  itemId,
  userId,
  mode = 'hidden',
  onTick,
  paused = false,
}: TrainingTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        const newSec = prev + 1;
        onTickRef.current?.(newSec);
        return newSec;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused, itemId, userId]);

  // Reset timer when item changes
  useEffect(() => {
    setSeconds(0);
  }, [itemId]);

  const formatTime = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs} ث`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (mode === 'hidden') return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs font-bold">
      <Clock size={14} className="text-indigo-500" />
      <span>{formatTime(seconds)}</span>
    </div>
  );
}

/**
 * خطاف (Hook) لاستخدام العداد في الخلفية دون الحاجة لمكون UI
 */
export function useTrainingTimer(
  itemId: string,
  _userId: string,
  paused: boolean = false
): { seconds: number; reset: () => void } {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [itemId]);

  useEffect(() => {
    if (paused || !itemId) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, itemId]);

  const reset = useCallback(() => setSeconds(0), []);

  return { seconds, reset };
}