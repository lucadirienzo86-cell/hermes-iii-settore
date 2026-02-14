import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant = 'primary', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "px-6 py-3 rounded-lg font-semibold transition-all shadow-md",
          variant === 'primary' && "bg-primary text-white hover:bg-primary/90 hover:shadow-lg",
          variant === 'secondary' && "bg-white text-primary border-2 border-primary hover:bg-primary/5",
          variant === 'ghost' && "bg-transparent text-primary hover:bg-primary/5 shadow-none",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AppButton.displayName = 'AppButton';
