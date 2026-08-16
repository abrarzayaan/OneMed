import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-xl px-4 py-2.5 text-sm font-sans',
              'bg-bg-card border border-bg-border',
              'text-content-primary placeholder:text-content-muted',
              'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon ? 'pl-10' : '',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
              className,
            ].join(' ')}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
