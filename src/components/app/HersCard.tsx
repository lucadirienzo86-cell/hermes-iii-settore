import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface HersCardProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'highlight' | 'section';
  showArrow?: boolean;
}

export const HersCard = ({
  children,
  title,
  subtitle,
  icon: Icon,
  onClick,
  className,
  variant = 'default',
  showArrow = true,
}: HersCardProps) => {
  const baseClasses = cn(
    'hers-card',
    onClick && 'cursor-pointer',
    variant === 'highlight' && 'border border-primary/20 bg-accent/30',
    variant === 'section' && 'hers-section-card',
    className
  );

  if (children) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-foreground text-base">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {onClick && showArrow && (
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </div>
    </div>
  );
};
