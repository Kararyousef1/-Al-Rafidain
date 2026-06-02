import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ children, className = '', hover, glass, padding = 'md' }: CardProps) {
  return (
    <div className={`
      bg-white rounded-2xl border border-slate-100 shadow-sm
      ${hover ? 'card-hover cursor-pointer' : ''}
      ${glass ? 'glass' : ''}
      ${paddingMap[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-bold text-slate-800 text-base ${className}`}>{children}</h3>
  );
}
