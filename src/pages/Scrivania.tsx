import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import {
  AlertCircle,
  FileWarning,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Plus,
  UserPlus,
  Heart,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ContattiDipendentiPanel } from '@/components/istituzionale/ContattiDipendentiPanel';
import { TaskManagementPanel } from '@/components/istituzionale/TaskManagementPanel';

const Scrivania = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Fetch association stats
  const { data: stats } = useQuery({
    queryKey: ['scrivania-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .select('id, stato_albo, campi_completi, attiva, fonte_dato');

      if (error) throw error;

      const totale = data?.length || 0;
      const attive = data?.filter(a => a.stato_albo === 'attiva').length || 0;
      const sospese = data?.filter(a => a.stato_albo === 'in_revisione').length || 0;
      const inAttesa = data?.filter(a => a.stato_albo === 'precaricata' || a.stato_albo === 'invitata').length || 0;
      const nuoveRichieste = data?.filter(a => a.stato_albo === 'precaricata' && !a.campi_completi).length || 0;
      const docCarenti = data?.filter(a => !a.campi_completi && a.stato_albo === 'attiva').length || 0;
      const registrazioniAutonome = data?.filter(a => a.fonte_dato === 'registrazione_autonoma').length || 0;

      return { totale, attive, sospese, inAttesa, nuoveRichieste, docCarenti, registrazioniAutonome };
    },
  });

  // Fetch active bandi
  const { data: bandiAttivi } = useQuery({
    queryKey: ['scrivania-bandi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bandi_terzo_settore')
        .select('id, titolo, data_chiusura, stato')
        .eq('stato', 'attivo')
        .order('data_chiusura', { ascending: true })
        .limit(4);

      if (error) throw error;
      return data || [];
    },
  });

  const userName = (profile as { full_name?: string } | null)?.full_name
    || (profile as { nome?: string; cognome?: string } | null)?.nome
    || 'Funzionario';
  const userEmail = profile?.email || '';

  return (
    <IstituzionaleLayout breadcrumbs={[{ label: 'Scrivania' }]}>
      <div className="space-y-6">

        {/* Hero Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Scrivania</h1>
                  <p className="text-sm text-gray-500">
                    Benvenuto, <span className="font-medium text-gray-700">{userName}</span>
                    {userEmail && <> • {userEmail}</>}
                    {' '}• Gestisci il Terzo Settore del Comune
                  </p>
                </div>
              </div>
            </div>

            {/* Pill counters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-3 py-1 text-xs font-semibold">
                <span className="font-bold mr-1">{stats?.totale ?? 0}</span> associazioni
              </Badge>
              <Badge className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-semibold">
                <span className="font-bold mr-1">{bandiAttivi?.length ?? 0}</span> bandi attivi
              </Badge>
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-semibold">
                <span className="font-bold mr-1">{stats?.nuoveRichieste ?? 0}</span> da validare
              </Badge>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Associazioni Totali"
            value={stats?.totale || 0}
            subtitle="Nell'albo comunale"
            icon={Users}
            colorVariant="primary"
            href="/istituzionale/associazioni"
            addHref="/istituzionale/associazioni?action=new"
            animationDelay={0}
          />
          <StatCard
            title="Attive nell'Albo"
            value={stats?.attive || 0}
            subtitle="Iscrizione attiva"
            icon={TrendingUp}
            colorVariant="green"
            href="/istituzionale/associazioni?filter=attiva"
            animationDelay={1}
          />
          <StatCard
            title="Registrazioni Autonome"
            value={stats?.registrazioniAutonome || 0}
            subtitle="Auto-registrate"
            icon={UserPlus}
            colorVariant="purple"
            href="/istituzionale/associazioni?filter=autonome"
            animationDelay={2}
          />
          <StatCard
            title="Da Validare"
            value={stats?.nuoveRichieste || 0}
            subtitle="In attesa di revisione"
            icon={Clock}
            colorVariant="amber"
            href="/istituzionale/associazioni?filter=precaricata"
            animationDelay={3}
          />
        </div>

        {/* Task Management Panel */}
        <TaskManagementPanel />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bandi Attivi */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#0D9488]" />
                  </div>
                  Bandi Attivi
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-8 h-8 border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488] hover:text-white"
                    onClick={() => navigate('/istituzionale/progetti?action=new')}
                    title="Crea Nuovo Bando"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/istituzionale/bandi')}
                    className="text-[#0D9488] border-[#0D9488] hover:bg-[#0D9488]/5"
                  >
                    Vedi tutti
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {bandiAttivi && bandiAttivi.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {bandiAttivi.map((bando) => (
                    <li key={bando.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{bando.titolo}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Scadenza: {bando.data_chiusura
                              ? format(new Date(bando.data_chiusura), 'dd/MM/yyyy', { locale: it })
                              : 'N/D'
                            }
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Attivo
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileWarning className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessun bando attivo</p>
                  <Button
                    size="sm"
                    className="mt-3 bg-[#0D9488] hover:bg-[#0B7C71]"
                    onClick={() => navigate('/istituzionale/progetti?action=new')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crea Bando
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contatti Dipendenti */}
          <ContattiDipendentiPanel />
        </div>

        {/* Recent Activity */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-gray-500" />
              </div>
              Attività Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </IstituzionaleLayout>
  );
};

// Recent Activity Component
const RecentActivity = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['recent-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log_terzo_settore')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nessuna attività recente</p>
      </div>
    );
  }

  const getActionLabel = (azione: string) => {
    const labels: Record<string, string> = {
      'cambio_stato': 'Cambio stato',
      'invio_comunicazione': 'Comunicazione inviata',
      'modifica_dati': 'Dati modificati',
      'creazione': 'Nuova registrazione',
    };
    return labels[azione] || azione;
  };

  return (
    <ul className="divide-y divide-gray-100">
      {logs.map((log) => (
        <li key={log.id} className="py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{getActionLabel(log.azione)}</p>
            <p className="text-xs text-gray-500">
              {log.entity_type} • {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default Scrivania;
