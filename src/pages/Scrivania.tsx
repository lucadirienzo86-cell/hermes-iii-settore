import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  FileWarning, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Clock,
  Plus,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ContattiDipendentiPanel } from '@/components/istituzionale/ContattiDipendentiPanel';
import { TaskManagementPanel } from '@/components/istituzionale/TaskManagementPanel';

const Scrivania = () => {
  const navigate = useNavigate();

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

  // Setup progress calculation - simplified checklist
  const setupSteps = [
    { label: 'Configura il profilo ente', completed: true },
    { label: 'Aggiungi contatti ufficio', completed: true },
    { label: 'Importa associazioni', completed: (stats?.totale || 0) > 0 },
    { label: 'Crea primo bando', completed: (bandiAttivi?.length || 0) > 0 },
  ];
  const completedSteps = setupSteps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / setupSteps.length) * 100;

  return (
    <IstituzionaleLayout breadcrumbs={[{ label: 'Scrivania' }]}>
      <div className="space-y-6">
        {/* Getting Started Card */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stato Avanzamento</p>
                <CardTitle className="text-xl font-bold text-[#1a1a2e]">
                  Configurazione <span className="text-[#003399] font-bold">HERMES</span>
                </CardTitle>
              </div>
              <span className="text-sm font-semibold text-[#003399]">
                {completedSteps}/{setupSteps.length} completati
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            <div className="mb-4">
              <Progress value={progressPercent} className="h-3 bg-gray-100" />
            </div>
            
            {/* Setup checklist */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {setupSteps.map((step, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    step.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${step.completed ? 'text-green-700' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid with Add buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Associations */}
          <Card className="border border-gray-200 shadow-sm bg-white group hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#003399]/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#003399]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a1a2e]">{stats?.totale || 0}</p>
                    <p className="text-sm text-gray-500">Associazioni Totali</p>
                  </div>
                </div>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#003399] hover:bg-[#002266] text-white w-8 h-8"
                  onClick={() => navigate('/istituzionale/associazioni?action=new')}
                  title="Aggiungi Associazione"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active */}
          <Card className="border border-gray-200 shadow-sm bg-white group hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a1a2e]">{stats?.attive || 0}</p>
                    <p className="text-sm text-gray-500">Attive nell'Albo</p>
                  </div>
                </div>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-600 hover:bg-green-700 text-white w-8 h-8"
                  onClick={() => navigate('/istituzionale/associazioni?filter=attiva')}
                  title="Visualizza Attive"
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Registrazioni Autonome */}
          <Card className="border border-gray-200 shadow-sm bg-white group hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a1a2e]">{stats?.registrazioniAutonome || 0}</p>
                    <p className="text-sm text-gray-500">Registrazioni Autonome</p>
                  </div>
                </div>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-purple-600 hover:bg-purple-700 text-white w-8 h-8"
                  onClick={() => navigate('/istituzionale/associazioni?filter=autonome')}
                  title="Visualizza Registrazioni Autonome"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="border border-gray-200 shadow-sm bg-white group hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a1a2e]">{stats?.nuoveRichieste || 0}</p>
                    <p className="text-sm text-gray-500">Da Validare</p>
                  </div>
                </div>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-600 hover:bg-yellow-700 text-white w-8 h-8"
                  onClick={() => navigate('/istituzionale/associazioni?filter=precaricata')}
                  title="Visualizza Da Validare"
                >
                  <Clock className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Management Panel - Full Width */}
        <TaskManagementPanel />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bandi Attivi */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a1a2e]">
                  <div className="w-8 h-8 rounded-lg bg-[#003399] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Bandi Attivi
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon"
                    variant="outline"
                    className="w-8 h-8 border-[#003399] text-[#003399] hover:bg-[#003399] hover:text-white"
                    onClick={() => navigate('/istituzionale/progetti?action=new')}
                    title="Crea Nuovo Bando"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/istituzionale/bandi')}
                    className="text-[#003399] border-[#003399] hover:bg-[#003399]/5"
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
                        <p className="text-sm font-medium text-[#1a1a2e] line-clamp-1">{bando.titolo}</p>
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
                    className="mt-3 bg-[#003399] hover:bg-[#002266]"
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
            <CardTitle className="text-base font-semibold text-[#1a1a2e]">
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
            <p className="text-sm font-medium text-[#1a1a2e]">{getActionLabel(log.azione)}</p>
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
