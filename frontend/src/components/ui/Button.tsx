import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

const variants = {
  primary: 'bg-primary-900 text-white shadow-sm hover:bg-primary-800 focus:ring-primary-500',
  secondary: 'bg-accent-500 text-primary-900 shadow-sm hover:bg-accent-600 focus:ring-accent-500',
  outline: 'border-2 border-primary-800 text-primary-900 bg-transparent hover:bg-primary-50 focus:ring-primary-500',
  ghost: 'text-primary-600 hover:bg-primary-100 focus:ring-primary-400',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] sm:min-h-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
