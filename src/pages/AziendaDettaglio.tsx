import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  FileText,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Percent,
  GraduationCap,
  Briefcase,
  Clock,
  ExternalLink,
  Tag,
  Sparkles,
  AlertTriangle,
  Euro,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import BadgeManager from "@/components/BadgeManager";
import BadgeHistory from "@/components/BadgeHistory";
import { BadgeSuggestionsAI } from "@/components/BadgeSuggestionsAI";
import { useBadgeFormativi } from "@/hooks/useBadgeFormativi";
import { useBandiCompatibility, BandoCompatibility, AziendaData } from "@/hooks/useBandiCompatibility";
import { useFondiCompatibilityApp, AvvisoCompatibility, AziendaData as FondiAziendaData } from "@/hooks/useFondiCompatibilityApp";
import { usePratiche } from "@/hooks/usePratiche";
import { subYears, parseISO, isBefore, startOfDay } from "date-fns";

// Tipi per aiuti RNA
interface AiutoItem {
  autoritaConcedente?: string;
  titoloMisura?: string;
  importoAgevolazione?: number | null;
  dataConcessione?: string;
  tipologia?: string;
  titoloProgetto?: string;
  strumento?: string;
}

interface RnaData {
  found: boolean;
  aiuti: AiutoItem[];
  numeroAiuti: number;
  numeroAiutiDeminimis: number;
  aiutiDeminimis: AiutoItem[];
}

// Helpers per formattazione
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatRnaDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    return date.toLocaleDateString('it-IT');
  } catch {
    return dateString;
  }
};

interface Azienda {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
  codice_fiscale?: string;
  email?: string;
  pec?: string;
  telefono?: string;
  sito_web?: string;
  regione?: string;
  sede_operativa?: string;
  codice_ateco?: string;
  codici_ateco?: string[];
  settore?: string;
  dimensione_azienda?: string;
  numero_dipendenti?: string;
  costituzione_societa?: string;
  data_costituzione?: string;
  forma_giuridica?: string;
  capitale_sociale?: number;
  descrizione_attivita?: string;
  cciaa?: string;
  numero_rea?: string;
  stato_attivita?: string;
  badge_formativi?: string[];
  investimenti_interesse?: string[];
  spese_interesse?: string[];
  dati_aggiuntivi?: any;
  created_at: string;
  updated_at?: string;
  profile_id?: string;
  inserita_da_gestore_id?: string;
  inserita_da_collaboratore_id?: string;
  inserita_da_docente_id?: string;
}

interface AziendaFondo {
  id: string;
  fondo_id: string;
  data_adesione?: string;
  matricola_inps?: string;
  verificato: boolean;
  fondo: {
    nome: string;
    codice?: string;
  };
}

const AziendaDettaglio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [azienda, setAzienda] = useState<Azienda | null>(null);
  const [fondiAzienda, setFondiAzienda] = useState<AziendaFondo[]>([]);
  const [loading, setLoading] = useState(true);
  const [aziendaBadges, setAziendaBadges] = useState<string[]>([]);
  
  // Stati per RNA
  const [rnaData, setRnaData] = useState<RnaData | null>(null);
  const [loadingRna, setLoadingRna] = useState(false);
  const [rnaError, setRnaError] = useState<string | null>(null);
  const [showStorico, setShowStorico] = useState(false);
  const [rnaLastUpdate, setRnaLastUpdate] = useState<string | null>(null);
  const [rnaFromDb, setRnaFromDb] = useState(false);
  
  const { bandi, calculateCompatibility } = useBandiCompatibility();
  const { avvisi, calculateCompatibility: calculateAvvisiCompatibility } = useFondiCompatibilityApp();
  const { pratiche } = usePratiche(id);
  const { badgeFormativi } = useBadgeFormativi();

  const [bandiCompatibili, setBandiCompatibili] = useState<BandoCompatibility[]>([]);
  const [avvisiCompatibili, setAvvisiCompatibili] = useState<AvvisoCompatibility[]>([]);

  useEffect(() => {
    if (id) {
      loadAzienda();
      loadFondiAzienda();
    }
  }, [id]);

  // Carica automaticamente i dati RNA dal database quando l'azienda viene caricata
  useEffect(() => {
    if (id) {
      loadRnaFromDatabase();
    }
  }, [id]);

  // Carica dati RNA salvati nel database
  const loadRnaFromDatabase = async () => {
    if (!id) return;
    
    setLoadingRna(true);
    setRnaError(null);
    
    try {
      const { data, error } = await supabase
        .from('aziende_aiuti_rna')
        .select('*')
        .eq('azienda_id', id)
        .order('data_concessione', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Trasforma i dati del DB nel formato RnaData
        const aiutiDeminimis: AiutoItem[] = data.map(item => ({
          autoritaConcedente: item.autorita_concedente || undefined,
          titoloMisura: item.titolo_misura || undefined,
          importoAgevolazione: item.importo_agevolazione ? Number(item.importo_agevolazione) : null,
          dataConcessione: item.data_concessione || undefined,
          tipologia: item.tipologia || undefined,
          titoloProgetto: item.titolo_progetto || undefined,
          strumento: item.strumento || undefined,
        }));
        
        setRnaData({
          found: true,
          aiuti: aiutiDeminimis,
          numeroAiuti: aiutiDeminimis.length,
          numeroAiutiDeminimis: aiutiDeminimis.length,
          aiutiDeminimis
        });
        
        // Trova la data di aggiornamento più recente
        const dates = data.map(d => d.updated_at || d.created_at).filter(Boolean);
        if (dates.length > 0) {
          const mostRecent = dates.sort().reverse()[0];
          setRnaLastUpdate(mostRecent);
        }
        setRnaFromDb(true);
      } else {
        // Nessun dato nel DB, carica dall'API
        if (azienda?.partita_iva) {
          await refreshRnaFromApi(azienda.partita_iva);
        }
      }
    } catch (error: any) {
      console.error('Errore caricamento RNA da DB:', error);
      // Se fallisce il DB, prova l'API
      if (azienda?.partita_iva) {
        await refreshRnaFromApi(azienda.partita_iva);
      }
    } finally {
      setLoadingRna(false);
    }
  };

  // Ricarica dati RNA dall'API e salva nel database
  const refreshRnaFromApi = async (partitaIva: string) => {
    setLoadingRna(true);
    setRnaError(null);
    setRnaFromDb(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('rna-check', {
        body: { partitaIva }
      });
      
      if (error) throw error;
      
      const rnaResult = data?.rna;
      setRnaData(rnaResult || null);
      
      // Salva nel database
      if (rnaResult?.found && rnaResult?.aiutiDeminimis && id) {
        await saveRnaToDatabase(rnaResult.aiutiDeminimis);
      } else if (id) {
        // Se non ci sono aiuti, cancella eventuali vecchi dati
        await supabase
          .from('aziende_aiuti_rna')
          .delete()
          .eq('azienda_id', id);
      }
      
      setRnaLastUpdate(new Date().toISOString());
      setRnaFromDb(false);
      
      toast({
        title: "Dati RNA aggiornati",
        description: "I dati del Registro Nazionale Aiuti sono stati aggiornati",
      });
    } catch (error: any) {
      console.error('Errore caricamento RNA:', error);
      setRnaError(error.message || 'Errore caricamento dati RNA');
    } finally {
      setLoadingRna(false);
    }
  };

  // Salva aiuti RNA nel database
  const saveRnaToDatabase = async (aiutiDeminimis: AiutoItem[]) => {
    if (!id) return;
    
    try {
      // Prima elimina i vecchi dati
      await supabase
        .from('aziende_aiuti_rna')
        .delete()
        .eq('azienda_id', id);
      
      // Inserisci i nuovi dati
      if (aiutiDeminimis.length > 0) {
        const recordsToInsert = aiutiDeminimis.map(aiuto => ({
          azienda_id: id,
          titolo_progetto: aiuto.titoloProgetto || null,
          titolo_misura: aiuto.titoloMisura || null,
          autorita_concedente: aiuto.autoritaConcedente || null,
          importo_agevolazione: aiuto.importoAgevolazione || null,
          data_concessione: aiuto.dataConcessione || null,
          tipologia: aiuto.tipologia || null,
          strumento: aiuto.strumento || null,
        }));
        
        const { error } = await supabase
          .from('aziende_aiuti_rna')
          .insert(recordsToInsert);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Errore salvataggio RNA nel database:', error);
    }
  };

  // Calcola aiuti de minimis rilevanti (ultimi 3 anni) e storici
  const getAiutiSeparati = () => {
    if (!rnaData?.aiutiDeminimis || rnaData.aiutiDeminimis.length === 0) {
      return { rilevanti: [], storici: [], totaleRilevante: 0, totaleStorico: 0 };
    }

    const oggi = startOfDay(new Date());
    const treAnni = subYears(oggi, 3);

    const rilevanti: AiutoItem[] = [];
    const storici: AiutoItem[] = [];
    let totaleRilevante = 0;
    let totaleStorico = 0;

    rnaData.aiutiDeminimis.forEach((aiuto) => {
      const importo = aiuto.importoAgevolazione || 0;
      
      if (aiuto.dataConcessione) {
        try {
          const dataAiuto = parseISO(aiuto.dataConcessione);
          if (isBefore(dataAiuto, treAnni)) {
            storici.push(aiuto);
            totaleStorico += importo;
          } else {
            rilevanti.push(aiuto);
            totaleRilevante += importo;
          }
        } catch {
          // Se non riesce a parsare la data, considera rilevante
          rilevanti.push(aiuto);
          totaleRilevante += importo;
        }
      } else {
        // Senza data, considera rilevante
        rilevanti.push(aiuto);
        totaleRilevante += importo;
      }
    });

    return { rilevanti, storici, totaleRilevante, totaleStorico };
  };

  const MASSIMALE_DEMINIMIS = 300000;

  useEffect(() => {
    if (azienda && bandi.length > 0) {
      const aziendaData: AziendaData = {
        id: azienda.id,
        ragione_sociale: azienda.ragione_sociale,
        codici_ateco: azienda.codici_ateco || null,
        regione: azienda.regione || null,
        dimensione_azienda: azienda.dimensione_azienda || null,
        numero_dipendenti: azienda.numero_dipendenti || null,
        costituzione_societa: azienda.costituzione_societa || null,
        investimenti_interesse: azienda.investimenti_interesse || null,
        spese_interesse: azienda.spese_interesse || null,
        sede_operativa: azienda.sede_operativa || null,
      };
      const results = calculateCompatibility(aziendaData, bandi);
      setBandiCompatibili(results.filter(b => b.compatibile).sort((a, b) => b.compatibilita_percentuale - a.compatibilita_percentuale));
    }
  }, [azienda, bandi]);

  useEffect(() => {
    if (azienda && avvisi.length > 0) {
      const aziendaData: FondiAziendaData = {
        id: azienda.id,
        ragione_sociale: azienda.ragione_sociale,
        codici_ateco: azienda.codici_ateco || null,
        regione: azienda.regione || null,
        dimensione_azienda: azienda.dimensione_azienda || null,
        numero_dipendenti: azienda.numero_dipendenti || null,
        badge_formativi: azienda.badge_formativi || null,
        sede_operativa: azienda.sede_operativa || null,
      };
      const results = calculateAvvisiCompatibility(aziendaData, avvisi);
      setAvvisiCompatibili(results.filter(a => a.compatibile).sort((a, b) => b.compatibilita_percentuale - a.compatibilita_percentuale));
    }
  }, [azienda, avvisi]);

  const loadAzienda = async () => {
    try {
      const { data, error } = await supabase
        .from('aziende')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAzienda(data);
      setAziendaBadges(data?.badge_formativi || []);
    } catch (error: any) {
      console.error('Errore caricamento azienda:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati dell'azienda",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFondiAzienda = async () => {
    try {
      const { data, error } = await supabase
        .from('aziende_fondi')
        .select(`
          *,
          fondo:fondi_interprofessionali(nome, codice)
        `)
        .eq('azienda_id', id);

      if (error) throw error;
      setFondiAzienda(data || []);
    } catch (error) {
      console.error('Errore caricamento fondi:', error);
    }
  };

  const getRegioneFromCodice = (codice: string | undefined) => {
    if (!codice) return null;
    return codice.split(" - ")[0] || codice;
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'bozza': return 'bg-muted text-muted-foreground';
      case 'in_lavorazione': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'inviata': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'approvata': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'rifiutata': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!azienda) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Azienda non trovata</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/aziende')}>
              Torna alle aziende
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/aziende')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{azienda.ragione_sociale}</h1>
                  <p className="text-muted-foreground">P.IVA: {azienda.partita_iva}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {azienda.profile_id && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Account Connesso
                </Badge>
              )}
              {fondiAzienda.length > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {fondiAzienda.length} Fond{fondiAzienda.length > 1 ? 'i' : 'o'}
                </Badge>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bandi Compatibili</p>
                    <p className="text-2xl font-bold">{bandiCompatibili.length}</p>
                  </div>
                  <Target className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avvisi Fondi</p>
                    <p className="text-2xl font-bold">{avvisiCompatibili.length}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-blue-500/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pratiche Attive</p>
                    <p className="text-2xl font-bold">{pratiche.filter(p => p.stato !== 'completata' && p.stato !== 'rifiutata').length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-amber-500/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pratiche Completate</p>
                    <p className="text-2xl font-bold">{pratiche.filter(p => p.stato === 'completata' || p.stato === 'approvata').length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informazioni</TabsTrigger>
              <TabsTrigger value="bandi">Bandi Compatibili ({bandiCompatibili.length})</TabsTrigger>
              <TabsTrigger value="fondi">Avvisi Fondi ({avvisiCompatibili.length})</TabsTrigger>
              <TabsTrigger value="pratiche">Storico Pratiche ({pratiche.length})</TabsTrigger>
            </TabsList>

            {/* Tab Informazioni */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Dati Principali */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Dati Aziendali
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Ragione Sociale</p>
                        <p className="font-medium">{azienda.ragione_sociale}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Partita IVA</p>
                        <p className="font-medium">{azienda.partita_iva}</p>
                      </div>
                      {azienda.codice_fiscale && (
                        <div>
                          <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                          <p className="font-medium">{azienda.codice_fiscale}</p>
                        </div>
                      )}
                      {azienda.forma_giuridica && (
                        <div>
                          <p className="text-sm text-muted-foreground">Forma Giuridica</p>
                          <p className="font-medium">{azienda.forma_giuridica}</p>
                        </div>
                      )}
                      {azienda.dimensione_azienda && (
                        <div>
                          <p className="text-sm text-muted-foreground">Dimensione</p>
                          <Badge variant="secondary">{azienda.dimensione_azienda}</Badge>
                        </div>
                      )}
                      {azienda.numero_dipendenti && (
                        <div>
                          <p className="text-sm text-muted-foreground">Dipendenti</p>
                          <p className="font-medium">{azienda.numero_dipendenti}</p>
                        </div>
                      )}
                      {azienda.capitale_sociale && (
                        <div>
                          <p className="text-sm text-muted-foreground">Capitale Sociale</p>
                          <p className="font-medium">€ {azienda.capitale_sociale.toLocaleString('it-IT')}</p>
                        </div>
                      )}
                      {azienda.costituzione_societa && (
                        <div>
                          <p className="text-sm text-muted-foreground">Anno Costituzione</p>
                          <p className="font-medium">{azienda.costituzione_societa}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contatti e Sede */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Contatti e Sede
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {azienda.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${azienda.email}`} className="text-primary hover:underline">{azienda.email}</a>
                      </div>
                    )}
                    {azienda.pec && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{azienda.pec} (PEC)</span>
                      </div>
                    )}
                    {azienda.telefono && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${azienda.telefono}`} className="text-primary hover:underline">{azienda.telefono}</a>
                      </div>
                    )}
                    {azienda.sito_web && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={azienda.sito_web} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          {azienda.sito_web}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    <Separator />
                    {azienda.regione && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sede Legale</p>
                        <p className="font-medium">{azienda.regione}</p>
                      </div>
                    )}
                    {azienda.sede_operativa && azienda.sede_operativa !== azienda.regione && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sede Operativa</p>
                        <p className="font-medium">{azienda.sede_operativa}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Aiuti di Stato RNA / De Minimis */}
                <Card className="col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Aiuti di Stato (RNA)
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Registro Nazionale Aiuti - Regime De Minimis
                          {rnaLastUpdate && (
                            <span className="ml-2 text-xs">
                              • Aggiornato: {new Date(rnaLastUpdate).toLocaleDateString('it-IT', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {rnaFromDb && <Badge variant="outline" className="ml-2 text-xs py-0">Salvato</Badge>}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => azienda?.partita_iva && refreshRnaFromApi(azienda.partita_iva)}
                        disabled={loadingRna}
                        title="Aggiorna dati dal Registro Nazionale Aiuti"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${loadingRna ? 'animate-spin' : ''}`} />
                        Aggiorna
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingRna ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Caricamento dati RNA...</span>
                      </div>
                    ) : rnaError ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>{rnaError}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => azienda?.partita_iva && refreshRnaFromApi(azienda.partita_iva)}
                          >
                            Riprova
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : !rnaData || !rnaData.found ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                        <p className="text-muted-foreground">Nessun aiuto di stato registrato</p>
                        <p className="text-sm text-muted-foreground">L'azienda non risulta nel Registro Nazionale Aiuti</p>
                        {!rnaLastUpdate && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => azienda?.partita_iva && refreshRnaFromApi(azienda.partita_iva)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Verifica ora
                          </Button>
                        )}
                      </div>
                    ) : (() => {
                      const { rilevanti, storici, totaleRilevante, totaleStorico } = getAiutiSeparati();
                      const percentualeUtilizzata = (totaleRilevante / MASSIMALE_DEMINIMIS) * 100;
                      const disponibile = MASSIMALE_DEMINIMIS - totaleRilevante;
                      
                      return (
                        <div className="space-y-4">
                          {/* Riepilogo De Minimis */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                              <p className="text-sm text-muted-foreground mb-1">Utilizzato (3 anni)</p>
                              <p className="text-xl font-bold text-primary">{formatCurrency(totaleRilevante)}</p>
                              <p className="text-xs text-muted-foreground">{rilevanti.length} aiut{rilevanti.length === 1 ? 'o' : 'i'}</p>
                            </div>
                            <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                              <p className="text-sm text-muted-foreground mb-1">Disponibile</p>
                              <p className="text-xl font-bold text-emerald-600">{formatCurrency(disponibile)}</p>
                              <p className="text-xs text-muted-foreground">su {formatCurrency(MASSIMALE_DEMINIMIS)} max</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg border">
                              <p className="text-sm text-muted-foreground mb-1">Storico</p>
                              <p className="text-xl font-bold text-muted-foreground">{formatCurrency(totaleStorico)}</p>
                              <p className="text-xs text-muted-foreground">{storici.length} aiut{storici.length === 1 ? 'o' : 'i'} oltre 3 anni</p>
                            </div>
                          </div>

                          {/* Barra progresso */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Utilizzo massimale</span>
                              <span className={percentualeUtilizzata > 80 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                                {percentualeUtilizzata.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(percentualeUtilizzata, 100)} 
                              className={`h-2 ${percentualeUtilizzata > 80 ? '[&>div]:bg-amber-500' : ''}`}
                            />
                          </div>

                          {/* Warning se vicino al limite */}
                          {percentualeUtilizzata > 80 && (
                            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-700 dark:text-amber-400">
                                Attenzione: {percentualeUtilizzata.toFixed(0)}% del massimale de minimis già utilizzato. 
                                Rimangono {formatCurrency(disponibile)} disponibili.
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Lista aiuti rilevanti */}
                          {rilevanti.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <Euro className="h-4 w-4" />
                                Aiuti De Minimis (ultimi 3 anni)
                              </p>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {rilevanti.map((aiuto, idx) => (
                                  <div key={idx} className="p-3 bg-muted/30 rounded-lg border text-sm">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{aiuto.titoloProgetto || aiuto.titoloMisura || 'Aiuto'}</p>
                                        <p className="text-muted-foreground text-xs truncate">
                                          {aiuto.autoritaConcedente}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-semibold text-primary">
                                          {aiuto.importoAgevolazione ? formatCurrency(aiuto.importoAgevolazione) : '-'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatRnaDate(aiuto.dataConcessione)}
                                        </p>
                                      </div>
                                    </div>
                                    {aiuto.strumento && (
                                      <Badge variant="outline" className="mt-2 text-xs">
                                        {aiuto.strumento}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Storico collassabile */}
                          {storici.length > 0 && (
                            <Collapsible open={showStorico} onOpenChange={setShowStorico}>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                                  <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Storico oltre 3 anni ({storici.length} aiut{storici.length === 1 ? 'o' : 'i'})
                                  </span>
                                  {showStorico ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="space-y-2 mt-2">
                                {storici.map((aiuto, idx) => (
                                  <div key={idx} className="p-3 bg-muted/20 rounded-lg border border-dashed text-sm opacity-70">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{aiuto.titoloProgetto || aiuto.titoloMisura || 'Aiuto'}</p>
                                        <p className="text-muted-foreground text-xs truncate">
                                          {aiuto.autoritaConcedente}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-medium text-muted-foreground">
                                          {aiuto.importoAgevolazione ? formatCurrency(aiuto.importoAgevolazione) : '-'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatRnaDate(aiuto.dataConcessione)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          {/* Info periodo */}
                          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                            Periodo di riferimento: ultimi 3 anni dalla data corrente (finestra mobile)
                          </p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Codici ATECO e Settore */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      Attività e Settore
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {azienda.settore && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Settore</p>
                        <Badge variant="outline">{azienda.settore}</Badge>
                      </div>
                    )}
                    {azienda.codici_ateco && azienda.codici_ateco.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Codici ATECO</p>
                        <div className="flex flex-wrap gap-2">
                          {azienda.codici_ateco.map((ateco, idx) => (
                            <Badge key={idx} variant="secondary" className="font-mono text-xs">
                              {ateco}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {azienda.descrizione_attivita && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Descrizione Attività</p>
                        <p className="text-sm">{azienda.descrizione_attivita}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Badge e Fondi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Badge Formativi e Fondi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Badge Formativi</p>
                      <BadgeManager 
                        entityType="azienda" 
                        entityId={azienda.id} 
                        canEdit={
                          profile?.role === 'admin' ||
                          profile?.role === 'gestore' ||
                          profile?.role === 'docente' ||
                          azienda.profile_id === profile?.id
                        }
                      />
                    </div>
                    
                    {/* AI Badge Suggestions */}
                    {(profile?.role === 'admin' || profile?.role === 'gestore' || 
                      profile?.role === 'docente' || 
                      azienda.profile_id === profile?.id) &&
                     azienda.codici_ateco && azienda.codici_ateco.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">Suggerimenti AI per Badge</p>
                        </div>
                        <BadgeSuggestionsAI
                          codiciAteco={azienda.codici_ateco}
                          descrizioneAttivita={azienda.descrizione_attivita}
                          dimensioneAzienda={azienda.dimensione_azienda}
                          badgeDisponibili={badgeFormativi.map(b => ({
                            nome: b.nome,
                            descrizione: b.descrizione,
                            categoria: b.categoria_id
                          }))}
                          selectedBadges={aziendaBadges}
                          onBadgesChange={async (newBadges) => {
                            setAziendaBadges(newBadges);
                            // Salva nel database
                            try {
                              const { error } = await supabase
                                .from('aziende')
                                .update({ badge_formativi: newBadges })
                                .eq('id', azienda.id);
                              if (error) throw error;
                              toast({
                                title: "Badge aggiornati",
                                description: "I badge formativi sono stati salvati"
                              });
                              // Ricarica azienda per aggiornare l'UI
                              loadAzienda();
                            } catch (error) {
                              console.error('Errore salvataggio badge:', error);
                              toast({
                                title: "Errore",
                                description: "Impossibile salvare i badge",
                                variant: "destructive"
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {fondiAzienda.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Fondi Interprofessionali</p>
                        <div className="space-y-2">
                          {fondiAzienda.map(fa => (
                            <div key={fa.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-primary" />
                                <span className="font-medium">{fa.fondo.nome}</span>
                                {fa.fondo.codice && (
                                  <Badge variant="outline" className="text-xs">{fa.fondo.codice}</Badge>
                                )}
                              </div>
                              {fa.verificato && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                  Verificato
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Storico Modifiche Badge */}
                <BadgeHistory entityType="azienda" entityId={azienda.id} />
              </div>
            </TabsContent>

            {/* Tab Bandi Compatibili */}
            <TabsContent value="bandi" className="space-y-4">
              {bandiCompatibili.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessun bando compatibile trovato</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completa i dati dell'azienda per migliorare i match
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {bandiCompatibili.map(bando => (
                    <Card key={bando.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{bando.titolo}</h3>
                              <Badge 
                                variant="outline" 
                                className={bando.compatibilita_percentuale >= 80 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : bando.compatibilita_percentuale >= 60 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-muted'
                                }
                              >
                                <Percent className="h-3 w-3 mr-1" />
                                {bando.compatibilita_percentuale}%
                              </Badge>
                            </div>
                            {bando.ente && (
                              <p className="text-sm text-muted-foreground mb-2">{bando.ente}</p>
                            )}
                            {bando.descrizione && (
                              <p className="text-sm line-clamp-2 mb-3">{bando.descrizione}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {bando.dettaglio_criteri.settore && <Badge variant="secondary" className="text-xs">✓ Settore</Badge>}
                              {bando.dettaglio_criteri.sede && <Badge variant="secondary" className="text-xs">✓ Sede</Badge>}
                              {bando.dettaglio_criteri.dimensione && <Badge variant="secondary" className="text-xs">✓ Dimensione</Badge>}
                              {bando.dettaglio_criteri.dipendenti && <Badge variant="secondary" className="text-xs">✓ Dipendenti</Badge>}
                              {bando.dettaglio_criteri.costituzione && <Badge variant="secondary" className="text-xs">✓ Costituzione</Badge>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {bando.data_chiusura && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <Clock className="h-4 w-4" />
                                Scade: {new Date(bando.data_chiusura).toLocaleDateString('it-IT')}
                              </div>
                            )}
                            {(bando.importo_minimo || bando.importo_massimo) && (
                              <p className="text-sm font-medium text-primary">
                                € {bando.importo_minimo?.toLocaleString('it-IT') || '0'} - € {bando.importo_massimo?.toLocaleString('it-IT') || '∞'}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Avvisi Fondi */}
            <TabsContent value="fondi" className="space-y-4">
              {avvisiCompatibili.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessun avviso fondi compatibile trovato</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {avvisiCompatibili.map(avviso => (
                    <Card key={avviso.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{avviso.titolo}</h3>
                              {avviso.fondo && (
                                <Badge variant="outline">{avviso.fondo.nome}</Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={avviso.compatibilita_percentuale >= 80 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                }
                              >
                                <Percent className="h-3 w-3 mr-1" />
                                {avviso.compatibilita_percentuale}%
                              </Badge>
                            </div>
                            {avviso.numero_avviso && (
                              <p className="text-sm text-muted-foreground mb-2">Avviso n. {avviso.numero_avviso}</p>
                            )}
                            {avviso.descrizione && (
                              <p className="text-sm line-clamp-2 mb-3">{avviso.descrizione}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {avviso.dettaglio_criteri.settore && <Badge variant="secondary" className="text-xs">✓ Settore</Badge>}
                              {avviso.dettaglio_criteri.regione && <Badge variant="secondary" className="text-xs">✓ Regione</Badge>}
                              {avviso.dettaglio_criteri.dimensione && <Badge variant="secondary" className="text-xs">✓ Dimensione</Badge>}
                              {avviso.dettaglio_criteri.badge && <Badge variant="secondary" className="text-xs">✓ Badge</Badge>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {avviso.data_chiusura && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <Clock className="h-4 w-4" />
                                Scade: {new Date(avviso.data_chiusura).toLocaleDateString('it-IT')}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Storico Pratiche */}
            <TabsContent value="pratiche" className="space-y-4">
              {pratiche.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessuna pratica per questa azienda</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pratiche.map(pratica => (
                    <Card key={pratica.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/pratiche/${pratica.id}/chat`)}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">
                                {pratica.bandi?.titolo || 'Pratica Generica'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Creata il {new Date(pratica.created_at).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatoColor(pratica.stato)}>
                              {pratica.stato.replace('_', ' ')}
                            </Badge>
                            {pratica.bandi?.data_chiusura && (
                              <span className="text-sm text-muted-foreground">
                                Scadenza: {new Date(pratica.bandi.data_chiusura).toLocaleDateString('it-IT')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AziendaDettaglio;
