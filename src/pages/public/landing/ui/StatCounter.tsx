import React from 'react';
import { useCountUp } from '../hooks';

interface StatCounterProps {
  /** القيمة الرقمية الخام كنص، تُقبل فواصل الآلاف والفواصل العشرية (مثال: "8,500" أو "4.9") */
  value: string;
  suffix?: string;
  className?: string;
}

/** يحوّل نصاً رقمياً مثل "8,500" إلى رقم قابل للحركة + منسّق العرض الأصلي */
function parseNumeric(raw: string): { number: number; decimals: number } {
  const clean = raw.replace(/,/g, '');
  const decimals = clean.includes('.') ? clean.split('.')[1].length : 0;
  return { number: parseFloat(clean) || 0, decimals };
}

export function StatCounter({ value, suffix = '', className = '' }: StatCounterProps) {
  const { number, decimals } = parseNumeric(value);
  const { ref, value: animated } = useCountUp(number);

  const formatted = decimals > 0
    ? animated.toFixed(decimals)
    : Math.round(animated).toLocaleString('en-US');

  return (
    <div ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatted}
      {suffix}
    </div>
  );
}
