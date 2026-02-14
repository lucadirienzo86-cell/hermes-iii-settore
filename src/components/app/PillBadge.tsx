import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'muted';

interface PillBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'pill-badge-success',
  warning: 'pill-badge-warning',
  error: 'pill-badge-error',
  info: 'pill-badge-info',
  muted: 'pill-badge-muted',
};

export const PillBadge = ({ 
  children, 
  variant = 'muted',
  className,
  dot = false
}: PillBadgeProps) => {
  return (
    <span className={cn(
      "pill-badge",
      variantClasses[variant],
      className
    )}>
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          variant === 'success' && "bg-success",
          variant === 'warning' && "bg-warning",
          variant === 'error' && "bg-destructive",
          variant === 'info' && "bg-primary",
          variant === 'muted' && "bg-muted-foreground",
        )} />
      )}
      {children}
    </span>
  );
};
