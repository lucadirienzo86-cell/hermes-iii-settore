import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface HersButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'mint';
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export const HersButton = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className,
  disabled = false,
  type = 'button',
  fullWidth = false,
}: HersButtonProps) => {
  const variantClasses = {
    primary: 'hers-button-primary',
    secondary: 'hers-button-secondary',
    mint: 'hers-button-mint',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'hers-button',
        variantClasses[variant],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};
