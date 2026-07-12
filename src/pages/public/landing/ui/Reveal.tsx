import React, { type ReactNode } from 'react';
import { useReveal } from '../hooks';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/** يُظهر أبناءه بحركة انزلاق + تلاشي بسيطة عند دخولهم نطاق الرؤية، مرة واحدة فقط */
export function Reveal({ children, delay = 0, y = 30, className = '' }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translateY(${y}px)`,
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
