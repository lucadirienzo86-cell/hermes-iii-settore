import { LucideIcon, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TSStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  onClick?: () => void;
  href?: string;
  addHref?: string;
  onAdd?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
};

const addButtonColors = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  red: 'bg-red-600 hover:bg-red-700',
};

export const TSStatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
  href,
  addHref,
  onAdd,
}: TSStatsCardProps) => {
  const navigate = useNavigate();
  const hasAddAction = addHref || onAdd;
  const isClickable = !!onClick || !!href;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdd) {
      onAdd();
    } else if (addHref) {
      navigate(addHref);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 group",
        isClickable && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {isClickable ? 'Clicca per vedere' : subtitle}
              </p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs",
                trend.value >= 0 ? "text-green-600" : "text-red-600"
              )}>
                <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasAddAction && (
              <Button 
                size="icon"
                variant="ghost"
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity text-white w-7 h-7",
                  addButtonColors[color]
                )}
                onClick={handleAddClick}
                title={`Aggiungi ${title}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <div className={cn("p-2 rounded-lg", colorClasses[color])}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};