import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Building2
} from 'lucide-react';
import { LIVELLO_LABELS } from '@/lib/api/bandiApi';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard = ({ title, value, icon, trend, color = 'primary' }: StatCardProps) => {
  const colorClasses = {
    primary: 'bg-ist-primary/10 text-ist-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
  };

  return (
    <Card className="ist-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              {title}
            </p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const BandiGovernanceStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['bandi-governance-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch all active bandi
      const { data: bandi, error } = await supabase
        .from('bandi')
        .select('id, attivo, data_chiusura, data_apertura, livello, fonte');

      if (error) throw error;

      const all = bandi || [];
      const attivi = all.filter(b => b.attivo);
      const inScadenza = attivi.filter(b => 
        b.data_chiusura && b.data_chiusura <= nextWeek && b.data_chiusura >= today
      );
      const scaduti = all.filter(b => 
        b.data_chiusura && b.data_chiusura < today
      );
      const inApertura = all.filter(b => 
        b.data_apertura && b.data_apertura > today
      );

      // Count by level
      const byLivello = attivi.reduce((acc, b) => {
        const lvl = b.livello || 'ALTRO';
        acc[lvl] = (acc[lvl] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totaleAttivi: attivi.length,
        inScadenza: inScadenza.length,
        scaduti: scaduti.length,
        inApertura: inApertura.length,
        byLivello,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bandi Attivi"
          value={stats?.totaleAttivi || 0}
          icon={<FileText className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          title="In Scadenza (7gg)"
          value={stats?.inScadenza || 0}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
        <StatCard
          title="In Apertura"
          value={stats?.inApertura || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          title="Scaduti"
          value={stats?.scaduti || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
        />
      </div>

      {/* By Level */}
      <Card className="ist-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Distribuzione per Livello
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats?.byLivello || {}).map(([livello, count]) => (
              <div key={livello} className="text-center p-3 bg-muted/50 rounded-lg">
                <Building2 className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{count as number}</p>
                <p className="text-xs text-muted-foreground">
                  {LIVELLO_LABELS[livello] || livello}
                </p>
              </div>
            ))}
            {Object.keys(stats?.byLivello || {}).length === 0 && (
              <p className="col-span-4 text-center text-muted-foreground py-4">
                Nessun bando presente
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
