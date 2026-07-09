import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantMap = {
  primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg shadow-indigo-200',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  outline: 'bg-transparent text-indigo-600 border border-indigo-300 hover:bg-indigo-50',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200',
};

const sizeMap = {
  xs: 'text-xs px-2.5 py-1.5 rounded-lg',
  sm: 'text-sm px-3.5 py-2 rounded-xl',
  md: 'text-sm px-5 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-xl',
};

export default function Button({
  children, variant = 'primary', size = 'md', loading, icon, iconPosition = 'right',
  fullWidth, className = '', disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200
        ${variantMap[variant]} ${sizeMap[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (iconPosition === 'left' && icon)}
      {children}
      {!loading && iconPosition === 'right' && icon}
    </button>
  );
}
