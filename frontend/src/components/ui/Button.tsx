import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger' | 'outline' | 'glow' | 'secondary';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary-600 hover:bg-primary-500 text-white shadow-glow hover:shadow-glow-lg border border-primary-500/40',
  accent:    'bg-accent-500 hover:bg-accent-400 text-white shadow-glow-teal border border-accent-400/40',
  glow:      'bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white shadow-glow hover:shadow-glow-lg border border-primary-400/30',
  secondary: 'bg-bg-surface hover:bg-bg-hover text-content-primary border border-bg-border shadow-sm',
  ghost:     'bg-transparent hover:bg-bg-hover text-content-secondary hover:text-content-primary',
  danger:    'bg-red-600 hover:bg-red-500 text-white border border-red-500/40 shadow-sm',
  outline:   'border border-bg-border hover:border-primary-500/80 bg-transparent text-content-primary hover:bg-primary-500/10',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl',
  md: 'px-5 py-2.5 text-sm font-semibold rounded-xl',
  lg: 'px-7 py-3 text-base font-semibold rounded-2xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, children, disabled, className = '', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 font-sans',
          'transition-all duration-200 cursor-pointer select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...(props as any)}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
