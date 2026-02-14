import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Wallet, GraduationCap, FileText, Users, Building2, Settings, Home, LucideIcon, Network, Search, Sparkles } from 'lucide-react';

// Mappa icone predefinite per le pagine comuni
const PAGE_ICONS: Record<string, LucideIcon> = {
  'dashboard': LayoutDashboard,
  'finanza-agevolata': Wallet,
  'formazione-finanziata': GraduationCap,
  'pratiche': FileText,
  'utenti': Users,
  'aziende': Building2,
  'impostazioni': Settings,
  'home': Home,
  'docenti': GraduationCap,
  'incroci': Network,
  'ricerca-imprese': Search,
};

export interface BreadcrumbItemType {
  label: string;
  href?: string;
  icon?: LucideIcon | keyof typeof PAGE_ICONS;
}

export interface CounterBadge {
  label: string;
  count: number;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemType[];
  icon?: ReactNode;
  actions?: ReactNode;
  /** Badge contatori da mostrare accanto alla descrizione */
  counters?: CounterBadge[];
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const breadcrumbItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }
};

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      delay: 0.15
    }
  }
};

const descriptionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      delay: 0.25
    }
  }
};

const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: 0.35
    }
  }
};

// Mappa varianti badge a classi Tailwind con supporto dark mode
const badgeVariantClasses: Record<string, string> = {
  'success': 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40 dark:border-green-800',
  'warning': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/40 dark:border-yellow-800',
  'info': 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40 dark:border-blue-800',
};

export const PageHeader = ({ 
  title, 
  description, 
  breadcrumbs = [], 
  icon,
  actions,
  counters = [],
  className = ''
}: PageHeaderProps) => {
  
  // Risolvi l'icona da stringa o componente
  const resolveIcon = (iconProp: LucideIcon | keyof typeof PAGE_ICONS | undefined): LucideIcon | null => {
    if (!iconProp) return null;
    if (typeof iconProp === 'string') {
      return PAGE_ICONS[iconProp] || null;
    }
    return iconProp;
  };

  return (
    <motion.div 
      className={`mb-8 ${className}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const IconComponent = resolveIcon(crumb.icon);
              
              return (
                <motion.div 
                  key={crumb.label} 
                  className="contents"
                  variants={breadcrumbItemVariants}
                >
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                        {IconComponent && <IconComponent className="h-4 w-4" />}
                        <span>{crumb.label}</span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link 
                          to={crumb.href || '#'} 
                          className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                        >
                          {IconComponent && (
                            <IconComponent className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="relative">
                            {crumb.label}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                          </span>
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <motion.div variants={breadcrumbItemVariants}>
                      <BreadcrumbSeparator />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          {icon && (
            <motion.div 
              className="p-2.5 bg-primary/10 rounded-xl shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring" as const, 
                stiffness: 260, 
                damping: 20,
                delay: 0.2
              }}
            >
              {icon}
            </motion.div>
          )}
          
          {/* Title & Description */}
          <div>
            <motion.h1 
              className="text-3xl font-bold text-foreground"
              variants={titleVariants}
            >
              {title}
            </motion.h1>
            
            {/* Description + Counters */}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {description && (
                <motion.p 
                  className="text-muted-foreground"
                  variants={descriptionVariants}
                >
                  {description}
                </motion.p>
              )}
              
              {/* Counter badges */}
              {counters.length > 0 && (
                <motion.div 
                  className="flex items-center gap-2 flex-wrap"
                  variants={badgeVariants}
                >
                  {counters.map((counter, idx) => (
                    <Badge 
                      key={idx}
                      variant={counter.variant === 'success' || counter.variant === 'warning' || counter.variant === 'info' ? 'outline' : counter.variant || 'secondary'}
                      className={`text-xs font-medium ${
                        counter.variant === 'success' ? badgeVariantClasses.success :
                        counter.variant === 'warning' ? badgeVariantClasses.warning :
                        counter.variant === 'info' ? badgeVariantClasses.info : ''
                      }`}
                    >
                      <span className="font-bold mr-1">{counter.count}</span>
                      {counter.label}
                    </Badge>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: "spring" as const, stiffness: 200, damping: 20 }}
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;
