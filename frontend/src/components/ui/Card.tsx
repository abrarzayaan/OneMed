import React from 'react';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'glass' | 'interactive' | 'outline' }
>(({ className = '', variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: 'bg-bg-surface border border-bg-border/80 shadow-md',
    glass: 'bg-bg-surface/80 backdrop-blur-xl border border-bg-border/60 shadow-xl',
    interactive: 'bg-bg-surface border border-bg-border/80 shadow-md hover:border-primary-500/50 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300',
    outline: 'bg-transparent border border-bg-border shadow-none',
  };

  return (
    <div
      ref={ref}
      className={`rounded-2xl text-content-primary ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
});
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-5 sm:p-6 ${className}`}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h3
    ref={ref}
    className={`font-head text-lg sm:text-xl font-bold leading-none tracking-tight text-content-primary ${className}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-xs sm:text-sm text-content-secondary ${className}`}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`p-5 sm:p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-5 sm:p-6 pt-0 ${className}`}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
