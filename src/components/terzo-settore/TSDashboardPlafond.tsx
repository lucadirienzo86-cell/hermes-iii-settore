import { Wallet, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TSStatsCard } from './TSStatsCard';
import { TerzoSettoreStats } from '@/hooks/useTerzoSettoreStats';
import { useBandiTerzoSettore } from '@/hooks/useBandiTerzoSettore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  stats: TerzoSettoreStats;
}

export const TSDashboardPlafond = ({ stats }: Props) => {
  const { data: bandi = [] } = useBandiTerzoSettore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const percentualeUtilizzo = stats.plafondTotale > 0 
    ? Math.round((stats.plafondImpegnato / stats.plafondTotale) * 100) 
    : 0;

  // Chart data per bando
  const chartData = bandi
    .filter(b => b.plafond_totale > 0)
    .slice(0, 8)
    .map(b => ({
      name: b.titolo.length > 20 ? b.titolo.substring(0, 20) + '...' : b.titolo,
      Totale: b.plafond_totale,
      Impegnato: b.plafond_impegnato,
      Residuo: b.plafond_totale - b.plafond_impegnato,
    }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TSStatsCard
          title="Plafond Totale"
          value={formatCurrency(stats.plafondTotale)}
          icon={Wallet}
          color="blue"
        />
        <TSStatsCard
          title="Impegnato"
          value={formatCurrency(stats.plafondImpegnato)}
          subtitle={`${percentualeUtilizzo}% del totale`}
          icon={TrendingDown}
          color="orange"
        />
        <TSStatsCard
          title="Residuo"
          value={formatCurrency(stats.plafondResiduo)}
          subtitle="Disponibile"
          icon={PiggyBank}
          color="green"
        />
        <TSStatsCard
          title="Bandi con Plafond"
          value={bandi.filter(b => b.plafond_totale > 0).length}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Progress generale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilizzo Complessivo Risorse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso utilizzo</span>
              <span className="font-medium">{percentualeUtilizzo}%</span>
            </div>
            <Progress value={percentualeUtilizzo} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(stats.plafondImpegnato)} impegnato</span>
              <span>{formatCurrency(stats.plafondResiduo)} residuo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart distribuzione per bando */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuzione per Bando</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="Impegnato" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Residuo" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nessun bando con plafond definito</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dettaglio per bando */}
      {bandi.filter(b => b.plafond_totale > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dettaglio Risorse per Bando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bandi
                .filter(b => b.plafond_totale > 0)
                .map((bando) => {
                  const percentuale = Math.round((bando.plafond_impegnato / bando.plafond_totale) * 100);
                  return (
                    <div key={bando.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{bando.titolo}</h4>
                        <span className="text-sm font-semibold">{formatCurrency(bando.plafond_totale)}</span>
                      </div>
                      <Progress value={percentuale} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Impegnato: {formatCurrency(bando.plafond_impegnato)} ({percentuale}%)
                        </span>
                        <span>
                          Residuo: {formatCurrency(bando.plafond_totale - bando.plafond_impegnato)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
