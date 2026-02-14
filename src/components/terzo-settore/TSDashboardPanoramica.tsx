import { Building2, Users, CheckCircle, XCircle, Shield, AlertCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TSStatsCard } from './TSStatsCard';
import { TerzoSettoreStats } from '@/hooks/useTerzoSettoreStats';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
  stats: TerzoSettoreStats;
}

const TIPOLOGIA_COLORS = {
  APS: '#3b82f6',
  ETS: '#10b981',
  ODV: '#f59e0b',
  Cooperativa: '#8b5cf6',
  Altro: '#6b7280',
};

const RUNTS_COLORS = {
  dichiarato: '#f59e0b',
  verificato: '#10b981',
  non_iscritto: '#ef4444',
};

export const TSDashboardPanoramica = ({ stats }: Props) => {
  const tipologiaData = Object.entries(stats.associazioniPerTipologia).map(([name, value]) => ({
    name,
    value,
    color: TIPOLOGIA_COLORS[name as keyof typeof TIPOLOGIA_COLORS] || '#6b7280',
  }));

  const runtsData = Object.entries(stats.statoRunts).map(([name, value]) => ({
    name: name === 'non_iscritto' ? 'Non iscritto' : name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: RUNTS_COLORS[name as keyof typeof RUNTS_COLORS] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TSStatsCard
          title="Totale Associazioni"
          value={stats.totaleAssociazioni}
          icon={Building2}
          color="blue"
          href="/istituzionale/associazioni"
          addHref="/istituzionale/associazioni?action=new"
        />
        <TSStatsCard
          title="Associazioni Attive"
          value={stats.associazioniAttive}
          subtitle={`${stats.associazioniInattive} inattive`}
          icon={CheckCircle}
          color="green"
          href="/istituzionale/associazioni?filter=attiva"
        />
        <TSStatsCard
          title="RUNTS Verificate"
          value={stats.statoRunts['verificato'] || 0}
          subtitle="Iscrizione confermata"
          icon={Shield}
          color="purple"
          href="/istituzionale/associazioni?filter=runts_verificato"
        />
        <TSStatsCard
          title="In Attesa Verifica"
          value={(stats.statoRunts['dichiarato'] || 0)}
          subtitle="Stato dichiarato"
          icon={AlertCircle}
          color="orange"
          href="/istituzionale/associazioni?filter=runts_dichiarato"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipologia Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuzione per Tipologia</CardTitle>
          </CardHeader>
          <CardContent>
            {tipologiaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tipologiaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tipologiaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna associazione registrata</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RUNTS Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stato RUNTS</CardTitle>
          </CardHeader>
          <CardContent>
            {runtsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={runtsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {runtsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nessun dato disponibile</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
