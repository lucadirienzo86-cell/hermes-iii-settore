import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus } from 'lucide-react';

export type StatCardColorVariant = 
  | 'primary' 
  | 'green' 
  | 'blue' 
  | 'amber' 
  | 'purple' 
  | 'orange' 
  | 'red';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorVariant?: StatCardColorVariant;
  href?: string;
  addHref?: string; // URL for the "+" button
  onAdd?: () => void; // Alternative to addHref for custom logic
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
  animationDelay?: number;
}

const colorVariants: Record<StatCardColorVariant, {
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
  addButtonBg: string;
}> = {
  primary: {
    iconBg: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary',
    hoverBorder: 'hover:border-primary/30',
    addButtonBg: 'bg-primary hover:bg-primary/90',
  },
  green: {
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconColor: 'text-green-500',
    hoverBorder: 'hover:border-green-300 dark:hover:border-green-700',
    addButtonBg: 'bg-green-600 hover:bg-green-700',
  },
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-500',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    addButtonBg: 'bg-blue-600 hover:bg-blue-700',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconColor: 'text-amber-600',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    addButtonBg: 'bg-amber-600 hover:bg-amber-700',
  },
  purple: {
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    iconColor: 'text-purple-500',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    addButtonBg: 'bg-purple-600 hover:bg-purple-700',
  },
  orange: {
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    iconColor: 'text-orange-500',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
    addButtonBg: 'bg-orange-600 hover:bg-orange-700',
  },
  red: {
    iconBg: 'bg-red-50 dark:bg-red-900/30',
    iconColor: 'text-red-500',
    hoverBorder: 'hover:border-red-300 dark:hover:border-red-700',
    addButtonBg: 'bg-red-600 hover:bg-red-700',
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
      delay: delay * 0.1,
    },
  }),
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorVariant = 'primary',
  href,
  addHref,
  onAdd,
  trend,
  className = '',
  animationDelay = 0,
}: StatCardProps) => {
  const colors = colorVariants[colorVariant];
  const navigate = useNavigate();
  const hasAddAction = addHref || onAdd;
  const isClickable = !!href;

  const handleCardClick = () => {
    if (href) {
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
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={animationDelay}
      className="h-full"
    >
      <Card 
        onClick={handleCardClick}
        className={`
          bg-card border border-border shadow-sm 
          hover:shadow-md transition-all duration-300 
          ${colors.hoverBorder} 
          ${isClickable ? 'cursor-pointer' : ''} 
          h-full group
          ${className}
        `}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasAddAction && (
              <Button 
                size="icon"
                variant="ghost"
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${colors.addButtonBg} text-white w-7 h-7`}
                onClick={handleAddClick}
                title={`Aggiungi ${title}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <div className={`p-2 rounded-lg ${colors.iconBg}`}>
              <Icon className={`h-5 w-5 ${colors.iconColor}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-1">
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {isClickable ? 'Clicca per vedere l\'elenco' : subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm mt-1 ${
              trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <span>{trend.value}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;