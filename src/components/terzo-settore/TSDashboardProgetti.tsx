import { Briefcase, Clock, CheckCircle, XCircle, Play, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TSStatsCard } from './TSStatsCard';
import { TerzoSettoreStats } from '@/hooks/useTerzoSettoreStats';
import { useProgettiTerzoSettore, ProgettoTerzoSettore } from '@/hooks/useProgettiTerzoSettore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  stats: TerzoSettoreStats;
  onSelectProgetto?: (progetto: ProgettoTerzoSettore) => void;
}

const statoColors: Record<string, string> = {
  candidatura_inviata: 'bg-gray-100 text-gray-800',
  in_valutazione: 'bg-yellow-100 text-yellow-800',
  approvato: 'bg-green-100 text-green-800',
  respinto: 'bg-red-100 text-red-800',
  avviato: 'bg-blue-100 text-blue-800',
  in_corso: 'bg-purple-100 text-purple-800',
  completato: 'bg-emerald-100 text-emerald-800',
};

const statoLabels: Record<string, string> = {
  candidatura_inviata: 'Candidatura',
  in_valutazione: 'In valutazione',
  approvato: 'Approvato',
  respinto: 'Respinto',
  avviato: 'Avviato',
  in_corso: 'In corso',
  completato: 'Completato',
};

const chartColors: Record<string, string> = {
  candidatura_inviata: '#9ca3af',
  in_valutazione: '#fbbf24',
  approvato: '#22c55e',
  respinto: '#ef4444',
  avviato: '#3b82f6',
  in_corso: '#8b5cf6',
  completato: '#10b981',
};

export const TSDashboardProgetti = ({ stats, onSelectProgetto }: Props) => {
  const { data: progetti = [], isLoading } = useProgettiTerzoSettore();

  const chartData = Object.entries(stats.progettiPerStato).map(([stato, count]) => ({
    name: statoLabels[stato] || stato,
    value: count,
    fill: chartColors[stato] || '#6b7280',
  }));

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TSStatsCard
          title="Progetti Finanziati"
          value={stats.progettiFinanziati}
          icon={CheckCircle}
          color="green"
        />
        <TSStatsCard
          title="In Corso"
          value={stats.progettiInCorso}
          icon={Play}
          color="blue"
        />
        <TSStatsCard
          title="Completati"
          value={stats.progettiCompletati}
          icon={Briefcase}
          color="purple"
        />
        <TSStatsCard
          title="In Valutazione"
          value={stats.progettiPerStato['in_valutazione'] || 0}
          icon={Clock}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progetti per Stato</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nessun progetto presente
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progetti Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : progetti.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun progetto presente
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {progetti.slice(0, 10).map((progetto) => (
                  <div
                    key={progetto.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onSelectProgetto?.(progetto)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{progetto.titolo}</span>
                          <Badge className={`${statoColors[progetto.stato]} text-xs`}>
                            {statoLabels[progetto.stato]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {progetto.associazione?.denominazione}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(progetto.data_candidatura), 'dd MMM yyyy', { locale: it })}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{formatCurrency(progetto.importo_richiesto)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
