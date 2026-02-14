import { useNavigate } from "react-router-dom";
import { Building2, MapPin, GraduationCap, Eye, UserCheck, Target, TrendingUp, FileText, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BadgeManager from "@/components/BadgeManager";

interface TopMatch {
  titolo: string;
  percentuale: number;
  tipo: 'bando' | 'avviso';
}

interface IncrociData {
  bandiCompatibili: number;
  avvisiCompatibili: number;
  topMatches: TopMatch[];
  mediaCompatibilita: number;
}

interface AziendaCardProps {
  azienda: {
    id: string;
    ragione_sociale: string;
    partita_iva: string;
    dimensione_azienda?: string;
    regione?: string | null;
    numero_dipendenti?: string;
    codici_ateco?: string[];
    settore?: string;
    telefono?: string | null;
    profile_id?: string | null;
    created_at: string;
  };
  fondimpresaResult?: {
    found: boolean;
    annoAdesione?: number;
  };
  incroci?: IncrociData;
  onEdit: (azienda: any) => void;
  onDelete: (azienda: any) => void;
}

export const AziendaCard = ({ 
  azienda, 
  fondimpresaResult, 
  incroci,
  onEdit, 
  onDelete 
}: AziendaCardProps) => {
  const navigate = useNavigate();
  
  // Estrai la regione dal codice provincia completo
  const getRegioneFromCodice = (codice: string | null | undefined) => {
    if (!codice) return null;
    const parts = codice.split(" - ");
    return parts[0] || codice;
  };

  const regione = getRegioneFromCodice(azienda.regione);

  // Colore progressbar basato sulla compatibilità
  const getProgressColor = (percentuale: number) => {
    if (percentuale >= 80) return "bg-emerald-500";
    if (percentuale >= 60) return "bg-amber-500";
    return "bg-muted-foreground/30";
  };

  const totalIncroci = (incroci?.bandiCompatibili || 0) + (incroci?.avvisiCompatibili || 0);

  return (
    <Card className="hover:shadow-lg hover:border-primary/30 transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {azienda.ragione_sociale}
              </h3>
              <p className="text-sm text-muted-foreground">
                P.IVA: {azienda.partita_iva}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1.5 shrink-0">
            {/* Badge Account Connesso */}
            {azienda.profile_id && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 shrink-0">
                    <UserCheck className="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Account connesso al sistema</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Badge Fondimpresa */}
            {fondimpresaResult?.found && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 gap-1 shrink-0">
                    <GraduationCap className="h-3 w-3" />
                    FI
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Aderente Fondimpresa</p>
                  {fondimpresaResult.annoAdesione && (
                    <p className="text-xs text-muted-foreground">
                      Dal {fondimpresaResult.annoAdesione}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Info essenziali: Regione */}
        {regione && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium">{regione}</span>
          </div>
        )}
        
        {/* SEZIONE INCROCI - FOCUS PRINCIPALE */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Incroci Compatibili</span>
          </div>
          
          {/* Contatori */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-background/60 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-xl font-bold text-foreground">{incroci?.bandiCompatibili || 0}</span>
              </div>
              <span className="text-xs text-muted-foreground">Bandi</span>
            </div>
            <div className="bg-background/60 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xl font-bold text-foreground">{incroci?.avvisiCompatibili || 0}</span>
              </div>
              <span className="text-xs text-muted-foreground">Avvisi</span>
            </div>
          </div>
          
          {/* Top Matches */}
          {incroci?.topMatches && incroci.topMatches.length > 0 && (
            <div className="space-y-2">
              {incroci.topMatches.slice(0, 2).map((match, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {match.tipo === 'bando' ? (
                      <FileText className="h-3 w-3 text-primary shrink-0" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate text-muted-foreground">{match.titolo}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`shrink-0 text-xs ${
                      match.percentuale >= 80 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                        : match.percentuale >= 60 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' 
                          : ''
                    }`}
                  >
                    {match.percentuale}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {/* Progressbar media compatibilità */}
          {totalIncroci > 0 && incroci?.mediaCompatibilita !== undefined && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Compatibilità media
                </span>
                <span className={`text-xs font-semibold ${
                  incroci.mediaCompatibilita >= 80 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : incroci.mediaCompatibilita >= 60 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-muted-foreground'
                }`}>
                  {incroci.mediaCompatibilita}%
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(incroci.mediaCompatibilita)}`}
                  style={{ width: `${incroci.mediaCompatibilita}%` }}
                />
              </div>
            </div>
          )}
          
          {totalIncroci === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nessun incrocio trovato
            </p>
          )}
        </div>
        
        {/* Badge formativi - compatti */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3" />
            Badge Formativi
          </p>
          <BadgeManager
            entityType="azienda"
            entityId={azienda.id}
            compact
          />
        </div>
        
        {/* Azioni */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => navigate(`/aziende/${azienda.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
            Dettaglio
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="h-9 w-9"
            onClick={() => onEdit(azienda)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(azienda)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
