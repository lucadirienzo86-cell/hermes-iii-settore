import { ChevronRight, Calendar, Clock, Check, Loader2, X, Banknote } from 'lucide-react';
import { HersBadge } from './HersBadge';
import { ProgressSteps } from './ProgressSteps';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface HersPraticaCardProps {
  id: string;
  titolo: string;
  stato: string;
  descrizione?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

const getStatoInfo = (stato: string) => {
  const statiMap: Record<string, { label: string; variant: 'yellow' | 'pink' | 'gray' | 'mint' | 'success'; icon: typeof Clock }> = {
    // Nuovi stati workflow
    'richiesta': { label: 'Richiesta', variant: 'yellow', icon: Clock },
    'presa_in_carico': { label: 'Presa in carico', variant: 'pink', icon: Loader2 },
    'documenti_mancanti': { label: 'Documenti mancanti', variant: 'yellow', icon: Clock },
    'in_corso': { label: 'In corso', variant: 'pink', icon: Loader2 },
    'accettata': { label: 'Accettata', variant: 'mint', icon: Check },
    'rifiutata': { label: 'Rifiutata', variant: 'gray', icon: X },
    'in_erogazione': { label: 'In erogazione', variant: 'mint', icon: Banknote },
    'erogata': { label: 'Erogata', variant: 'success', icon: Check },
    // Stati legacy per compatibilità
    'bozza': { label: 'In attesa', variant: 'yellow', icon: Clock },
    'in_valutazione': { label: 'In revisione', variant: 'yellow', icon: Loader2 },
    'in_lavorazione': { label: 'In lavorazione', variant: 'pink', icon: Loader2 },
    'approvata': { label: 'Approvata', variant: 'mint', icon: Check },
    'completata': { label: 'Completata', variant: 'success', icon: Check },
    'annullata': { label: 'Annullata', variant: 'gray', icon: Clock },
  };
  return statiMap[stato] || { label: stato, variant: 'gray' as const, icon: Clock };
};

const getProgressSteps = (stato: string) => {
  // Nuovi steps per il workflow aggiornato
  const newWorkflowSteps = [
    { 
      label: 'Richiesta', 
      completed: stato !== 'richiesta', 
      active: stato === 'richiesta' 
    },
    { 
      label: 'In carico', 
      completed: ['documenti_mancanti', 'in_corso', 'accettata', 'rifiutata', 'in_erogazione', 'erogata'].includes(stato), 
      active: stato === 'presa_in_carico' 
    },
    { 
      label: 'In corso', 
      completed: ['accettata', 'rifiutata', 'in_erogazione', 'erogata'].includes(stato), 
      active: stato === 'documenti_mancanti' || stato === 'in_corso'
    },
    { 
      label: 'Esito', 
      completed: ['in_erogazione', 'erogata'].includes(stato), 
      active: stato === 'accettata' || stato === 'rifiutata'
    },
  ];

  // Se è uno stato legacy, usa i vecchi steps
  const legacyStates = ['bozza', 'in_valutazione', 'in_lavorazione', 'approvata', 'completata', 'annullata'];
  if (legacyStates.includes(stato)) {
    return [
      { label: 'Richiesta', completed: true, active: stato === 'bozza' },
      { label: 'Revisione', completed: ['in_lavorazione', 'approvata', 'completata'].includes(stato), active: stato === 'in_valutazione' },
      { label: 'Lavorazione', completed: ['approvata', 'completata'].includes(stato), active: stato === 'in_lavorazione' },
      { label: 'Completata', completed: stato === 'completata', active: stato === 'approvata' },
    ];
  }

  return newWorkflowSteps;
};

export const HersPraticaCard = ({
  titolo,
  stato,
  descrizione,
  createdAt,
  unreadCount = 0,
  onClick,
  className,
}: HersPraticaCardProps) => {
  const statoInfo = getStatoInfo(stato);
  const progressSteps = getProgressSteps(stato);
  const StatusIcon = statoInfo.icon;

  const formattedDate = createdAt 
    ? format(new Date(createdAt), 'd MMM yyyy', { locale: it })
    : null;

  return (
    <div 
      className={cn(
        'hers-card cursor-pointer relative',
        unreadCount > 0 && 'ring-2 ring-primary/30',
        className
      )}
      onClick={onClick}
    >
      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
          {unreadCount}
        </span>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base line-clamp-2">
              {titolo}
            </h3>
            {descrizione && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {descrizione}
              </p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
        </div>

        {/* Progress Steps */}
        <ProgressSteps steps={progressSteps} />

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <HersBadge variant={statoInfo.variant}>
            <StatusIcon className={cn(
              "w-3 h-3 mr-1.5",
              stato === 'presa_in_carico' || stato === 'in_corso' || stato === 'in_valutazione' || stato === 'in_lavorazione' ? 'animate-spin' : ''
            )} />
            {statoInfo.label}
          </HersBadge>
          
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
