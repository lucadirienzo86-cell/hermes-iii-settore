import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface KpiData {
  // Aziende
  totaleAziende: number;
  aziendeConMatch: number;
  aziendeNuoveUltimoMese: number;
  
  // Incroci
  totaleIncroci: number;
  incrociAlti: number; // >= 70%
  incrociMedi: number; // 50-69%
  incrociBandi: number;
  incrociAvvisi: number;
  
  // Pratiche
  totalePratiche: number;
  praticheInCorso: number;
  praticheApprovate: number;
  praticheRifiutate: number;
  praticheBozza: number;
  
  // Distribuzione
  aziendePerRegione: Record<string, number>;
  aziendePerDimensione: Record<string, number>;
  topBandi: Array<{ titolo: string; matchCount: number }>;
}

export const GestoreKpiDashboard = () => {
  const { profile } = useAuth();
  const [kpiData, setKpiData] = useState<KpiData>({
    totaleAziende: 0,
    aziendeConMatch: 0,
    aziendeNuoveUltimoMese: 0,
    totaleIncroci: 0,
    incrociAlti: 0,
    incrociMedi: 0,
    incrociBandi: 0,
    incrociAvvisi: 0,
    totalePratiche: 0,
    praticheInCorso: 0,
    praticheApprovate: 0,
    praticheRifiutate: 0,
    praticheBozza: 0,
    aziendePerRegione: {},
    aziendePerDimensione: {},
    topBandi: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadKpiData();
    }
  }, [profile?.id]);

  // Helper: estrae la sigla provincia da una stringa
  const extractProvincia = (str: string | null): string | null => {
    if (!str) return null;
    const match = str.match(/\(([A-Z]{2})\)/);
    return match ? match[1] : null;
  };

  const calculateMatch = (azienda: any, bando: any): number => {
    // ========== CRITERI VINCOLANTI ==========
    
    // 1. ATECO - OBBLIGATORIO
    if (bando.settore_ateco?.length > 0) {
      if (!azienda.codici_ateco?.length) {
        return 0;
      }
      const hasAtecoMatch = azienda.codici_ateco.some((codiceAzienda: string) =>
        bando.settore_ateco.some((codiceBando: string) => {
          const gruppoAzienda = codiceAzienda.substring(0, 4);
          const gruppoBando = codiceBando.substring(0, 4);
          return gruppoAzienda === gruppoBando;
        })
      );
      if (!hasAtecoMatch) return 0;
    }

    // 2. ZONA - OBBLIGATORIO
    const sediInteresse = bando.sede_interesse || bando.regioni || [];
    if (sediInteresse.length > 0 && !sediInteresse.includes("Tutta Italia")) {
      const aziendaProvincia = extractProvincia(azienda.sede_operativa) 
                            || extractProvincia(azienda.regione);
      const aziendaRegione = azienda.regione?.split(" - ")[0]?.trim();
      
      const zonaMatch = sediInteresse.some((sede: string) => {
        const zonaProvincia = extractProvincia(sede);
        const zonaRegione = sede.split(" - ")[0]?.trim();
        
        if (zonaProvincia && aziendaProvincia) {
          return zonaProvincia === aziendaProvincia;
        }
        return zonaRegione === aziendaRegione;
      });
      
      if (!zonaMatch) return 0;
    }

    // ========== CRITERI FACOLTATIVI ==========
    let totalOptional = 0;
    let matchedOptional = 0;

    // Dimensione Azienda
    const tipoAzienda = bando.tipo_azienda || bando.dimensione_azienda;
    if (tipoAzienda?.length > 0) {
      totalOptional++;
      if (azienda.dimensione_azienda && tipoAzienda.includes(azienda.dimensione_azienda)) {
        matchedOptional++;
      }
    }

    // Numero Dipendenti
    if (bando.numero_dipendenti?.length > 0) {
      totalOptional++;
      if (azienda.numero_dipendenti && bando.numero_dipendenti.includes(azienda.numero_dipendenti)) {
        matchedOptional++;
      }
    }

    return totalOptional > 0 ? Math.round((matchedOptional / totalOptional) * 100) : 100;
  };

  const loadKpiData = async () => {
    try {
      setLoading(true);

      // Trova il gestore
      const { data: gestoreData } = await supabase
        .from('gestori')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!gestoreData) return;

      // Carica tutte le aziende del gestore
      const { data: aziende } = await supabase
        .from('aziende')
        .select('*')
        .eq('inserita_da_gestore_id', gestoreData.id);
      
      const aziendeList = aziende || [];

      // Calcola aziende nuove ultimo mese
      const unMeseFa = new Date();
      unMeseFa.setMonth(unMeseFa.getMonth() - 1);
      const aziendeNuove = aziendeList.filter(a => 
        new Date(a.created_at) >= unMeseFa
      ).length;

      // Distribuzione per regione
      const perRegione: Record<string, number> = {};
      const perDimensione: Record<string, number> = {};
      aziendeList.forEach(a => {
        const regione = a.regione?.split(" - ")[0] || 'Non specificata';
        perRegione[regione] = (perRegione[regione] || 0) + 1;
        
        const dimensione = a.dimensione_azienda || 'Non specificata';
        perDimensione[dimensione] = (perDimensione[dimensione] || 0) + 1;
      });

      // Carica TUTTI i bandi attivi - il matching determinerà quali sono compatibili
      const { data: bandi } = await supabase
        .from('bandi')
        .select('*')
        .eq('attivo', true);

      // Carica avvisi fondi attivi
      const { data: avvisi } = await supabase
        .from('avvisi_fondi')
        .select('*')
        .eq('attivo', true);

      // Calcola incroci
      let totaleIncroci = 0;
      let incrociAlti = 0;
      let incrociMedi = 0;
      let incrociBandi = 0;
      let incrociAvvisi = 0;
      let aziendeConMatch = 0;
      const bandiMatchCount: Record<string, number> = {};

      aziendeList.forEach(azienda => {
        let hasAnyMatch = false;

        // Match con bandi
        bandi.forEach(bando => {
          const percentage = calculateMatch(azienda, bando);
          if (percentage >= 50) {
            totaleIncroci++;
            incrociBandi++;
            hasAnyMatch = true;
            
            if (percentage >= 70) {
              incrociAlti++;
            } else {
              incrociMedi++;
            }

            bandiMatchCount[bando.titolo] = (bandiMatchCount[bando.titolo] || 0) + 1;
          }
        });

        // Match con avvisi
        (avvisi || []).forEach(avviso => {
          const percentage = calculateMatch(azienda, avviso);
          if (percentage >= 50) {
            totaleIncroci++;
            incrociAvvisi++;
            hasAnyMatch = true;
            
            if (percentage >= 70) {
              incrociAlti++;
            } else {
              incrociMedi++;
            }
          }
        });

        if (hasAnyMatch) aziendeConMatch++;
      });

      // Top bandi
      const topBandi = Object.entries(bandiMatchCount)
        .map(([titolo, matchCount]) => ({ titolo, matchCount }))
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 5);

      // Carica pratiche
      const aziendeIds = aziendeList.map(a => a.id);
      let praticheData: any[] = [];
      if (aziendeIds.length > 0) {
        const { data } = await supabase
          .from('pratiche')
          .select('*')
          .in('azienda_id', aziendeIds);
        praticheData = data || [];
      }

      const praticheInCorso = praticheData.filter(p => 
        p.stato === 'in_lavorazione' || p.stato === 'inviata'
      ).length;
      const praticheApprovate = praticheData.filter(p => p.stato === 'approvata').length;
      const praticheRifiutate = praticheData.filter(p => p.stato === 'rifiutata').length;
      const praticheBozza = praticheData.filter(p => p.stato === 'bozza').length;

      setKpiData({
        totaleAziende: aziendeList.length,
        aziendeConMatch,
        aziendeNuoveUltimoMese: aziendeNuove,
        totaleIncroci,
        incrociAlti,
        incrociMedi,
        incrociBandi,
        incrociAvvisi,
        totalePratiche: praticheData.length,
        praticheInCorso,
        praticheApprovate,
        praticheRifiutate,
        praticheBozza,
        aziendePerRegione: perRegione,
        aziendePerDimensione: perDimensione,
        topBandi
      });
    } catch (error) {
      console.error('Errore caricamento KPI:', error);
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

  const matchPercentage = kpiData.totaleAziende > 0 
    ? Math.round((kpiData.aziendeConMatch / kpiData.totaleAziende) * 100) 
    : 0;

  // Ordinamento regioni per numero aziende
  const topRegioni = Object.entries(kpiData.aziendePerRegione)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6 mt-8">
      {/* Header Sezione KPI */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Dashboard KPI</h2>
          <p className="text-sm text-muted-foreground">Panoramica delle performance</p>
        </div>
      </div>

      {/* KPI Cards - Prima riga */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Match Score */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Match Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                {matchPercentage}%
              </span>
              <span className="text-sm text-green-600 dark:text-green-500 mb-1">
                aziende con match
              </span>
            </div>
            <Progress value={matchPercentage} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {kpiData.aziendeConMatch} su {kpiData.totaleAziende} aziende
            </p>
          </CardContent>
        </Card>

        {/* Totale Incroci */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Totale Incroci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {kpiData.totaleIncroci}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-green-300">
                {kpiData.incrociAlti} alti
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 border-yellow-300">
                {kpiData.incrociMedi} medi
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {kpiData.incrociBandi} bandi · {kpiData.incrociAvvisi} avvisi
            </p>
          </CardContent>
        </Card>

        {/* Aziende Nuove */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Crescita Aziende
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                +{kpiData.aziendeNuoveUltimoMese}
              </span>
              {kpiData.aziendeNuoveUltimoMese > 0 && (
                <TrendingUp className="h-5 w-5 text-green-500 mb-1" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nuove aziende questo mese
            </p>
          </CardContent>
        </Card>

        {/* Pratiche Overview */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pratiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              {kpiData.totalePratiche}
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>{kpiData.praticheInCorso} in corso</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{kpiData.praticheApprovate} approvate</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span>{kpiData.praticheRifiutate} rifiutate</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-gray-500" />
                <span>{kpiData.praticheBozza} bozze</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seconda riga - Distribuzione e Top Bandi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuzione per Regione */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Distribuzione per Regione
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRegioni.length > 0 ? (
              <div className="space-y-3">
                {topRegioni.map(([regione, count]) => (
                  <div key={regione} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{regione}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <Progress 
                      value={(count / kpiData.totaleAziende) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>

        {/* Distribuzione per Dimensione */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribuzione per Dimensione
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(kpiData.aziendePerDimensione).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(kpiData.aziendePerDimensione)
                  .sort(([,a], [,b]) => b - a)
                  .map(([dimensione, count]) => (
                    <Badge 
                      key={dimensione} 
                      variant="secondary"
                      className="text-sm py-1.5 px-3"
                    >
                      {dimensione}: {count}
                    </Badge>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Bandi con più match */}
      {kpiData.topBandi.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top Bandi con più Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {kpiData.topBandi.map((bando, index) => (
                <div 
                  key={bando.titolo}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary w-6">#{index + 1}</span>
                    <span className="text-sm truncate max-w-[300px]">{bando.titolo}</span>
                  </div>
                  <Badge variant="outline">
                    {bando.matchCount} match
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link rapido alla pagina incroci */}
      <Link to="/incroci">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Vai alla pagina Incroci</p>
                <p className="text-sm text-muted-foreground">
                  Esplora tutti i match tra aziende e opportunità
                </p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};
