import { CheckCircle2, XCircle, ChevronRight, Calendar, TrendingUp, Receipt, MapPin, Factory, Users, Building2 } from 'lucide-react';
import { HersBadge } from './HersBadge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CriterioMatch {
  nome: string;
  icona: React.ReactNode;
  soddisfatto: boolean;
}

interface BandiPreviewCardProps {
  titolo: string;
  ente?: string | null;
  compatibilitaPercentuale: number;
  criteriSoddisfatti: number;
  criteriTotali: number;
  dataChiusura?: string | null;
  importoMassimo?: number | null;
  investimentiMatch?: string[];
  speseMatch?: string[];
  dettaglioCriteri?: {
    settore: boolean;
    sede: boolean;
    dimensione: boolean;
    dipendenti: boolean;
    costituzione: boolean;
    investimenti: boolean;
    spese: boolean;
  };
  onClick: () => void;
  className?: string;
}

export const BandiPreviewCard = ({
  titolo,
  ente,
  compatibilitaPercentuale,
  criteriSoddisfatti,
  criteriTotali,
  dataChiusura,
  importoMassimo,
  investimentiMatch = [],
  speseMatch = [],
  dettaglioCriteri,
  onClick,
  className,
}: BandiPreviewCardProps) => {
  const hasMatches = investimentiMatch.length > 0 || speseMatch.length > 0;
  
  // Costruisci i criteri visivi per i mini-indicatori
  const criteriVisivi: CriterioMatch[] = [];
  if (dettaglioCriteri) {
    if (dettaglioCriteri.settore !== undefined) {
      criteriVisivi.push({ nome: 'ATECO', icona: <Factory className="w-3 h-3" />, soddisfatto: dettaglioCriteri.settore });
    }
    if (dettaglioCriteri.sede !== undefined) {
      criteriVisivi.push({ nome: 'Sede', icona: <MapPin className="w-3 h-3" />, soddisfatto: dettaglioCriteri.sede });
    }
    if (dettaglioCriteri.dimensione !== undefined) {
      criteriVisivi.push({ nome: 'Dimensione', icona: <Building2 className="w-3 h-3" />, soddisfatto: dettaglioCriteri.dimensione });
    }
    if (dettaglioCriteri.dipendenti !== undefined) {
      criteriVisivi.push({ nome: 'Dipendenti', icona: <Users className="w-3 h-3" />, soddisfatto: dettaglioCriteri.dipendenti });
    }
  }

  const getProgressColor = () => {
    if (compatibilitaPercentuale >= 80) return 'bg-success';
    if (compatibilitaPercentuale >= 60) return 'bg-warning';
    return 'bg-primary';
  };

  const getBadgeVariant = (): 'success' | 'yellow' | 'mint' => {
    if (compatibilitaPercentuale >= 80) return 'success';
    if (compatibilitaPercentuale >= 60) return 'yellow';
    return 'mint';
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl p-4 border border-border shadow-sm cursor-pointer hover:shadow-md transition-all group",
        className
      )}
    >
      {/* Header: Titolo + Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">
            {titolo}
          </h3>
          {ente && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{ente}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <HersBadge variant={getBadgeVariant()} className="text-xs font-bold">
            {compatibilitaPercentuale}%
          </HersBadge>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Progress Bar con criteri */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            Compatibilità
          </span>
          {criteriTotali > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {criteriSoddisfatti}/{criteriTotali} criteri
            </span>
          )}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", getProgressColor())}
            style={{ width: `${compatibilitaPercentuale}%` }}
          />
        </div>
      </div>

      {/* Mini indicatori criteri */}
      {criteriVisivi.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {criteriVisivi.slice(0, 4).map((criterio, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                criterio.soddisfatto 
                  ? "bg-success/10 text-success" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {criterio.soddisfatto ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : (
                <XCircle className="w-2.5 h-2.5" />
              )}
              {criterio.nome}
            </div>
          ))}
        </div>
      )}

      {/* Match investimenti/spese */}
      {hasMatches && (
        <div className="pt-2 border-t border-border space-y-2">
          {investimentiMatch.length > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-success flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {investimentiMatch.slice(0, 2).map((inv, idx) => (
                  <span 
                    key={idx}
                    className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium"
                  >
                    {inv}
                  </span>
                ))}
                {investimentiMatch.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{investimentiMatch.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {speseMatch.length > 0 && (
            <div className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {speseMatch.slice(0, 2).map((spesa, idx) => (
                  <span 
                    key={idx}
                    className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                  >
                    {spesa}
                  </span>
                ))}
                {speseMatch.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{speseMatch.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer: Data e importo */}
      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        {dataChiusura && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Scade: {format(new Date(dataChiusura), 'dd/MM/yy')}
          </span>
        )}
        {importoMassimo && (
          <span className="font-medium text-foreground">
            Fino a €{importoMassimo.toLocaleString('it-IT')}
          </span>
        )}
      </div>
    </div>
  );
};
