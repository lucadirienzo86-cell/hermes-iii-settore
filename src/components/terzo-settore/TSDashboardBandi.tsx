import { FileText, Clock, CheckCircle, Archive, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TSStatsCard } from './TSStatsCard';
import { TerzoSettoreStats } from '@/hooks/useTerzoSettoreStats';
import { useBandiTerzoSettore, BandoTerzoSettore } from '@/hooks/useBandiTerzoSettore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Props {
  stats: TerzoSettoreStats;
  onCreateBando?: () => void;
  onSelectBando?: (bando: BandoTerzoSettore) => void;
}

const statoColors: Record<string, string> = {
  bozza: 'bg-gray-100 text-gray-800',
  attivo: 'bg-green-100 text-green-800',
  in_chiusura: 'bg-orange-100 text-orange-800',
  concluso: 'bg-blue-100 text-blue-800',
};

const statoLabels: Record<string, string> = {
  bozza: 'Bozza',
  attivo: 'Attivo',
  in_chiusura: 'In chiusura',
  concluso: 'Concluso',
};

export const TSDashboardBandi = ({ stats, onCreateBando, onSelectBando }: Props) => {
  const { data: bandi = [], isLoading } = useBandiTerzoSettore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TSStatsCard
          title="Bandi Attivi"
          value={stats.bandiAttivi}
          icon={FileText}
          color="green"
          onAdd={onCreateBando}
        />
        <TSStatsCard
          title="In Chiusura"
          value={stats.bandiInChiusura}
          icon={Clock}
          color="orange"
        />
        <TSStatsCard
          title="Conclusi"
          value={stats.bandiConclusi}
          icon={CheckCircle}
          color="blue"
        />
        <TSStatsCard
          title="Bozze"
          value={stats.bandiBozza}
          icon={Archive}
          color="purple"
        />
      </div>

      {/* Bandi List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Elenco Bandi</CardTitle>
          {onCreateBando && (
            <Button size="sm" onClick={onCreateBando}>
              <Plus className="w-4 h-4 mr-1" />
              Nuovo Bando
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Caricamento...
            </div>
          ) : bandi.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nessun bando presente</p>
              {onCreateBando && (
                <Button variant="outline" className="mt-4" onClick={onCreateBando}>
                  Crea il primo bando
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bandi.map((bando) => (
                <div
                  key={bando.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectBando?.(bando)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{bando.titolo}</h3>
                        <Badge className={statoColors[bando.stato]}>
                          {statoLabels[bando.stato]}
                        </Badge>
                      </div>
                      {bando.ambito && (
                        <p className="text-sm text-muted-foreground">{bando.ambito}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {bando.data_apertura && (
                          <span>
                            Apertura: {format(new Date(bando.data_apertura), 'dd MMM yyyy', { locale: it })}
                          </span>
                        )}
                        {bando.data_chiusura && (
                          <span>
                            Chiusura: {format(new Date(bando.data_chiusura), 'dd MMM yyyy', { locale: it })}
                          </span>
                        )}
                        <span>{bando.numero_partecipanti} partecipanti</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(bando.plafond_totale)}</p>
                      <p className="text-xs text-muted-foreground">
                        Impegnato: {formatCurrency(bando.plafond_impegnato)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
