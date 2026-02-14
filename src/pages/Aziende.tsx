import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { AtecoSelector } from "@/components/AtecoSelector";
import { REGIONI_E_PROVINCE } from "@/data/regioni-province";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  GraduationCap,
  LayoutGrid,
  List,
  UserCheck,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/Sidebar";
import { useFondimpresaCheck } from "@/hooks/useFondimpresaCheck";
import BadgeManager from "@/components/BadgeManager";
import { NuovaAziendaWizard } from "@/components/NuovaAziendaWizard";
import { AziendaCard } from "@/components/AziendaCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBandiCompatibility, BandoCompatibility, AziendaData as BandoAziendaData } from "@/hooks/useBandiCompatibility";
import { useFondiCompatibilityApp, AvvisoCompatibility, AziendaData as AvvisoAziendaData } from "@/hooks/useFondiCompatibilityApp";

interface Socio {
  nome?: string;
  cognome?: string;
  codice_fiscale?: string;
  quota_percentuale?: string;
  ruolo?: string;
}

interface Amministratore {
  nome?: string;
  cognome?: string;
  codice_fiscale?: string;
  carica?: string;
  data_nomina?: string;
}

interface DatiAggiuntivi {
  soci?: Socio[];
  amministratori?: Amministratore[];
  oggetto_sociale?: string;
  data_iscrizione?: string;
  fatturato_ultimo?: string;
  indirizzo_completo?: string;
  cap?: string;
  comune?: string;
  [key: string]: unknown;
}

interface Azienda {
  id: string;
  email: string;
  ragione_sociale: string;
  partita_iva: string;
  codice_ateco?: string;
  codici_ateco?: string[];
  settore?: string;
  dimensione_azienda?: string;
  regione?: string | null;
  sede_operativa?: string | null;
  numero_dipendenti?: string;
  costituzione_societa?: string;
  telefono?: string | null;
  
  investimenti_interesse?: string[];
  spese_interesse?: string[];
  inserita_da_gestore_id?: string;
  inserita_da_docente_id?: string;
  inserita_da_gestore_pratiche_id?: string;
  profile_id?: string | null;
  badge_formativi?: string[];
  created_at: string;
  // Nuovi campi
  codice_fiscale?: string;
  pec?: string;
  sito_web?: string;
  forma_giuridica?: string;
  descrizione_attivita?: string;
  numero_rea?: string;
  cciaa?: string;
  stato_attivita?: string;
  data_costituzione?: string;
  capitale_sociale?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dati_aggiuntivi?: any;
  // Campi per nome creatore (JOIN)
  gestore?: { nome: string; cognome: string } | null;
  docente?: { nome: string; cognome: string } | null;
  gestore_pratiche?: { nome: string; cognome: string } | null;
}

const settori = [
  "Agricoltura",
  "Alimentare",
  "Automotive",
  "Chimica",
  "Edilizia",
  "Energia",
  "ICT",
  "Manifatturiero",
  "Servizi",
  "Tessile",
  "Turismo",
  "Altro"
];

const TIPI_AZIENDA = [
  "Startup",
  "PMI",
  "Ditta individuale",
  "Midcap",
  "Grandi imprese",
  "Liberi professionisti",
  "Rete di imprese"
];

const regioni = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
  "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
  "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
];


const NUMERO_DIPENDENTI_OPTIONS = [
  "0", "1/3", "4/9", "10/19", "20/49", "50/99", "100/250", "+250"
];

const COSTITUZIONE_SOCIETA_OPTIONS = [
  "Da costituire", "Fino a 12 mesi", "Da 12 a 24 mesi", 
  "Da 24 a 60 mesi", "Oltre 60 mesi"
];

const INVESTIMENTI_FINANZIABILI = [
  "Beni strumentali ordinari",
  "Beni strumentali tecnologici-4.0",
  "Riduzione consumi e efficientamento energetico",
  "Sito web e e-commerce",
  "Pubblicità su editoria",
  "Marketing e social",
  "Spese di costituzione",
  "Acquisto software e licenze",
  "Locazione sede",
  "Opere edili ed impiantistiche",
  "Consulenza fiscale-legale-contrattualistica",
  "Consulenza commerciale",
  "Consulenza tecnica, progettazione, ricerca-sviluppo prodotto/processo",
  "Spese di personale",
  "Conseguimento certificazioni (qualità/prodotto/etc.)",
  "Partecipazione a fiere/workshop",
  "Apertura sede estera",
  "Liquidità",
  "Tecnologie di innovazione digitale 4.0",
  "Software gestionale e/o per servizi all'utenza",
  "Digital marketing",
  "Sistemi di pagamento mobile e/o internet"
];

const SPESE_AMMISSIBILI = [
  "Macchinari e impianti di produzione",
  "Mezzi di sollevamento",
  "Autocarri",
  "Motrici con allestimento",
  "Mobili e arredo",
  "Hardware",
  "Software gestionale",
  "Software di produzione",
  "Magazzini automatizzati",
  "Macchine operatrici",
  "Carrelli elevatori e mezzi di sollevamento",
  "Software generico",
  "Attrezzature da cucina",
  "Forni e attrezzature per il caldo in generale",
  "Frigoriferi celle ed attrezzature per il freddo in generale",
  "Climatizzazione e pompe di calore",
  "Opere edili e cartongesso",
  "Impianti generici (idrotermosanitario, elettrico, etc.)",
  "Illuminazione a led",
  "Pavimenti, rivestimenti e finiture",
  "Sistemi antintrusione, video sorveglianza e analoghi",
  "Installazione fotovoltaico",
  "Personale dedicato al progetto",
  "Formazione del personale dedicato",
  "Iscrizione evento e noleggio area espositiva",
  "Allestimento area espositiva",
  "Robotica e IOT",
  "Azioni promozionali, di comunicazione e di advertising sui mercati internazionali",
  "Attività di ricerca di operatori / partner esteri per l'organizzazione di incontri promozionali",
  "Avvio e sviluppo della gestione di business on line",
  "Servizi di analisi e orientamento mercati esteri",
  "Elaborazione di piani per l'internazionalizzazione, di piani di marketing e di penetrazione commerciale nei mercati esteri",
  "Ideazione, elaborazione e realizzazione di brand per specifici mercati di sbocco",
  "Attività di ricerca operatori / partner esteri",
  "Ricerche / scouting di mercato, ricerca clienti/distributori",
  "Partecipazione a missioni collettive all'estero organizzate da enti, consorzi, associazioni di categoria",
  "Assistenza tecnica, affiancamento, accompagnamento per l'ottenimento di certificazioni volontarie per i mercati esteri",
  "Manifattura additiva e stampa 3D",
  "Sistemi di visualizzazione, realtà virtuale (VR) e realtà aumentata (RA)",
  "Sistemi di e-commerce",
  "Software gestionale per l'automazione del magazzino",
  "Implementazione di servizi online di pagamento (mobile e internet) e/o e-commerce",
  "Campagne di promozione sui principali motori di ricerca, piattaforme social e marketplace",
  "Interventi volti a migliorare il posizionamento organico nei motori di ricerca (es. SEO, SEM)",
  "Consulenza, bilanci e certificazioni ambientali",
  "Consulenza, bilanci e certificazioni cybersicurezza",
  "Consulenza innovation manager"
];

const AziendePage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [aziende, setAziende] = useState<Azienda[]>([]);
  const [gestori, setGestori] = useState<{id: string; nome: string; cognome: string; ragione_sociale?: string}[]>([]);
  const [gestoreId, setGestoreId] = useState<string | null>(null);
  const [docenteId, setDocenteId] = useState<string | null>(null);
  const [gestorePraticheId, setGestorePraticheId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSettore, setFilterSettore] = useState("all");
  const [filterRegione, setFilterRegione] = useState("all");
  const [filterDimensione, setFilterDimensione] = useState("all");
  const [filterAteco, setFilterAteco] = useState("");
  const [filterBadge, setFilterBadge] = useState("all");
  const [filterBadgeCategoria, setFilterBadgeCategoria] = useState("all");
  const [filterFondo, setFilterFondo] = useState("all");
  const [filterConnesso, setFilterConnesso] = useState("all");
  const [filterIncroci, setFilterIncroci] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  
  // Badge e Fondi per filtri
  const [badgeTipi, setBadgeTipi] = useState<{id: string; nome: string; categoria_id: string | null}[]>([]);
  const [badgeCategorie, setBadgeCategorie] = useState<{id: string; nome: string}[]>([]);
  const [fondiList, setFondiList] = useState<{id: string; nome: string}[]>([]);
  const [aziendeWithFondi, setAziendeWithFondi] = useState<Record<string, string[]>>({});
  const [aziendeWithBadges, setAziendeWithBadges] = useState<Record<string, string[]>>({});

  // Create/Edit dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAzienda, setSelectedAzienda] = useState<Azienda | null>(null);
  const [creditsafeLoading, setCreditsafeLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    ragione_sociale: "",
    partita_iva: "",
    codice_ateco: "",
    codici_ateco: [] as string[],
    settore: "",
    dimensione_azienda: "",
    regione: "",
    regione_nome: "",
    provincia_nome: "",
    sede_operativa: "",
    sede_operativa_regione: "",
    sede_operativa_provincia: "",
    sede_operativa_uguale: true,
    numero_dipendenti: "",
    costituzione_societa: "",
    telefono: "",
    investimenti_interesse: [] as string[],
    spese_interesse: [] as string[],
    // Nuovi campi
    codice_fiscale: "",
    pec: "",
    sito_web: "",
    forma_giuridica: "",
    descrizione_attivita: "",
    numero_rea: "",
    cciaa: "",
    // Campi admin
    stato_attivita: "",
    data_costituzione: "",
    capitale_sociale: "",
    gestore_id: ""
  });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [aziendaToDelete, setAziendaToDelete] = useState<Azienda | null>(null);
  

  // Fondimpresa check
  const [fondimpresaData, setFondimpresaData] = useState<{
    found: boolean;
    data?: {
      denominazione: string | null;
      dataAdesione: string | null;
      annoAdesione: number | null;
      stato: string | null;
      regione: string | null;
      provincia: string | null;
    } | null;
  } | null>(null);
  const [fondimpresaLoading, setFondimpresaLoading] = useState(false);

  // RNA check (Fondimpresa, Fondoforte, Aiuti di Stato)
  const [rnaData, setRnaData] = useState<{
    fondimpresa: { found: boolean; denominazione?: string; annoAdesione?: number };
    fondoforte: { found: boolean; denominazione?: string; annoAdesione?: number };
    rna: { found: boolean; aiuti?: any[]; numeroAiuti?: number };
  } | null>(null);
  const [rnaLoading, setRnaLoading] = useState(false);

  // Helper per ottenere le province di una regione
  const getProvinceByRegione = (nomeRegione: string) => {
    const regione = REGIONI_E_PROVINCE.find(r => r.nome === nomeRegione);
    return regione?.province || [];
  };

  // Helper per costruire il codice completo provincia
  const buildProvinciaCodice = (regione: string, provincia: string, sigla: string) => {
    return `${regione} - ${provincia} (${sigla})`;
  };

  // Helper per estrarre regione da codice completo
  const extractRegioneFromCodice = (codice: string) => {
    if (!codice) return "";
    return codice.split(" - ")[0] || "";
  };

  // Helper per estrarre provincia e sigla da codice completo
  const extractProvinciaFromCodice = (codice: string) => {
    if (!codice) return { nome: "", sigla: "" };
    const match = codice.match(/- (.+) \(([A-Z]{2})\)$/);
    return {
      nome: match?.[1] || "",
      sigla: match?.[2] || ""
    };
  };

  const handleRegioneSedeLegaleChange = (nomeRegione: string) => {
    setFormData(prev => ({
      ...prev,
      regione_nome: nomeRegione,
      provincia_nome: "",
      regione: ""
    }));
  };

  const handleProvinciaSedeLegaleChange = (nomeProvincia: string) => {
    const province = getProvinceByRegione(formData.regione_nome);
    const provincia = province.find(p => p.nome === nomeProvincia);
    
    if (provincia) {
      const codiceProvincia = buildProvinciaCodice(
        formData.regione_nome,
        provincia.nome,
        provincia.sigla
      );
      
      setFormData(prev => ({
        ...prev,
        provincia_nome: nomeProvincia,
        regione: codiceProvincia,
        ...(prev.sede_operativa_uguale ? {
          sede_operativa: codiceProvincia,
          sede_operativa_regione: prev.regione_nome,
          sede_operativa_provincia: nomeProvincia
        } : {})
      }));
    }
  };

  const handleSedeOperativaUgualeChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sede_operativa_uguale: checked,
      ...(checked ? {
        sede_operativa: prev.regione,
        sede_operativa_regione: prev.regione_nome,
        sede_operativa_provincia: prev.provincia_nome
      } : {
        sede_operativa: "",
        sede_operativa_regione: "",
        sede_operativa_provincia: ""
      })
    }));
  };

  const handleRegioneSedeOperativaChange = (nomeRegione: string) => {
    setFormData(prev => ({
      ...prev,
      sede_operativa_regione: nomeRegione,
      sede_operativa_provincia: "",
      sede_operativa: ""
    }));
  };

  const handleProvinciaSedeOperativaChange = (nomeProvincia: string) => {
    const province = getProvinceByRegione(formData.sede_operativa_regione);
    const provincia = province.find(p => p.nome === nomeProvincia);
    
    if (provincia) {
      const codiceProvincia = buildProvinciaCodice(
        formData.sede_operativa_regione,
        provincia.nome,
        provincia.sigla
      );
      
      setFormData(prev => ({
        ...prev,
        sede_operativa_provincia: nomeProvincia,
        sede_operativa: codiceProvincia
      }));
    }
  };

  // Stats
  const [stats, setStats] = useState({
    totale: 0,
    perSettore: {} as Record<string, number>
  });

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carica badge, categorie e fondi per i filtri
      await Promise.all([loadBadgeTipi(), loadBadgeCategorie(), loadFondiList()]);

      if (profile?.role === 'gestore') {
        await loadGestoreData();
      } else if (profile?.role === 'admin') {
        await loadAllGestori();
        await loadAziende();
      } else if (profile?.role === 'docente') {
        await loadDocenteAziende();
      } else if (profile?.role === 'gestore_pratiche') {
        // Carica l'id del gestore_pratiche per l'inserimento aziende
        await loadGestorePraticheData();
        // Per i Gestori Pratiche la visibilità è gestita da RLS (aziende assegnate)
        await loadAziende();
      }
    } catch (error: any) {
      console.error('Errore caricamento dati:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBadgeTipi = async () => {
    const { data } = await supabase
      .from('badge_tipi')
      .select('id, nome, categoria_id')
      .eq('attivo', true)
      .order('ordine');
    setBadgeTipi(data || []);
  };

  const loadBadgeCategorie = async () => {
    const { data } = await supabase
      .from('badge_categorie')
      .select('id, nome')
      .eq('attivo', true)
      .order('ordine');
    setBadgeCategorie(data || []);
  };

  const loadFondiList = async () => {
    const { data } = await supabase
      .from('fondi_interprofessionali')
      .select('id, nome')
      .eq('attivo', true)
      .order('nome');
    setFondiList(data || []);
  };

  const loadAziendeWithFondi = async (aziendeIds: string[]) => {
    if (aziendeIds.length === 0) return;
    const { data } = await supabase
      .from('aziende_fondi')
      .select('azienda_id, fondo_id')
      .in('azienda_id', aziendeIds);
    
    const map: Record<string, string[]> = {};
    data?.forEach(af => {
      if (!map[af.azienda_id]) map[af.azienda_id] = [];
      map[af.azienda_id].push(af.fondo_id);
    });
    setAziendeWithFondi(map);
  };

  const loadAziendeWithBadges = async (aziendeIds: string[]) => {
    if (aziendeIds.length === 0) return;
    const { data } = await supabase
      .from('badge_assegnazioni')
      .select('azienda_id, badge_tipo_id')
      .in('azienda_id', aziendeIds);
    
    const map: Record<string, string[]> = {};
    data?.forEach(ba => {
      if (ba.azienda_id) {
        if (!map[ba.azienda_id]) map[ba.azienda_id] = [];
        map[ba.azienda_id].push(ba.badge_tipo_id);
      }
    });
    setAziendeWithBadges(map);
  };

  const loadGestorePraticheData = async () => {
    const { data: gpData, error: gpError } = await supabase
      .from('gestori_pratiche')
      .select('id')
      .eq('profile_id', profile?.id)
      .maybeSingle();

    if (gpError) {
      console.error('Errore caricamento gestore pratiche:', gpError);
      return;
    }

    if (gpData) {
      setGestorePraticheId(gpData.id);
    }
  };

  const loadDocenteAziende = async () => {
    // Trova il record docente
    const { data: docenteData, error: docenteError } = await supabase
      .from('docenti')
      .select('id')
      .eq('profile_id', profile?.id)
      .maybeSingle();

    if (docenteError) throw docenteError;

    if (!docenteData) {
      setAziende([]);
      calculateStats([]);
      return;
    }

    // Salva il docenteId per l'uso nel wizard
    setDocenteId(docenteData.id);

    // Carica solo aziende inserite da questo docente con JOIN per nome creatore
    const { data, error } = await supabase
      .from('aziende')
      .select(`
        *,
        gestore:gestori!inserita_da_gestore_id(nome, cognome),
        docente:docenti!inserita_da_docente_id(nome, cognome),
        gestore_pratiche:gestori_pratiche!inserita_da_gestore_pratiche_id(nome, cognome)
      `)
      .eq('inserita_da_docente_id', docenteData.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    setAziende(data || []);
    calculateStats(data || []);
  };

  const loadGestoreData = async () => {
    // Carica il gestore
    const { data: gestoreData, error: gestoreError } = await supabase
      .from('gestori')
      .select('*')
      .eq('profile_id', profile?.id)
      .single();

    if (gestoreError) throw gestoreError;
    setGestoreId(gestoreData.id);

    // Carica aziende
    await loadAziende();
  };

  const loadAllGestori = async () => {
    const { data: gestoriData, error: gestoriError } = await supabase
      .from('gestori')
      .select('id, nome, cognome, ragione_sociale')
      .order('cognome');

    if (gestoriError) throw gestoriError;
    setGestori(gestoriData || []);
  };

  const loadAziende = async () => {
    try {
      const { data, error } = await supabase
        .from('aziende')
        .select(`
          *,
          gestore:gestori!inserita_da_gestore_id(nome, cognome),
          docente:docenti!inserita_da_docente_id(nome, cognome),
          gestore_pratiche:gestori_pratiche!inserita_da_gestore_pratiche_id(nome, cognome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAziende(data || []);
      calculateStats(data || []);
      
      // Carica i fondi e badge associati alle aziende
      if (data && data.length > 0) {
        const ids = data.map(a => a.id);
        await Promise.all([
          loadAziendeWithFondi(ids),
          loadAziendeWithBadges(ids)
        ]);
      }
    } catch (error: any) {
      console.error('Errore caricamento aziende:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le aziende",
        variant: "destructive",
      });
    }
  };

  // Helper per ottenere il nome del creatore dell'azienda
  const getCreatorInfo = (azienda: Azienda): { nome: string; tipo: string } | null => {
    if (azienda.gestore?.nome && azienda.gestore?.cognome) {
      return { 
        nome: `${azienda.gestore.nome} ${azienda.gestore.cognome}`, 
        tipo: 'Professionista' 
      };
    }
    if (azienda.docente?.nome && azienda.docente?.cognome) {
      return { 
        nome: `${azienda.docente.nome} ${azienda.docente.cognome}`, 
        tipo: 'Docente' 
      };
    }
    if (azienda.gestore_pratiche?.nome && azienda.gestore_pratiche?.cognome) {
      return { 
        nome: `${azienda.gestore_pratiche.nome} ${azienda.gestore_pratiche.cognome}`, 
        tipo: 'Gestore Pratiche' 
      };
    }
    return null;
  };

  const calculateStats = (aziendeData: Azienda[]) => {
    const totale = aziendeData.length;
    
    const perSettore: Record<string, number> = {};

    aziendeData.forEach(azienda => {
      if (azienda.settore) {
        perSettore[azienda.settore] = (perSettore[azienda.settore] || 0) + 1;
      }
    });

    setStats({ totale, perSettore });
  };

  const validatePartitaIVA = (piva: string): boolean => {
    // Rimuovi spazi e caratteri non numerici
    const cleaned = piva.replace(/\s/g, '');
    
    // Verifica che sia esattamente 11 cifre numeriche
    return /^\d{11}$/.test(cleaned);
  };

  // Verifica se l'azienda è iscritta a Fondimpresa
  const checkFondimpresa = async (partitaIva: string) => {
    setFondimpresaLoading(true);
    setFondimpresaData(null);
    try {
      const { data, error } = await supabase.functions.invoke('fondimpresa-check', {
        body: { partitaIva }
      });

      if (error) {
        console.error('Fondimpresa check error:', error);
        return;
      }

      if (data) {
        setFondimpresaData(data);
        if (data.found) {
          console.log('[Fondimpresa] Azienda trovata:', data.data);
        }
      }
    } catch (error) {
      console.error('Errore verifica Fondimpresa:', error);
    } finally {
      setFondimpresaLoading(false);
    }
  };

  const checkRna = async (partitaIva: string) => {
    setRnaLoading(true);
    setRnaData(null);
    try {
      const { data, error } = await supabase.functions.invoke('rna-check', {
        body: { partitaIva }
      });

      if (error) {
        console.error('RNA check error:', error);
        return;
      }

      if (data) {
        setRnaData(data);
        console.log('[RNA] Risultato:', data);
      }
    } catch (error) {
      console.error('Errore verifica RNA:', error);
    } finally {
      setRnaLoading(false);
    }
  };

  const searchFromOpenAPI = async () => {
    if (!formData.partita_iva) {
      toast({
        title: "Attenzione",
        description: "Inserisci prima una Partita IVA",
        variant: "destructive",
      });
      return;
    }

    // Valida formato P.IVA italiana
    if (!validatePartitaIVA(formData.partita_iva)) {
      toast({
        title: "Formato non valido",
        description: "La Partita IVA italiana deve essere composta da 11 cifre numeriche",
        variant: "destructive",
      });
      return;
    }

    setCreditsafeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('openapi-search', {
        body: { partita_iva: formData.partita_iva }
      });

      if (error) {
        console.error('OpenAPI error:', error);
        toast({
          title: "Errore ricerca",
          description: "Servizio non disponibile. Compila manualmente.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success === false) {
        toast({
          title: "Ricerca non riuscita",
          description: data?.message || "Compila manualmente i campi",
          variant: "destructive",
        });
        return;
      }

      if (data?.success && data.data) {
        const d = data.data;
        
        // Costruisci il codice regione completo se abbiamo provincia
        let regioneCodice = '';
        if (d.regione && d.provincia_nome && d.provincia_sigla) {
          regioneCodice = `${d.regione} - ${d.provincia_nome} (${d.provincia_sigla})`;
        }
        
        // Pre-compila il form con i dati
        setFormData(prev => {
          // Se c'è un codice ATECO, aggiungilo all'array se non già presente
          const nuoviCodiciAteco = d.codice_ateco && !prev.codici_ateco.includes(d.codice_ateco)
            ? [...prev.codici_ateco, d.codice_ateco]
            : prev.codici_ateco;
            
          return {
            ...prev,
            ragione_sociale: d.ragione_sociale || prev.ragione_sociale,
            codice_ateco: d.codice_ateco || prev.codice_ateco,
            codici_ateco: nuoviCodiciAteco,
            settore: d.settore || prev.settore,
            
            // Dati geografici completi
            regione: regioneCodice || prev.regione,
            regione_nome: d.regione || prev.regione_nome,
            provincia_nome: d.provincia_nome || prev.provincia_nome,
            sede_operativa: regioneCodice || prev.sede_operativa,
            
            // Se sede operativa uguale, popola anche quei campi
            sede_operativa_regione: d.regione || prev.sede_operativa_regione,
            sede_operativa_provincia: d.provincia_nome || prev.sede_operativa_provincia,
            
            // Altri dati
            numero_dipendenti: d.numero_dipendenti || prev.numero_dipendenti,
            costituzione_societa: d.costituzione_societa || prev.costituzione_societa,
            dimensione_azienda: d.dimensione_azienda || prev.dimensione_azienda,
            telefono: d.telefono || prev.telefono,
          };
        });

        // Info aggiuntive
        const infoExtra: string[] = [];
        if (d.citta) infoExtra.push(`${d.citta}`);
        if (d.indirizzo) infoExtra.push(`${d.indirizzo}`);

        toast({
          title: "Dati azienda caricati",
          description: infoExtra.length > 0 
            ? `${d.ragione_sociale || 'Azienda trovata'} - ${infoExtra.join(', ')}`
            : d.ragione_sociale || "Dati azienda recuperati",
        });
        
        // Verifica anche Fondimpresa
        await checkFondimpresa(formData.partita_iva);
      } else if (data?.error) {
        console.log('OpenAPI response:', data);
        toast({
          title: data.error === "Azienda non trovata" ? "Azienda non trovata" : "Attenzione",
          description: data.message || "Azienda non trovata. Verifica la Partita IVA e compila manualmente i campi.",
          variant: "default",
        });
      } else {
        toast({
          title: "Attenzione",
          description: "Risposta inattesa dal servizio",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Errore ricerca impresa:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la ricerca. Riprova o compila manualmente.",
        variant: "destructive",
      });
    } finally {
      setCreditsafeLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      ragione_sociale: "",
      partita_iva: "",
      codice_ateco: "",
      codici_ateco: [] as string[],
      settore: "",
      dimensione_azienda: "",
      regione: "",
      regione_nome: "",
      provincia_nome: "",
      sede_operativa: "",
      sede_operativa_regione: "",
      sede_operativa_provincia: "",
      sede_operativa_uguale: true,
      numero_dipendenti: "",
      costituzione_societa: "",
      telefono: "",
      
      investimenti_interesse: [] as string[],
      spese_interesse: [] as string[],
      // Nuovi campi
      codice_fiscale: "",
      pec: "",
      sito_web: "",
      forma_giuridica: "",
      descrizione_attivita: "",
      numero_rea: "",
      cciaa: "",
      // Campi admin
      stato_attivita: "",
      data_costituzione: "",
      capitale_sociale: "",
      gestore_id: ""
    });
    setFondimpresaData(null);
    setRnaData(null);
  };

  const handleCreate = async () => {
    try {
      // Validazione base
      if (!formData.email.trim()) {
        toast({
          title: "Errore",
          description: "Email obbligatoria",
          variant: "destructive",
        });
        return;
      }

      if (!formData.ragione_sociale.trim()) {
        toast({
          title: "Errore",
          description: "Ragione sociale obbligatoria",
          variant: "destructive",
        });
        return;
      }

      if (!formData.partita_iva.trim()) {
        toast({
          title: "Errore",
          description: "Partita IVA obbligatoria",
          variant: "destructive",
        });
        return;
      }

      const insertData: any = {
        email: formData.email,
        ragione_sociale: formData.ragione_sociale,
        partita_iva: formData.partita_iva,
      };

      // Gestione dell'assegnazione in base al ruolo
      if (profile?.role === 'gestore') {
        if (!gestoreId) {
          toast({
            title: "Errore",
            description: "Dati gestore non caricati. Ricarica la pagina.",
            variant: "destructive",
          });
          return;
        }
        insertData.inserita_da_gestore_id = gestoreId;
      }
      // Admin non richiede assegnazione specifica

      if (formData.codice_ateco) insertData.codice_ateco = formData.codice_ateco;
      if (formData.settore) insertData.settore = formData.settore;
      if (formData.dimensione_azienda) insertData.dimensione_azienda = formData.dimensione_azienda;
      if (formData.regione) insertData.regione = formData.regione;
      
      
      // Nuovi campi per matching con bandi
      if (formData.codici_ateco.length > 0) insertData.codici_ateco = formData.codici_ateco;
      if (formData.sede_operativa) insertData.sede_operativa = formData.sede_operativa;
      if (formData.numero_dipendenti) insertData.numero_dipendenti = formData.numero_dipendenti;
      if (formData.costituzione_societa) insertData.costituzione_societa = formData.costituzione_societa;
      if (formData.telefono) insertData.telefono = formData.telefono;
      if (formData.investimenti_interesse.length > 0) insertData.investimenti_interesse = formData.investimenti_interesse;
      if (formData.spese_interesse.length > 0) insertData.spese_interesse = formData.spese_interesse;

      console.log('Dati inserimento azienda:', insertData);
      console.log('Ruolo utente:', profile?.role);
      console.log('GestoreId:', gestoreId);

      const { data: insertedData, error } = await supabase
        .from('aziende')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Azienda creata con successo",
      });

      setCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Errore creazione azienda:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'azienda",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (azienda: Azienda) => {
    const regioneNome = extractRegioneFromCodice(azienda.regione || "");
    const provinciaData = extractProvinciaFromCodice(azienda.regione || "");
    
    const sedeOperativaNome = extractRegioneFromCodice(azienda.sede_operativa || "");
    const sedeOperativaProvinciaData = extractProvinciaFromCodice(azienda.sede_operativa || "");
    
    const sedeOperativaUguale = azienda.regione === azienda.sede_operativa || !azienda.sede_operativa;
    
    setSelectedAzienda(azienda);
    setFormData({
      email: azienda.email,
      ragione_sociale: azienda.ragione_sociale,
      partita_iva: azienda.partita_iva,
      codice_ateco: azienda.codice_ateco || "",
      codici_ateco: azienda.codici_ateco || [],
      settore: azienda.settore || "",
      dimensione_azienda: azienda.dimensione_azienda || "",
      regione: azienda.regione || "",
      regione_nome: regioneNome,
      provincia_nome: provinciaData.nome,
      sede_operativa: azienda.sede_operativa || "",
      sede_operativa_regione: sedeOperativaNome,
      sede_operativa_provincia: sedeOperativaProvinciaData.nome,
      sede_operativa_uguale: sedeOperativaUguale,
      numero_dipendenti: azienda.numero_dipendenti || "",
      costituzione_societa: azienda.costituzione_societa || "",
      telefono: azienda.telefono || "",
      
      investimenti_interesse: azienda.investimenti_interesse || [],
      spese_interesse: azienda.spese_interesse || [],
      // Nuovi campi
      codice_fiscale: azienda.codice_fiscale || "",
      pec: azienda.pec || "",
      sito_web: azienda.sito_web || "",
      forma_giuridica: azienda.forma_giuridica || "",
      descrizione_attivita: azienda.descrizione_attivita || "",
      numero_rea: azienda.numero_rea || "",
      cciaa: azienda.cciaa || "",
      // Campi admin
      stato_attivita: azienda.stato_attivita || "",
      data_costituzione: azienda.data_costituzione || "",
      capitale_sociale: azienda.capitale_sociale?.toString() || "",
      gestore_id: azienda.inserita_da_gestore_id || ""
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedAzienda) return;

      const updateData: any = {
        email: formData.email,
        ragione_sociale: formData.ragione_sociale,
        partita_iva: formData.partita_iva,
        codice_ateco: formData.codice_ateco || null,
        settore: formData.settore || null,
        dimensione_azienda: formData.dimensione_azienda || null,
        regione: formData.regione || null,
        // Campi esistenti
        codici_ateco: formData.codici_ateco.length > 0 ? formData.codici_ateco : null,
        sede_operativa: formData.sede_operativa || null,
        numero_dipendenti: formData.numero_dipendenti || null,
        costituzione_societa: formData.costituzione_societa || null,
        telefono: formData.telefono || null,
        investimenti_interesse: formData.investimenti_interesse.length > 0 ? formData.investimenti_interesse : null,
        spese_interesse: formData.spese_interesse.length > 0 ? formData.spese_interesse : null,
        // Nuovi campi
        codice_fiscale: formData.codice_fiscale || null,
        pec: formData.pec || null,
        sito_web: formData.sito_web || null,
        forma_giuridica: formData.forma_giuridica || null,
        descrizione_attivita: formData.descrizione_attivita || null,
        numero_rea: formData.numero_rea || null,
        cciaa: formData.cciaa || null,
        // Campi admin
        stato_attivita: formData.stato_attivita || null,
        data_costituzione: formData.data_costituzione || null,
        capitale_sociale: formData.capitale_sociale ? parseFloat(formData.capitale_sociale) : null,
        inserita_da_gestore_id: formData.gestore_id || null,
      };

      const { error } = await supabase
        .from('aziende')
        .update(updateData)
        .eq('id', selectedAzienda.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Azienda aggiornata con successo",
      });

      setEditOpen(false);
      setSelectedAzienda(null);
      resetForm();
      loadAziende();
    } catch (error: any) {
      console.error('Errore aggiornamento azienda:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare l'azienda",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!aziendaToDelete) return;

      const { error } = await supabase
        .from('aziende')
        .delete()
        .eq('id', aziendaToDelete.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Azienda eliminata con successo",
      });

      setDeleteOpen(false);
      setAziendaToDelete(null);
      loadAziende();
    } catch (error: any) {
      console.error('Errore eliminazione azienda:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'azienda",
        variant: "destructive",
      });
    }
  };


  // Carica bilanci da Creditsafe
  // Incroci calculation hooks
  const { bandi, calculateCompatibility: calculateBandiCompatibility } = useBandiCompatibility();
  const { avvisi, calculateCompatibility: calculateAvvisiCompatibility } = useFondiCompatibilityApp();

  // Calculate incroci for ALL aziende (before filtering, so we can filter by incroci)
  const aziendeIncroci = useMemo(() => {
    const incrociMap: Record<string, {
      bandiCompatibili: number;
      avvisiCompatibili: number;
      topMatches: Array<{ titolo: string; percentuale: number; tipo: 'bando' | 'avviso' }>;
      mediaCompatibilita: number;
    }> = {};

    aziende.forEach(azienda => {
      const aziendaDataForBandi: BandoAziendaData = {
        id: azienda.id,
        ragione_sociale: azienda.ragione_sociale,
        codici_ateco: azienda.codici_ateco || null,
        regione: azienda.regione || null,
        dimensione_azienda: azienda.dimensione_azienda || null,
        numero_dipendenti: azienda.numero_dipendenti || null,
        costituzione_societa: azienda.costituzione_societa || null,
        investimenti_interesse: azienda.investimenti_interesse || null,
        spese_interesse: azienda.spese_interesse || null,
        sede_operativa: null,
      };

      const aziendaDataForAvvisi: AvvisoAziendaData = {
        id: azienda.id,
        ragione_sociale: azienda.ragione_sociale,
        codici_ateco: azienda.codici_ateco || null,
        regione: azienda.regione || null,
        dimensione_azienda: azienda.dimensione_azienda || null,
        numero_dipendenti: azienda.numero_dipendenti || null,
        badge_formativi: azienda.badge_formativi || null,
        sede_operativa: null,
      };

      // Calculate bandi compatibility
      const bandiCompatibility = calculateBandiCompatibility(aziendaDataForBandi, bandi);
      const bandiCompatibili = bandiCompatibility.filter(b => b.compatibile && b.compatibilita_percentuale >= 60);

      // Calculate avvisi compatibility
      const avvisiCompatibility = calculateAvvisiCompatibility(aziendaDataForAvvisi, avvisi);
      const avvisiCompatibili = avvisiCompatibility.filter(a => a.compatibile && a.compatibilita_percentuale >= 50);

      // Get top matches (sorted by percentage)
      const allMatches = [
        ...bandiCompatibili.map(b => ({ titolo: b.titolo, percentuale: b.compatibilita_percentuale, tipo: 'bando' as const })),
        ...avvisiCompatibili.map(a => ({ titolo: a.titolo, percentuale: a.compatibilita_percentuale, tipo: 'avviso' as const }))
      ].sort((a, b) => b.percentuale - a.percentuale);

      // Calculate average compatibility
      const allPercentages = [...bandiCompatibili, ...avvisiCompatibili].map(x => x.compatibilita_percentuale);
      const mediaCompatibilita = allPercentages.length > 0 
        ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
        : 0;

      incrociMap[azienda.id] = {
        bandiCompatibili: bandiCompatibili.length,
        avvisiCompatibili: avvisiCompatibili.length,
        topMatches: allMatches.slice(0, 3),
        mediaCompatibilita,
      };
    });

    return incrociMap;
  }, [aziende, bandi, avvisi, calculateBandiCompatibility, calculateAvvisiCompatibility]);

  // Filtered aziende
  const filteredAziende = aziende.filter(azienda => {
    const matchSearch = 
      azienda.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      azienda.partita_iva.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchSettore = filterSettore === "all" || azienda.settore === filterSettore;
    const matchRegione = filterRegione === "all" || 
      (azienda.regione && azienda.regione.startsWith(filterRegione));
    const matchDimensione = filterDimensione === "all" || azienda.dimensione_azienda === filterDimensione;
    
    // Filtro ATECO
    const matchAteco = !filterAteco || 
      (azienda.codici_ateco?.some(ateco => 
        ateco.toLowerCase().includes(filterAteco.toLowerCase())
      ) || azienda.codice_ateco?.toLowerCase().includes(filterAteco.toLowerCase()));
    
    // Filtro Badge (usa assegnazioni reali dalla tabella badge_assegnazioni)
    const matchBadge = filterBadge === "all" || 
      aziendeWithBadges[azienda.id]?.includes(filterBadge);
    
    // Filtro Categoria Badge
    const matchBadgeCategoria = filterBadgeCategoria === "all" || 
      aziendeWithBadges[azienda.id]?.some(badgeId => {
        const badge = badgeTipi.find(b => b.id === badgeId);
        return badge?.categoria_id === filterBadgeCategoria;
      });
    
    // Filtro Fondo
    const matchFondo = filterFondo === "all" || 
      aziendeWithFondi[azienda.id]?.includes(filterFondo);
    
    // Filtro Account Connesso (solo admin)
    const matchConnesso = filterConnesso === "all" || 
      (filterConnesso === "connected" ? !!azienda.profile_id : !azienda.profile_id);

    // Filtro Incroci (solo aziende con almeno 1 bando o avviso compatibile)
    const incroci = aziendeIncroci[azienda.id];
    const matchIncroci = filterIncroci === "all" || 
      (filterIncroci === "with_incroci" && incroci && (incroci.bandiCompatibili > 0 || incroci.avvisiCompatibili > 0)) ||
      (filterIncroci === "without_incroci" && (!incroci || (incroci.bandiCompatibili === 0 && incroci.avvisiCompatibili === 0)));

    return matchSearch && matchSettore && matchRegione && matchDimensione && matchAteco && matchBadge && matchBadgeCategoria && matchFondo && matchConnesso && matchIncroci;
  });

  // Check Fondimpresa status for visible companies
  const partiteIvaToCheck = useMemo(() => 
    filteredAziende.map(a => a.partita_iva), 
    [filteredAziende.map(a => a.id).join(',')]
  );
  const { results: fondimpresaResults, loading: fondimpresaBatchLoading } = useFondimpresaCheck(partiteIvaToCheck);

  const topSettori = Object.entries(stats.perSettore)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-8 bg-muted/10 min-h-screen">
        <PageHeader
          title="Gestione Aziende"
          description="Visualizza e gestisci il portafoglio aziende"
          icon={<Building2 className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Aziende', icon: 'aziende' }
          ]}
          actions={
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuova Azienda
            </Button>
          }
        />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Totale Aziende"
          value={stats.totale}
          subtitle={`${filteredAziende.length} visibili`}
          icon={Building2}
          colorVariant="primary"
          animationDelay={0}
        />
        <StatCard
          title="Con Account"
          value={aziende.filter(a => a.profile_id).length}
          subtitle="Collegate all'app"
          icon={UserCheck}
          colorVariant="green"
          animationDelay={1}
        />
        <StatCard
          title="Con Incroci"
          value={Object.values(aziendeIncroci).filter(i => i.bandiCompatibili > 0 || i.avvisiCompatibili > 0).length}
          subtitle="Match bandi/avvisi"
          icon={CheckCircle2}
          colorVariant="blue"
          animationDelay={2}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cerca per ragione sociale o P.IVA..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={filterSettore} onValueChange={setFilterSettore}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Settore" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i settori</SelectItem>
            {settori.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterRegione} onValueChange={setFilterRegione}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Regione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le regioni</SelectItem>
            {regioni.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterDimensione} onValueChange={setFilterDimensione}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            {TIPI_AZIENDA.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant={showAdvancedFilters ? "secondary" : "outline"} 
          size="icon"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="shrink-0"
        >
          <Filter className="h-4 w-4" />
        </Button>
        
        {/* Toggle Vista */}
        <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && setViewMode(val as "list" | "card")}>
          <ToggleGroupItem value="list" aria-label="Vista lista">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label="Vista card">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Filtri Avanzati */}
      {showAdvancedFilters && (
        <div className="bg-muted/30 border rounded-xl p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Filtri Avanzati</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setFilterAteco("");
                setFilterBadge("all");
                setFilterBadgeCategoria("all");
                setFilterFondo("all");
                setFilterConnesso("all");
                setFilterIncroci("all");
              }}
            >
              Resetta filtri
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* Filtro Incroci */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Incroci</Label>
              <Select value={filterIncroci} onValueChange={setFilterIncroci}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="with_incroci">Con incroci</SelectItem>
                  <SelectItem value="without_incroci">Senza incroci</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro ATECO */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Codice ATECO</Label>
              <Input
                placeholder="Es. 62.01"
                value={filterAteco}
                onChange={(e) => setFilterAteco(e.target.value)}
                className="h-9"
              />
            </div>
            
            {/* Filtro Categoria Badge */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Categoria Badge</Label>
              <Select value={filterBadgeCategoria} onValueChange={setFilterBadgeCategoria}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tutte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {badgeCategorie.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro Badge */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Badge Formativo</Label>
              <Select value={filterBadge} onValueChange={setFilterBadge}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {badgeTipi.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro Fondo */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fondo Interprofessionale</Label>
              <Select value={filterFondo} onValueChange={setFilterFondo}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {fondiList.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro Account Connesso (solo admin) */}
            {profile?.role === 'admin' && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Account</Label>
                <Select value={filterConnesso} onValueChange={setFilterConnesso}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="connected">Con account</SelectItem>
                    <SelectItem value="disconnected">Senza account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Contatore risultati */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredAziende.length} aziend{filteredAziende.length === 1 ? 'a' : 'e'} trovate
        </p>
      </div>

      {/* Vista Card */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAziende.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nessuna azienda trovata</p>
            </div>
          ) : (
            filteredAziende.map((azienda) => (
              <AziendaCard
                key={azienda.id}
                azienda={azienda}
                fondimpresaResult={fondimpresaResults[azienda.partita_iva]}
                incroci={aziendeIncroci[azienda.id]}
                onEdit={handleEdit}
                onDelete={(az) => {
                  setAziendaToDelete(az);
                  setDeleteOpen(true);
                }}
              />
            ))
          )}
        </div>
      ) : (
      /* Vista Tabella */
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Ragione Sociale
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Regione
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Incroci
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Professionista
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                  Badge
                </th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAziende.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessuna azienda trovata</p>
                  </td>
                </tr>
              ) : (
                filteredAziende.map((azienda) => (
                  <tr key={azienda.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{azienda.ragione_sociale}</p>
                            {azienda.profile_id && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 gap-1">
                                    <UserCheck className="h-3 w-3" />
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Account connesso al sistema</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {fondimpresaResults[azienda.partita_iva]?.found && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    FI
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Aderente Fondimpresa</p>
                                  {fondimpresaResults[azienda.partita_iva]?.annoAdesione && (
                                    <p className="text-xs text-muted-foreground">
                                      Dal {fondimpresaResults[azienda.partita_iva].annoAdesione}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          {azienda.dimensione_azienda && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {azienda.dimensione_azienda}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {azienda.regione || "-"}
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        const incroci = aziendeIncroci[azienda.id];
                        if (!incroci) return <span className="text-muted-foreground text-sm">-</span>;
                        
                        const { bandiCompatibili, avvisiCompatibili, mediaCompatibilita } = incroci;
                        const colorClass = mediaCompatibilita >= 70 ? 'bg-emerald-500' 
                                        : mediaCompatibilita >= 50 ? 'bg-yellow-500' 
                                        : 'bg-muted-foreground/30';
                        
                        return (
                          <div className="space-y-1.5">
                            <div className="text-sm font-medium">
                              {bandiCompatibili} bandi · {avvisiCompatibili} avvisi
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${colorClass} transition-all`} 
                                  style={{ width: `${mediaCompatibilita}%` }} 
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{Math.round(mediaCompatibilita)}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        const creator = getCreatorInfo(azienda);
                        if (!creator) return <span className="text-muted-foreground text-sm">-</span>;
                        
                        const badgeColor = creator.tipo === 'Professionista' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : creator.tipo === 'Docente'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
                        
                        return (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{creator.nome}</p>
                            <Badge variant="outline" className={`text-xs ${badgeColor}`}>
                              {creator.tipo}
                            </Badge>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6">
                      <BadgeManager
                        entityType="azienda"
                        entityId={azienda.id}
                        compact
                      />
                    </td>
                    <td className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/aziende/${azienda.id}`)}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Dettaglio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(azienda)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setAziendaToDelete(azienda);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

{/* New Wizard Dialog */}
      <NuovaAziendaWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadData}
        gestoreId={gestoreId}
        docenteId={docenteId}
        gestorePraticheId={gestorePraticheId}
        userRole={profile?.role}
      />


      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Azienda</DialogTitle>
            <DialogDescription>
              Modifica i dati dell'azienda. I campi contrassegnati sono obbligatori.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Sezione: Dati Principali */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-2">📋 Dati Principali</h4>
              <div className="grid gap-2">
                <Label htmlFor="edit_ragione_sociale">Ragione Sociale *</Label>
                <Input
                  id="edit_ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={(e) => setFormData(prev => ({ ...prev, ragione_sociale: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_partita_iva">Partita IVA *</Label>
                  <Input
                    id="edit_partita_iva"
                    value={formData.partita_iva}
                    onChange={(e) => setFormData(prev => ({ ...prev, partita_iva: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_codice_fiscale">Codice Fiscale</Label>
                  <Input
                    id="edit_codice_fiscale"
                    value={formData.codice_fiscale}
                    onChange={(e) => setFormData(prev => ({ ...prev, codice_fiscale: e.target.value }))}
                    placeholder="Se diverso da P.IVA"
                  />
                </div>
              </div>
            </div>

            {/* Sezione: Contatti */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-2">📧 Contatti</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_email">Email *</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_pec">PEC</Label>
                  <Input
                    id="edit_pec"
                    type="email"
                    value={formData.pec}
                    onChange={(e) => setFormData(prev => ({ ...prev, pec: e.target.value }))}
                    placeholder="nome@pec.it"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_telefono">Telefono</Label>
                  <Input
                    id="edit_telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Es: +39 02 1234567"
                    maxLength={20}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_sito_web">Sito Web</Label>
                  <Input
                    id="edit_sito_web"
                    type="url"
                    value={formData.sito_web}
                    onChange={(e) => setFormData(prev => ({ ...prev, sito_web: e.target.value }))}
                    placeholder="https://www.esempio.it"
                  />
                </div>
              </div>
            </div>

            {/* Sezione: Camera di Commercio */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-2">🏛️ Camera di Commercio</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_forma_giuridica">Forma Giuridica</Label>
                  <Input
                    id="edit_forma_giuridica"
                    value={formData.forma_giuridica}
                    onChange={(e) => setFormData(prev => ({ ...prev, forma_giuridica: e.target.value }))}
                    placeholder="Es: SRL, SPA, SNC..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_numero_rea">Numero REA</Label>
                  <Input
                    id="edit_numero_rea"
                    value={formData.numero_rea}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_rea: e.target.value }))}
                    placeholder="Es: MI-1234567"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_cciaa">CCIAA</Label>
                  <Input
                    id="edit_cciaa"
                    value={formData.cciaa}
                    onChange={(e) => setFormData(prev => ({ ...prev, cciaa: e.target.value.toUpperCase() }))}
                    placeholder="Es: MI, RM, TO..."
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            {/* Sezione: Classificazione */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-2">🏢 Classificazione</h4>

            <div className="grid gap-2">
              <Label htmlFor="edit_dimensione">Tipo di Azienda</Label>
              <Select
                value={formData.dimensione_azienda}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dimensione_azienda: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPI_AZIENDA.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sede Legale */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Sede Legale *</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_regione_nome">Regione</Label>
                  <Select
                    value={formData.regione_nome}
                    onValueChange={handleRegioneSedeLegaleChange}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleziona regione" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {REGIONI_E_PROVINCE.map((regione) => (
                        <SelectItem key={regione.nome} value={regione.nome}>
                          {regione.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_provincia_nome">Provincia</Label>
                  <Select
                    value={formData.provincia_nome}
                    onValueChange={handleProvinciaSedeLegaleChange}
                    disabled={!formData.regione_nome}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Prima scegli regione" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getProvinceByRegione(formData.regione_nome).map((provincia) => (
                        <SelectItem 
                          key={provincia.sigla} 
                          value={provincia.nome}
                        >
                          {provincia.nome} ({provincia.sigla})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sede Operativa */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Sede Operativa</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_sede_operativa_uguale"
                  checked={formData.sede_operativa_uguale}
                  onCheckedChange={handleSedeOperativaUgualeChange}
                />
                <Label 
                  htmlFor="edit_sede_operativa_uguale" 
                  className="text-sm font-normal cursor-pointer"
                >
                  La sede operativa coincide con la sede legale
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_sede_operativa_regione">Regione</Label>
                  <Select
                    value={formData.sede_operativa_regione}
                    onValueChange={handleRegioneSedeOperativaChange}
                    disabled={formData.sede_operativa_uguale}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleziona regione" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {REGIONI_E_PROVINCE.map((regione) => (
                        <SelectItem key={regione.nome} value={regione.nome}>
                          {regione.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_sede_operativa_provincia">Provincia</Label>
                  <Select
                    value={formData.sede_operativa_provincia}
                    onValueChange={handleProvinciaSedeOperativaChange}
                    disabled={formData.sede_operativa_uguale || !formData.sede_operativa_regione}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Prima scegli regione" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getProvinceByRegione(formData.sede_operativa_regione).map((provincia) => (
                        <SelectItem 
                          key={provincia.sigla} 
                          value={provincia.nome}
                        >
                          {provincia.nome} ({provincia.sigla})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_numero_dipendenti">Numero Dipendenti</Label>
              <Select
                value={formData.numero_dipendenti}
                onValueChange={(value) => setFormData(prev => ({ ...prev, numero_dipendenti: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona range" />
                </SelectTrigger>
                <SelectContent>
                  {NUMERO_DIPENDENTI_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_costituzione_societa">Costituzione Società</Label>
              <Select
                value={formData.costituzione_societa}
                onValueChange={(value) => setFormData(prev => ({ ...prev, costituzione_societa: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona periodo" />
                </SelectTrigger>
                <SelectContent>
                  {COSTITUZIONE_SOCIETA_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <AtecoSelector
                selected={formData.codici_ateco}
                onChange={(codici) => setFormData(prev => ({ ...prev, codici_ateco: codici }))}
              />
            </div>
            </div>

            {/* Sezione: Attività */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-2">📝 Attività</h4>
              <div className="grid gap-2">
                <Label htmlFor="edit_descrizione_attivita">Descrizione Attività</Label>
                <Textarea
                  id="edit_descrizione_attivita"
                  value={formData.descrizione_attivita}
                  onChange={(e) => setFormData(prev => ({ ...prev, descrizione_attivita: e.target.value }))}
                  placeholder="Descrizione dell'attività aziendale / oggetto sociale..."
                  rows={3}
                />
              </div>
            </div>

            {/* Sezione: Soci e Amministratori (solo visualizzazione) */}
            {selectedAzienda?.dati_aggiuntivi && (
              (selectedAzienda.dati_aggiuntivi.soci?.length > 0 || 
               selectedAzienda.dati_aggiuntivi.amministratori?.length > 0) && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-primary border-b pb-2">👥 Soci e Amministratori</h4>
                
                {/* Tabella Soci */}
                {selectedAzienda.dati_aggiuntivi.soci?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Soci ({selectedAzienda.dati_aggiuntivi.soci.length})</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Nome</TableHead>
                            <TableHead className="text-xs">Cognome</TableHead>
                            <TableHead className="text-xs">Codice Fiscale</TableHead>
                            <TableHead className="text-xs">Quota %</TableHead>
                            <TableHead className="text-xs">Ruolo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(selectedAzienda.dati_aggiuntivi.soci as Socio[]).map((socio, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm py-2">{socio.nome || "-"}</TableCell>
                              <TableCell className="text-sm py-2">{socio.cognome || "-"}</TableCell>
                              <TableCell className="text-sm py-2 font-mono text-xs">{socio.codice_fiscale || "-"}</TableCell>
                              <TableCell className="text-sm py-2">{socio.quota_percentuale || "-"}</TableCell>
                              <TableCell className="text-sm py-2">{socio.ruolo || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Tabella Amministratori */}
                {selectedAzienda.dati_aggiuntivi.amministratori?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Amministratori ({selectedAzienda.dati_aggiuntivi.amministratori.length})</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Nome</TableHead>
                            <TableHead className="text-xs">Cognome</TableHead>
                            <TableHead className="text-xs">Codice Fiscale</TableHead>
                            <TableHead className="text-xs">Carica</TableHead>
                            <TableHead className="text-xs">Data Nomina</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(selectedAzienda.dati_aggiuntivi.amministratori as Amministratore[]).map((admin, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm py-2">{admin.nome || "-"}</TableCell>
                              <TableCell className="text-sm py-2">{admin.cognome || "-"}</TableCell>
                              <TableCell className="text-sm py-2 font-mono text-xs">{admin.codice_fiscale || "-"}</TableCell>
                              <TableCell className="text-sm py-2">{admin.carica || "-"}</TableCell>
                              <TableCell className="text-sm py-2">{admin.data_nomina || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Sezione: Interessi */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary border-b pb-2">💡 Interessi</h4>
              <div className="grid gap-2">
                <Label htmlFor="edit_investimenti_interesse">
                  Investimenti di Interesse <span className="text-xs text-muted-foreground">(opzionale)</span>
                </Label>
                <MultiSelect
                  options={INVESTIMENTI_FINANZIABILI}
                  selected={formData.investimenti_interesse}
                  onChange={(selected) => setFormData(prev => ({ ...prev, investimenti_interesse: selected }))}
                  placeholder="Seleziona investimenti..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit_spese_interesse">
                  Spese di Interesse <span className="text-xs text-muted-foreground">(opzionale)</span>
                </Label>
                <MultiSelect
                  options={SPESE_AMMISSIBILI}
                  selected={formData.spese_interesse}
                  onChange={(selected) => setFormData(prev => ({ ...prev, spese_interesse: selected }))}
                  placeholder="Seleziona spese..."
                />
              </div>
            </div>

            {/* Sezione Admin Only */}
            {profile?.role === 'admin' && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-destructive border-b pb-2">🔒 Sezione Amministratore</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_stato_attivita">Stato Attività</Label>
                    <Select
                      value={formData.stato_attivita || "none"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, stato_attivita: value === "none" ? "" : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non specificato</SelectItem>
                        <SelectItem value="attiva">Attiva</SelectItem>
                        <SelectItem value="inattiva">Inattiva</SelectItem>
                        <SelectItem value="in_liquidazione">In liquidazione</SelectItem>
                        <SelectItem value="cessata">Cessata</SelectItem>
                        <SelectItem value="sospesa">Sospesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_data_costituzione">Data Costituzione</Label>
                    <Input
                      id="edit_data_costituzione"
                      type="date"
                      value={formData.data_costituzione}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_costituzione: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_capitale_sociale">Capitale Sociale (€)</Label>
                    <Input
                      id="edit_capitale_sociale"
                      type="number"
                      value={formData.capitale_sociale}
                      onChange={(e) => setFormData(prev => ({ ...prev, capitale_sociale: e.target.value }))}
                      placeholder="es. 10000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Profile ID</Label>
                    <Input
                      value={selectedAzienda?.profile_id || "Non connesso"}
                      disabled
                      className="bg-muted text-xs font-mono"
                    />
                  </div>
                </div>
                
                {/* Assegna a Gestore */}
                <div className="grid gap-2">
                  <Label htmlFor="edit_gestore">Assegna a Gestore</Label>
                  <Select
                    value={formData.gestore_id || "none"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gestore_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nessun gestore" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessun gestore</SelectItem>
                      {gestori.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nome} {g.cognome} {g.ragione_sociale ? `(${g.ragione_sociale})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label className="text-muted-foreground">Inserita da Docente</Label>
                    <p className="font-mono truncate">{selectedAzienda?.inserita_da_docente_id || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Badge Manager */}
            {selectedAzienda && (
              <div className="border-t pt-4">
                <BadgeManager
                  entityType="azienda"
                  entityId={selectedAzienda.id}
                  canEdit={profile?.role === 'admin' || profile?.role === 'gestore'}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditOpen(false);
              setSelectedAzienda(null);
              resetForm();
            }}>
              Annulla
            </Button>
            <Button onClick={handleUpdate}>Salva Modifiche</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'azienda <strong>{aziendaToDelete?.ragione_sociale}</strong>?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAziendaToDelete(null)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
    </div>
  );
};

export default AziendePage;
