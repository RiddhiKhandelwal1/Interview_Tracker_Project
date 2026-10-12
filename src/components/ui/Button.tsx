'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-[#4FC1C9] text-[#0B0E14] hover:bg-[#3FA1A9] border border-transparent',
  secondary: 'bg-[#12161F] text-[#E6E8EB] hover:bg-[#1F2430] border border-[#1F2430]',
  ghost: 'text-[#7A8290] hover:text-[#E6E8EB] hover:bg-white/[0.02]',
  danger: 'bg-transparent text-[#C7595A] hover:bg-[#C7595A]/10 border border-[#C7595A]/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
  <button ref={ref} className={`inline-flex items-center justify-center rounded-sm font-sans transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
    {children}
  </button>
));

Button.displayName = 'Button';
export default Button;
