import { Calendar, MapPin, Award, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TSStatsCard } from './TSStatsCard';
import { TerzoSettoreStats } from '@/hooks/useTerzoSettoreStats';
import { useAttivitaTerritorio } from '@/hooks/useAttivitaTerritorio';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Props {
  stats: TerzoSettoreStats;
}

const statoColors: Record<string, string> = {
  programmato: 'bg-blue-100 text-blue-800',
  in_corso: 'bg-green-100 text-green-800',
  concluso: 'bg-gray-100 text-gray-800',
};

const statoLabels: Record<string, string> = {
  programmato: 'Programmato',
  in_corso: 'In corso',
  concluso: 'Concluso',
};

export const TSDashboardAttivita = ({ stats }: Props) => {
  const { data: attivita = [], isLoading } = useAttivitaTerritorio();

  const attivitaInCorso = attivita.filter(a => a.stato === 'in_corso');
  const attivitaProgrammate = attivita.filter(a => a.stato === 'programmato');
  const patrocinate = attivita.filter(a => a.patrocinato_comune);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TSStatsCard
          title="Attività In Corso"
          value={stats.attivitaInCorso}
          icon={Calendar}
          color="green"
        />
        <TSStatsCard
          title="Eventi Programmati"
          value={stats.eventiProgrammati}
          icon={Clock}
          color="blue"
        />
        <TSStatsCard
          title="Patrocinati dal Comune"
          value={stats.patrocinati}
          icon={Award}
          color="purple"
        />
        <TSStatsCard
          title="Totale Attività"
          value={attivita.length}
          icon={MapPin}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* In Corso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Attività In Corso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : attivitaInCorso.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessuna attività in corso
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {attivitaInCorso.map((att) => (
                  <div key={att.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{att.titolo}</span>
                          {att.patrocinato_comune && (
                            <Badge variant="secondary" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Patrocinato
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {att.associazione?.denominazione}
                        </p>
                        {att.luogo && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {att.luogo}
                          </p>
                        )}
                      </div>
                      {att.data_inizio && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(att.data_inizio), 'dd MMM', { locale: it })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Programmati */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Eventi Programmati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : attivitaProgrammate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun evento programmato
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {attivitaProgrammate.map((att) => (
                  <div key={att.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{att.titolo}</span>
                          {att.patrocinato_comune && (
                            <Badge variant="secondary" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Patrocinato
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {att.associazione?.denominazione}
                        </p>
                        {att.luogo && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {att.luogo}
                          </p>
                        )}
                      </div>
                      {att.data_inizio && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(att.data_inizio), 'dd MMM yyyy', { locale: it })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patrocinati */}
      {patrocinate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              Iniziative Patrocinate dal Comune
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {patrocinate.map((att) => (
                <div key={att.id} className="p-3 border rounded-lg bg-purple-50/50 dark:bg-purple-900/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statoColors[att.stato]}>
                      {statoLabels[att.stato]}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm">{att.titolo}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {att.associazione?.denominazione}
                  </p>
                  {att.data_inizio && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(att.data_inizio), 'dd MMMM yyyy', { locale: it })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
