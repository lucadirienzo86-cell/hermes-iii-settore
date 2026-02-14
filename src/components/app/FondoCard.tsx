import { ChevronRight, Calendar, Building2 } from 'lucide-react';
import { HersBadge } from './HersBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface FondoCardProps {
  id: string;
  titolo: string;
  fondoNome?: string;
  scadenza?: string | null;
  compatibilita?: number;
  tematiche?: string[] | null;
  onClick?: () => void;
  className?: string;
}

export const FondoCard = ({
  titolo,
  fondoNome,
  scadenza,
  compatibilita,
  tematiche,
  onClick,
  className,
}: FondoCardProps) => {
  const formattedDate = scadenza 
    ? format(new Date(scadenza), 'd MMM yyyy', { locale: it })
    : null;

  return (
    <div 
      className={cn('hers-card cursor-pointer', className)}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header with compatibility */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base line-clamp-2">
              {titolo}
            </h3>
          </div>
          {compatibilita !== undefined && (
            <HersBadge variant={compatibilita >= 80 ? 'success' : compatibilita >= 60 ? 'mint' : 'gray'}>
              {compatibilita}%
            </HersBadge>
          )}
        </div>

        {/* Fund name and date */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {fondoNome && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>{fondoNome}</span>
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Tematiche badges */}
        {tematiche && tematiche.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tematiche.slice(0, 3).map((tema, idx) => (
              <HersBadge 
                key={idx} 
                variant={idx === 0 ? 'yellow' : idx === 1 ? 'pink' : 'gray'}
              >
                {tema}
              </HersBadge>
            ))}
            {tematiche.length > 3 && (
              <HersBadge variant="gray">
                +{tematiche.length - 3}
              </HersBadge>
            )}
          </div>
        )}
      </div>

      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
    </div>
  );
};
