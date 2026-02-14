import { ReactNode } from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  variant?: 'default' | 'highlight';
}

export const AppCard = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick, 
  className,
  children,
  variant = 'default'
}: AppCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "floating-card group cursor-pointer",
        variant === 'highlight' && "bg-primary/5 border border-primary/20",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-colors",
          variant === 'default' 
            ? "bg-muted group-hover:bg-primary/10" 
            : "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-6 h-6 transition-colors",
            variant === 'default' 
              ? "text-muted-foreground group-hover:text-primary" 
              : "text-primary"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
          {children}
        </div>
        {onClick && (
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </div>
  );
};
