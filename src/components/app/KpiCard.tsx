import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  size?: 'default' | 'large';
  onClick?: () => void;
}

export const KpiCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  className,
  size = 'default',
  onClick
}: KpiCardProps) => {
  const isPositive = trend && trend.value >= 0;
  
  return (
    <div 
      className={cn("kpi-card", onClick && "cursor-pointer", className)} 
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <span className="kpi-label">{label}</span>
        {Icon && (
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      
      <span className={cn(
        "kpi-value",
        size === 'large' && "text-3xl"
      )}>
        {value}
      </span>
      
      {trend && (
        <div className={cn(
          "kpi-trend",
          isPositive ? "positive" : "negative"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{isPositive ? '+' : ''}{trend.value}%</span>
          {trend.label && (
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};
