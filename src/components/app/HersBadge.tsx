import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface HersBadgeProps {
  children: ReactNode;
  variant?: 'yellow' | 'pink' | 'gray' | 'mint' | 'success';
  className?: string;
}

export const HersBadge = ({ children, variant = 'gray', className }: HersBadgeProps) => {
  const variantClasses = {
    yellow: 'hers-badge-yellow',
    pink: 'hers-badge-pink',
    gray: 'hers-badge-gray',
    mint: 'hers-badge-mint',
    success: 'hers-badge-success',
  };

  return (
    <span className={cn('hers-badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
};
