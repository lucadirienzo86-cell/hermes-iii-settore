import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BarChart3,
  Users,
  FolderOpen,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface KpiData {
  // Pratiche
  totalePratiche: number;
  praticheRichiesta: number;
  pratichePresaInCarico: number;
  praticheDocumentiMancanti: number;
  praticheInCorso: number;
  praticheAccettate: number;
  praticheRifiutate: number;
  praticheInErogazione: number;
  praticheErogate: number;
  
  // Aziende
  totaleAziende: number;
  aziendeConPratiche: number;
  
  // Professionisti
  professionistiAssegnati: number;
  docentiAssegnati: number;
  
  // Distribuzione per stato
  pratichePerStato: Record<string, number>;
  praticheRecenti: Array<{ titolo: string; azienda: string; stato: string; id: string }>;
}

const STATI_LABELS: Record<string, { label: string; color: string }> = {
  richiesta: { label: 'Richiesta', color: 'bg-blue-500' },
  presa_in_carico: { label: 'Presa in carico', color: 'bg-indigo-500' },
  documenti_mancanti: { label: 'Doc. mancanti', color: 'bg-amber-500' },
  in_corso: { label: 'In corso', color: 'bg-cyan-500' },
  accettata: { label: 'Accettata', color: 'bg-emerald-500' },
  rifiutata: { label: 'Rifiutata', color: 'bg-red-500' },
  in_erogazione: { label: 'In erogazione', color: 'bg-violet-500' },
  erogata: { label: 'Erogata', color: 'bg-green-600' }
};

export const GestorePraticheKpiDashboard = () => {
  const { profile } = useAuth();
  const [kpiData, setKpiData] = useState<KpiData>({
    totalePratiche: 0,
    praticheRichiesta: 0,
    pratichePresaInCarico: 0,
    praticheDocumentiMancanti: 0,
    praticheInCorso: 0,
    praticheAccettate: 0,
    praticheRifiutate: 0,
    praticheInErogazione: 0,
    praticheErogate: 0,
    totaleAziende: 0,
    aziendeConPratiche: 0,
    professionistiAssegnati: 0,
    docentiAssegnati: 0,
    pratichePerStato: {},
    praticheRecenti: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadKpiData();
    }
  }, [profile?.id]);

  const loadKpiData = async () => {
    try {
      setLoading(true);

      // Trova il gestore pratiche
      const { data: gpData } = await supabase
        .from('gestori_pratiche')
        .select('id')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (!gpData) {
        setLoading(false);
        return;
      }

      // Carica le assegnazioni (professionisti e docenti)
      const { data: assegnazioni } = await supabase
        .from('gestori_pratiche_assegnazioni')
        .select('gestore_id, docente_id')
        .eq('gestore_pratiche_id', gpData.id);

      const professionistiAssegnati = (assegnazioni || []).filter(a => a.gestore_id).length;
      const docentiAssegnati = (assegnazioni || []).filter(a => a.docente_id).length;

      // Carica le pratiche assegnate al gestore pratiche
      const { data: pratiche } = await supabase
        .from('pratiche')
        .select(`
          *,
          azienda:aziende(ragione_sociale)
        `)
        .eq('gestore_pratiche_id', gpData.id);

      // Carica anche le pratiche non assegnate (stato richiesta)
      const { data: praticheNonAssegnate } = await supabase
        .from('pratiche')
        .select(`
          *,
          azienda:aziende(ragione_sociale)
        `)
        .eq('stato', 'richiesta')
        .is('gestore_pratiche_id', null);

      const tuttePratiche = [...(pratiche || []), ...(praticheNonAssegnate || [])];
      
      // Conta per stato
      const perStato: Record<string, number> = {};
      tuttePratiche.forEach(p => {
        const stato = p.stato || 'bozza';
        perStato[stato] = (perStato[stato] || 0) + 1;
      });

      // Conta aziende
      const { count: aziendeCount } = await supabase
        .from('aziende')
        .select('id', { count: 'exact', head: true });

      // Aziende con pratiche
      const aziendeConPratiche = new Set(tuttePratiche.map(p => p.azienda_id)).size;

      // Pratiche recenti (ultime 5)
      const praticheRecenti = tuttePratiche
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          titolo: p.titolo,
          azienda: p.azienda?.ragione_sociale || 'N/A',
          stato: p.stato || 'bozza'
        }));

      setKpiData({
        totalePratiche: tuttePratiche.length,
        praticheRichiesta: perStato['richiesta'] || 0,
        pratichePresaInCarico: perStato['presa_in_carico'] || 0,
        praticheDocumentiMancanti: perStato['documenti_mancanti'] || 0,
        praticheInCorso: perStato['in_corso'] || 0,
        praticheAccettate: perStato['accettata'] || 0,
        praticheRifiutate: perStato['rifiutata'] || 0,
        praticheInErogazione: perStato['in_erogazione'] || 0,
        praticheErogate: perStato['erogata'] || 0,
        totaleAziende: aziendeCount || 0,
        aziendeConPratiche,
        professionistiAssegnati,
        docentiAssegnati,
        pratichePerStato: perStato,
        praticheRecenti
      });
    } catch (error) {
      console.error('Errore caricamento KPI Gestore Pratiche:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  const praticheAttive = kpiData.pratichePresaInCarico + kpiData.praticheInCorso + kpiData.praticheDocumentiMancanti;
  const praticheCompletate = kpiData.praticheAccettate + kpiData.praticheErogate;
  const tassoCompletamento = kpiData.totalePratiche > 0 
    ? Math.round((praticheCompletate / kpiData.totalePratiche) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Sezione KPI */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Dashboard KPI</h2>
          <p className="text-sm text-muted-foreground">Panoramica delle tue attività</p>
        </div>
      </div>

      {/* KPI Cards - Prima riga */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pratiche Totali */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Pratiche Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {kpiData.totalePratiche}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-300">
                {kpiData.praticheRichiesta} in attesa
              </Badge>
              <Badge variant="outline" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400 border-cyan-300">
                {praticheAttive} attive
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tasso Completamento */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Tasso Completamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                {tassoCompletamento}%
              </span>
              {tassoCompletamento > 0 && (
                <TrendingUp className="h-5 w-5 text-green-500 mb-1" />
              )}
            </div>
            <Progress value={tassoCompletamento} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {praticheCompletate} pratiche completate
            </p>
          </CardContent>
        </Card>

        {/* Aziende Collegate */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Aziende
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {kpiData.aziendeConPratiche}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aziende con pratiche attive
            </p>
          </CardContent>
        </Card>

        {/* Collaboratori */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assegnazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              {kpiData.professionistiAssegnati + kpiData.docentiAssegnati}
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-muted-foreground">
                {kpiData.professionistiAssegnati} professionisti
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {kpiData.docentiAssegnati} docenti
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seconda riga - Distribuzione Stati e Pratiche Recenti */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuzione per Stato */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribuzione per Stato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(kpiData.pratichePerStato).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(kpiData.pratichePerStato)
                  .sort(([,a], [,b]) => b - a)
                  .map(([stato, count]) => {
                    const stateInfo = STATI_LABELS[stato] || { label: stato, color: 'bg-gray-500' };
                    const percentage = kpiData.totalePratiche > 0 
                      ? Math.round((count / kpiData.totalePratiche) * 100) 
                      : 0;
                    
                    return (
                      <div key={stato} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${stateInfo.color}`} />
                            <span>{stateInfo.label}</span>
                          </div>
                          <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna pratica</p>
            )}
          </CardContent>
        </Card>

        {/* Pratiche Recenti */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Pratiche Recenti
              </div>
              <Link to="/pratiche" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Vedi tutte <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiData.praticheRecenti.length > 0 ? (
              <div className="space-y-3">
                {kpiData.praticheRecenti.map((pratica) => {
                  const stateInfo = STATI_LABELS[pratica.stato] || { label: pratica.stato, color: 'bg-gray-500' };
                  
                  return (
                    <Link 
                      key={pratica.id} 
                      to={`/pratiche/${pratica.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{pratica.titolo}</p>
                        <p className="text-xs text-muted-foreground truncate">{pratica.azienda}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${stateInfo.color} text-white border-none text-xs shrink-0 ml-2`}
                      >
                        {stateInfo.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna pratica recente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riepilogo Azioni Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiData.praticheRichiesta > 0 && (
          <Link to="/pratiche">
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      {kpiData.praticheRichiesta} pratiche da prendere in carico
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Clicca per gestirle</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
        
        {kpiData.praticheDocumentiMancanti > 0 && (
          <Link to="/pratiche">
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-300">
                      {kpiData.praticheDocumentiMancanti} pratiche con doc. mancanti
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Richiedi i documenti</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {kpiData.praticheAccettate > 0 && (
          <Link to="/pratiche">
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">
                      {kpiData.praticheAccettate} pratiche accettate
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">In attesa di erogazione</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
};
