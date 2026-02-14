import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AtecoSelector } from "@/components/AtecoSelector";
import { REGIONI_E_PROVINCE } from "@/data/regioni-province";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useBadgeFormativi } from "@/hooks/useBadgeFormativi";
import { BadgeSuggestionsAI } from "@/components/BadgeSuggestionsAI";
import { cn } from "@/lib/utils";
import { differenceInMonths } from "date-fns";
import { 
  Search, Loader2, FileUp, Building2, MapPin, Target, Users, 
  AlertCircle, Check, Sparkles, Globe, Mail
} from "lucide-react";

interface NuovaAziendaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  gestoreId?: string | null;
  collaboratoreId?: string | null;
  docenteId?: string | null;
  gestorePraticheId?: string | null;
  collaboratori?: Array<{ id: string; nome: string; cognome: string }>;
  userRole?: string;
}

// Tipologia di soggetto - campo obbligatorio, mutuamente esclusivo (importante per logica incroci)
const TIPOLOGIA_SOGGETTO_OPTIONS = [
  { value: "Professionista", description: "Attività professionale individuale o associata" },
  { value: "Micro impresa", description: "(meno di 10 addetti)" },
  { value: "PMI", description: "(meno di 250 addetti)" },
  { value: "Grande impresa", description: "(250+ addetti)" }
];

// Qualifiche/condizioni opzionali (checkbox multiple)
const QUALIFICHE_AZIENDA_OPTIONS = [
  "Startup / Impresa innovativa",
  "Impresa in rete / Aggregazione",
  "Ditta individuale"
];

const NUMERO_DIPENDENTI_OPTIONS = [
  "0", "1/3", "4/9", "10/19", "20/49", "50/99", "100/250", "+250"
];

const COSTITUZIONE_SOCIETA_OPTIONS = [
  "Da costituire", "Fino a 12 mesi", "Da 12 a 24 mesi", 
  "Da 24 a 60 mesi", "Oltre 60 mesi"
];

const INVESTIMENTI_OPTIONS = [
  "Beni strumentali ordinari", "Beni strumentali tecnologici-4.0",
  "Riduzione consumi e efficientamento energetico", "Sito web e e-commerce",
  "Marketing e social", "Acquisto software e licenze", "Opere edili ed impiantistiche",
  "Consulenza tecnica", "Spese di personale", "Certificazioni", 
  "Partecipazione a fiere", "Liquidità", "Tecnologie 4.0", "Digital marketing"
];

const SPESE_OPTIONS = [
  "Macchinari e impianti", "Hardware", "Software gestionale",
  "Climatizzazione", "Opere edili", "Impianti generici",
  "Illuminazione LED", "Fotovoltaico", "Personale", "Formazione"
];

// Mappa CCIAA sigla -> Provincia/Regione per fallback
const CCIAA_TO_PROVINCIA: Record<string, { regione: string; provincia: string }> = {
  "AG": { regione: "Sicilia", provincia: "Agrigento" },
  "AL": { regione: "Piemonte", provincia: "Alessandria" },
  "AN": { regione: "Marche", provincia: "Ancona" },
  "AO": { regione: "Valle d'Aosta", provincia: "Aosta" },
  "AP": { regione: "Marche", provincia: "Ascoli Piceno" },
  "AQ": { regione: "Abruzzo", provincia: "L'Aquila" },
  "AR": { regione: "Toscana", provincia: "Arezzo" },
  "AT": { regione: "Piemonte", provincia: "Asti" },
  "AV": { regione: "Campania", provincia: "Avellino" },
  "BA": { regione: "Puglia", provincia: "Bari" },
  "BG": { regione: "Lombardia", provincia: "Bergamo" },
  "BI": { regione: "Piemonte", provincia: "Biella" },
  "BL": { regione: "Veneto", provincia: "Belluno" },
  "BN": { regione: "Campania", provincia: "Benevento" },
  "BO": { regione: "Emilia-Romagna", provincia: "Bologna" },
  "BR": { regione: "Puglia", provincia: "Brindisi" },
  "BS": { regione: "Lombardia", provincia: "Brescia" },
  "BT": { regione: "Puglia", provincia: "Barletta-Andria-Trani" },
  "BZ": { regione: "Trentino-Alto Adige", provincia: "Bolzano" },
  "CA": { regione: "Sardegna", provincia: "Cagliari" },
  "CB": { regione: "Molise", provincia: "Campobasso" },
  "CE": { regione: "Campania", provincia: "Caserta" },
  "CH": { regione: "Abruzzo", provincia: "Chieti" },
  "CL": { regione: "Sicilia", provincia: "Caltanissetta" },
  "CN": { regione: "Piemonte", provincia: "Cuneo" },
  "CO": { regione: "Lombardia", provincia: "Como" },
  "CR": { regione: "Lombardia", provincia: "Cremona" },
  "CS": { regione: "Calabria", provincia: "Cosenza" },
  "CT": { regione: "Sicilia", provincia: "Catania" },
  "CZ": { regione: "Calabria", provincia: "Catanzaro" },
  "EN": { regione: "Sicilia", provincia: "Enna" },
  "FC": { regione: "Emilia-Romagna", provincia: "Forlì-Cesena" },
  "FE": { regione: "Emilia-Romagna", provincia: "Ferrara" },
  "FG": { regione: "Puglia", provincia: "Foggia" },
  "FI": { regione: "Toscana", provincia: "Firenze" },
  "FM": { regione: "Marche", provincia: "Fermo" },
  "FR": { regione: "Lazio", provincia: "Frosinone" },
  "GE": { regione: "Liguria", provincia: "Genova" },
  "GO": { regione: "Friuli-Venezia Giulia", provincia: "Gorizia" },
  "GR": { regione: "Toscana", provincia: "Grosseto" },
  "IM": { regione: "Liguria", provincia: "Imperia" },
  "IS": { regione: "Molise", provincia: "Isernia" },
  "KR": { regione: "Calabria", provincia: "Crotone" },
  "LC": { regione: "Lombardia", provincia: "Lecco" },
  "LE": { regione: "Puglia", provincia: "Lecce" },
  "LI": { regione: "Toscana", provincia: "Livorno" },
  "LO": { regione: "Lombardia", provincia: "Lodi" },
  "LT": { regione: "Lazio", provincia: "Latina" },
  "LU": { regione: "Toscana", provincia: "Lucca" },
  "MB": { regione: "Lombardia", provincia: "Monza e Brianza" },
  "MC": { regione: "Marche", provincia: "Macerata" },
  "ME": { regione: "Sicilia", provincia: "Messina" },
  "MI": { regione: "Lombardia", provincia: "Milano" },
  "MN": { regione: "Lombardia", provincia: "Mantova" },
  "MO": { regione: "Emilia-Romagna", provincia: "Modena" },
  "MS": { regione: "Toscana", provincia: "Massa-Carrara" },
  "MT": { regione: "Basilicata", provincia: "Matera" },
  "NA": { regione: "Campania", provincia: "Napoli" },
  "NO": { regione: "Piemonte", provincia: "Novara" },
  "NU": { regione: "Sardegna", provincia: "Nuoro" },
  "OR": { regione: "Sardegna", provincia: "Oristano" },
  "PA": { regione: "Sicilia", provincia: "Palermo" },
  "PC": { regione: "Emilia-Romagna", provincia: "Piacenza" },
  "PD": { regione: "Veneto", provincia: "Padova" },
  "PE": { regione: "Abruzzo", provincia: "Pescara" },
  "PG": { regione: "Umbria", provincia: "Perugia" },
  "PI": { regione: "Toscana", provincia: "Pisa" },
  "PN": { regione: "Friuli-Venezia Giulia", provincia: "Pordenone" },
  "PO": { regione: "Toscana", provincia: "Prato" },
  "PR": { regione: "Emilia-Romagna", provincia: "Parma" },
  "PT": { regione: "Toscana", provincia: "Pistoia" },
  "PU": { regione: "Marche", provincia: "Pesaro e Urbino" },
  "PV": { regione: "Lombardia", provincia: "Pavia" },
  "PZ": { regione: "Basilicata", provincia: "Potenza" },
  "RA": { regione: "Emilia-Romagna", provincia: "Ravenna" },
  "RC": { regione: "Calabria", provincia: "Reggio Calabria" },
  "RE": { regione: "Emilia-Romagna", provincia: "Reggio Emilia" },
  "RG": { regione: "Sicilia", provincia: "Ragusa" },
  "RI": { regione: "Lazio", provincia: "Rieti" },
  "RM": { regione: "Lazio", provincia: "Roma" },
  "RN": { regione: "Emilia-Romagna", provincia: "Rimini" },
  "RO": { regione: "Veneto", provincia: "Rovigo" },
  "SA": { regione: "Campania", provincia: "Salerno" },
  "SI": { regione: "Toscana", provincia: "Siena" },
  "SO": { regione: "Lombardia", provincia: "Sondrio" },
  "SP": { regione: "Liguria", provincia: "La Spezia" },
  "SR": { regione: "Sicilia", provincia: "Siracusa" },
  "SS": { regione: "Sardegna", provincia: "Sassari" },
  "SU": { regione: "Sardegna", provincia: "Sud Sardegna" },
  "SV": { regione: "Liguria", provincia: "Savona" },
  "TA": { regione: "Puglia", provincia: "Taranto" },
  "TE": { regione: "Abruzzo", provincia: "Teramo" },
  "TN": { regione: "Trentino-Alto Adige", provincia: "Trento" },
  "TO": { regione: "Piemonte", provincia: "Torino" },
  "TP": { regione: "Sicilia", provincia: "Trapani" },
  "TR": { regione: "Umbria", provincia: "Terni" },
  "TS": { regione: "Friuli-Venezia Giulia", provincia: "Trieste" },
  "TV": { regione: "Veneto", provincia: "Treviso" },
  "UD": { regione: "Friuli-Venezia Giulia", provincia: "Udine" },
  "VA": { regione: "Lombardia", provincia: "Varese" },
  "VB": { regione: "Piemonte", provincia: "Verbano-Cusio-Ossola" },
  "VC": { regione: "Piemonte", provincia: "Vercelli" },
  "VE": { regione: "Veneto", provincia: "Venezia" },
  "VI": { regione: "Veneto", provincia: "Vicenza" },
  "VR": { regione: "Veneto", provincia: "Verona" },
  "VT": { regione: "Lazio", provincia: "Viterbo" },
  "VV": { regione: "Calabria", provincia: "Vibo Valentia" }
};

export function NuovaAziendaWizard({
  open,
  onOpenChange,
  onSuccess,
  gestoreId,
  collaboratoreId,
  docenteId,
  gestorePraticheId,
  collaboratori = [],
  userRole
}: NuovaAziendaWizardProps) {
  const [loading, setLoading] = useState(false);
  const [pivaSearch, setPivaSearch] = useState("");
  const [pivaLoading, setPivaLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    partita_iva: false
  });
  const [triggerBadgeAI, setTriggerBadgeAI] = useState(false);
  const { badgeOptions, badgeFormativi } = useBadgeFormativi();
  
  // Document upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<Record<string, any> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: mappa numero dipendenti estratto alle opzioni del form
  const mapNumeroDipendenti = (nd: string | number | undefined): string => {
    if (!nd) return "";
    const str = String(nd).replace(/[^\d\-]/g, '');
    // Se è un range (es. "10-19"), prendi il primo numero
    const num = parseInt(str.split('-')[0]);
    if (isNaN(num) || num === 0) return "0";
    if (num <= 3) return "1/3";
    if (num <= 9) return "4/9";
    if (num <= 19) return "10/19";
    if (num <= 49) return "20/49";
    if (num <= 99) return "50/99";
    if (num <= 250) return "100/250";
    return "+250";
  };

  // Form state
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
    badge_formativi: [] as string[],
    collaboratore_id: "",
    // Nuovi campi dalla visura
      codice_fiscale: "",
      pec: "",
      sito_web: "",
      forma_giuridica: "",
      descrizione_attivita: "",
      numero_rea: "",
      cciaa: "",
      qualifiche_azienda: [] as string[]
    });

  // Province helpers
  const getProvinceByRegione = (nomeRegione: string) => {
    const regione = REGIONI_E_PROVINCE.find(r => r.nome === nomeRegione);
    return regione?.province || [];
  };

  const buildProvinciaCodice = (regione: string, provincia: string, sigla: string) => {
    return `${regione} - ${provincia} (${sigla})`;
  };

  // Validation helpers
  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPivaValid = (piva: string) => /^\d{11}$/.test(piva);
  
  const handleFieldBlur = (field: 'email' | 'partita_iva') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };
  
  const getFieldError = (field: 'email' | 'ragione_sociale' | 'partita_iva') => {
    // Per email e partita_iva: validazione real-time dopo blur
    if (field === 'email') {
      if (!touchedFields.email && !showErrors) return null;
      if (!formData.email.trim()) return "Campo obbligatorio";
      if (!isEmailValid(formData.email)) return "Email non valida";
    }
    if (field === 'partita_iva') {
      if (!touchedFields.partita_iva && !showErrors) return null;
      if (!formData.partita_iva.trim()) return "Campo obbligatorio";
      if (!isPivaValid(formData.partita_iva)) return "Deve essere di 11 cifre";
    }
    // ragione_sociale: solo dopo submit
    if (field === 'ragione_sociale' && showErrors && !formData.ragione_sociale.trim()) {
      return "Campo obbligatorio";
    }
    return null;
  };
  
  const isFieldValid = (field: 'email' | 'partita_iva') => {
    if (field === 'email') return touchedFields.email && formData.email.trim() && isEmailValid(formData.email);
    if (field === 'partita_iva') return touchedFields.partita_iva && formData.partita_iva.trim() && isPivaValid(formData.partita_iva);
    return false;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: "", ragione_sociale: "", partita_iva: "", codice_ateco: "",
      codici_ateco: [] as string[], settore: "", dimensione_azienda: "", regione: "",
      regione_nome: "", provincia_nome: "", sede_operativa: "",
      sede_operativa_regione: "", sede_operativa_provincia: "",
      sede_operativa_uguale: true, numero_dipendenti: "", costituzione_societa: "",
      telefono: "", investimenti_interesse: [] as string[], spese_interesse: [] as string[], 
      badge_formativi: [] as string[], collaboratore_id: "",
      codice_fiscale: "", pec: "", sito_web: "", forma_giuridica: "", descrizione_attivita: "",
      numero_rea: "", cciaa: "", qualifiche_azienda: [] as string[]
    });
    setPivaSearch("");
    setUploadedFile(null);
    setExtractedPreview(null);
    setShowErrors(false);
    setTouchedFields({ email: false, partita_iva: false });
  };

  // Search by P.IVA (OpenAPI or CreditSafe)
  const handlePivaSearch = async () => {
    if (!pivaSearch.trim()) {
      toast({ title: "Inserisci una Partita IVA", variant: "destructive" });
      return;
    }

    setPivaLoading(true);
    try {
      const functionName = "openapi-search";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { partita_iva: pivaSearch }
      });

      if (error) throw error;

      if (data?.success === false) {
        toast({
          title: "Ricerca non riuscita",
          description: data?.message || "Compila manualmente i campi",
          variant: "destructive",
        });
        setFormData(prev => ({ ...prev, partita_iva: pivaSearch }));
        return;
      }

      if (data?.success && data?.data) {
        const d = data.data;
        setFormData(prev => ({
          ...prev,
          ragione_sociale: d.ragione_sociale || prev.ragione_sociale,
          partita_iva: d.partita_iva || pivaSearch,
          codice_ateco: d.codice_ateco || prev.codice_ateco,
          regione_nome: d.regione || prev.regione_nome,
          provincia_nome: d.provincia_nome || prev.provincia_nome,
          telefono: d.telefono || prev.telefono,
          numero_dipendenti: d.numero_dipendenti || prev.numero_dipendenti,
          dimensione_azienda: d.dimensione_azienda || prev.dimensione_azienda,
          costituzione_societa: d.costituzione_societa || prev.costituzione_societa,
          // Campi aggiuntivi da CreditSafe
          codice_fiscale: d.codice_fiscale || prev.codice_fiscale,
          pec: d.pec || prev.pec,
          sito_web: d.sito_web || prev.sito_web,
          email: d.email || prev.email,
          forma_giuridica: d.forma_giuridica || prev.forma_giuridica,
          numero_rea: d.numero_rea || prev.numero_rea,
          cciaa: d.cciaa || prev.cciaa
        }));
        
        if (d.regione && d.provincia_nome && d.provincia_sigla) {
          const codice = buildProvinciaCodice(d.regione, d.provincia_nome, d.provincia_sigla);
          setFormData(prev => ({ ...prev, regione: codice, sede_operativa: codice }));
        }

        toast({ title: "Dati recuperati da OpenAPI!", description: d.ragione_sociale });
      } else {
        toast({
          title: "Azienda non trovata",
          description: "Compila manualmente i campi",
          variant: "default"
        });
        setFormData(prev => ({ ...prev, partita_iva: pivaSearch }));
      }
    } catch (error: any) {
      console.error('Errore ricerca:', error);
      toast({
        title: "Errore ricerca",
        description: "Servizio non disponibile. Compila manualmente.",
        variant: "destructive"
      });
      setFormData(prev => ({ ...prev, partita_iva: pivaSearch }));
    } finally {
      setPivaLoading(false);
    }
  };

  // Handle document upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Solo file PDF", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File troppo grande (max 10MB)", variant: "destructive" });
      return;
    }

    setUploadedFile(file);
    setUploadLoading(true);
    setExtractedPreview(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('parse-visura-pdf', {
          body: { pdf_base64: base64, file_name: file.name }
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          setExtractedPreview(data.data);
          // Auto-applica i dati estratti al form
          applyExtractedDataAuto(data.data);
          toast({ 
            title: "Dati caricati automaticamente!", 
            description: "Verifica i dati importati e modifica se necessario" 
          });
        } else {
          throw new Error(data?.error || "Errore analisi documento");
        }
      };
      reader.onerror = () => {
        throw new Error("Errore lettura file");
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Errore analisi documento",
        description: error.message || "Riprova o compila manualmente",
        variant: "destructive"
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Helper: trova provincia con ricerca fuzzy
  const findProvinciaFuzzy = (searchTerm: string): { regione: string; provincia: string; sigla: string } | null => {
    if (!searchTerm) return null;
    const term = searchTerm.toLowerCase().trim();
    
    for (const regione of REGIONI_E_PROVINCE) {
      for (const prov of regione.province) {
        // Match esatto nome provincia
        if (prov.nome.toLowerCase() === term) {
          return { regione: regione.nome, provincia: prov.nome, sigla: prov.sigla };
        }
        // Match sigla
        if (prov.sigla.toLowerCase() === term) {
          return { regione: regione.nome, provincia: prov.nome, sigla: prov.sigla };
        }
      }
    }
    
    // Match parziale (contains)
    for (const regione of REGIONI_E_PROVINCE) {
      for (const prov of regione.province) {
        if (prov.nome.toLowerCase().includes(term) || term.includes(prov.nome.toLowerCase())) {
          return { regione: regione.nome, provincia: prov.nome, sigla: prov.sigla };
        }
      }
    }
    
    return null;
  };

  // Helper: deduce provincia da CCIAA
  const getProvinciaFromCCIAA = (cciaa: string): { regione: string; provincia: string; sigla: string } | null => {
    if (!cciaa) return null;
    // Estrai la sigla (es. "MI-1234567" -> "MI", "MI" -> "MI", "MILANO" -> cerca)
    const sigla = cciaa.replace(/[\s\-]/g, '').substring(0, 2).toUpperCase();
    const info = CCIAA_TO_PROVINCIA[sigla];
    if (info) {
      return { regione: info.regione, provincia: info.provincia, sigla };
    }
    return null;
  };

  // Auto apply extracted data (called immediately after PDF parsing)
  const applyExtractedDataAuto = (d: Record<string, any>) => {
    // Calcola anzianità società dalla data di costituzione
    let costituzioneSocieta = "";
    if (d.data_costituzione) {
      try {
        const dataCostituzione = new Date(d.data_costituzione);
        if (!isNaN(dataCostituzione.getTime())) {
          const mesiDaCostituzione = differenceInMonths(new Date(), dataCostituzione);
          if (mesiDaCostituzione <= 12) costituzioneSocieta = "Fino a 12 mesi";
          else if (mesiDaCostituzione <= 24) costituzioneSocieta = "Da 12 a 24 mesi";
          else if (mesiDaCostituzione <= 60) costituzioneSocieta = "Da 24 a 60 mesi";
          else costituzioneSocieta = "Oltre 60 mesi";
        }
      } catch (e) {
        console.error('Errore parsing data costituzione:', e);
      }
    }

    // Mappa forma giuridica a tipo azienda
    let dimensioneAzienda = "";
    if (d.forma_giuridica) {
      const fg = d.forma_giuridica.toUpperCase();
      if (fg.includes('INDIVIDUALE') || fg.includes('DITTA')) {
        dimensioneAzienda = "Ditta individuale";
      } else if (fg.includes('SRL') || fg.includes('S.R.L') || fg.includes('SNC') || fg.includes('SAS')) {
        dimensioneAzienda = "PMI";
      } else if (fg.includes('SPA') || fg.includes('S.P.A')) {
        dimensioneAzienda = "Midcap";
      } else if (fg.includes('LIBERO') || fg.includes('PROFESSIONISTA')) {
        dimensioneAzienda = "Liberi professionisti";
      }
    }

    // Mappa numero dipendenti estratto alle opzioni del form
    const numeroDipendentiMapped = mapNumeroDipendenti(d.numero_dipendenti);

    setFormData(prev => ({
      ...prev,
      ragione_sociale: d.ragione_sociale || prev.ragione_sociale,
      partita_iva: d.partita_iva || prev.partita_iva,
      email: d.pec || d.email || prev.email,
      telefono: d.telefono || prev.telefono,
      codice_ateco: d.codice_ateco || prev.codice_ateco,
      codici_ateco: d.codici_ateco?.length ? d.codici_ateco : (d.codice_ateco ? [d.codice_ateco] : prev.codici_ateco),
      numero_dipendenti: numeroDipendentiMapped || prev.numero_dipendenti,
      costituzione_societa: costituzioneSocieta || prev.costituzione_societa,
      dimensione_azienda: dimensioneAzienda || prev.dimensione_azienda,
      codice_fiscale: d.codice_fiscale || prev.codice_fiscale,
      pec: d.pec || prev.pec,
      sito_web: d.sito_web || prev.sito_web,
      forma_giuridica: d.forma_giuridica || prev.forma_giuridica,
      descrizione_attivita: d.descrizione_attivita || prev.descrizione_attivita,
      numero_rea: d.numero_rea || prev.numero_rea,
      cciaa: d.cciaa || prev.cciaa,
    }));

    // Trigger AI badge suggestions se abbiamo codici ATECO
    if (d.codice_ateco || d.codici_ateco?.length > 0) {
      setTimeout(() => setTriggerBadgeAI(true), 500);
    }

    // MIGLIORATO: Handle sede legale con fallback multipli
    let provinciaFound: { regione: string; provincia: string; sigla: string } | null = null;

    // 1. Prova con provincia_sigla se presente
    if (d.sede_legale?.provincia_sigla) {
      const info = CCIAA_TO_PROVINCIA[d.sede_legale.provincia_sigla.toUpperCase()];
      if (info) {
        provinciaFound = { regione: info.regione, provincia: info.provincia, sigla: d.sede_legale.provincia_sigla.toUpperCase() };
      }
    }

    // 2. Prova matching regione+provincia dall'AI
    if (!provinciaFound && d.sede_legale?.regione) {
      const regione = REGIONI_E_PROVINCE.find(
        r => r.nome.toLowerCase() === d.sede_legale.regione.toLowerCase()
      );
      if (regione) {
        // Prima prova con provincia
        let prov = regione.province.find(
          p => p.nome.toLowerCase() === d.sede_legale.provincia?.toLowerCase()
        );
        // Poi prova con comune
        if (!prov && d.sede_legale.comune) {
          prov = regione.province.find(
            p => p.nome.toLowerCase() === d.sede_legale.comune.toLowerCase() ||
                 d.sede_legale.comune.toLowerCase().includes(p.nome.toLowerCase())
          );
        }
        if (prov) {
          provinciaFound = { regione: regione.nome, provincia: prov.nome, sigla: prov.sigla };
        }
      }
    }

    // 3. Prova ricerca fuzzy su provincia o comune
    if (!provinciaFound && (d.sede_legale?.provincia || d.sede_legale?.comune)) {
      provinciaFound = findProvinciaFuzzy(d.sede_legale?.provincia) || 
                       findProvinciaFuzzy(d.sede_legale?.comune);
    }

    // 4. Fallback: deduce dalla CCIAA
    if (!provinciaFound && d.cciaa) {
      provinciaFound = getProvinciaFromCCIAA(d.cciaa);
    }

    // 5. Fallback: deduce dal numero REA (es. "MI-1234567")
    if (!provinciaFound && d.numero_rea) {
      const reaMatch = d.numero_rea.match(/^([A-Z]{2})/i);
      if (reaMatch) {
        provinciaFound = getProvinciaFromCCIAA(reaMatch[1]);
      }
    }

    // Applica la provincia trovata
    if (provinciaFound) {
      const codice = buildProvinciaCodice(provinciaFound.regione, provinciaFound.provincia, provinciaFound.sigla);
      setFormData(prev => ({
        ...prev,
        regione_nome: provinciaFound!.regione,
        provincia_nome: provinciaFound!.provincia,
        regione: codice,
        sede_operativa: prev.sede_operativa_uguale ? codice : prev.sede_operativa
      }));
    }

    // Handle sede operativa if different
    if (d.sede_operativa?.regione && d.sede_legale?.regione && 
        d.sede_operativa.regione.toLowerCase() !== d.sede_legale.regione.toLowerCase()) {
      let sedeOpProv: { regione: string; provincia: string; sigla: string } | null = null;
      
      // Prova con provincia_sigla
      if (d.sede_operativa.provincia_sigla) {
        const info = CCIAA_TO_PROVINCIA[d.sede_operativa.provincia_sigla.toUpperCase()];
        if (info) {
          sedeOpProv = { regione: info.regione, provincia: info.provincia, sigla: d.sede_operativa.provincia_sigla.toUpperCase() };
        }
      }
      
      if (!sedeOpProv) {
        const regione = REGIONI_E_PROVINCE.find(
          r => r.nome.toLowerCase() === d.sede_operativa.regione.toLowerCase()
        );
        if (regione) {
          const prov = regione.province.find(
            p => p.nome.toLowerCase() === d.sede_operativa.provincia?.toLowerCase() ||
                 p.nome.toLowerCase().includes(d.sede_operativa.comune?.toLowerCase() || '')
          );
          if (prov) {
            sedeOpProv = { regione: regione.nome, provincia: prov.nome, sigla: prov.sigla };
          }
        }
      }

      if (sedeOpProv) {
        const codice = buildProvinciaCodice(sedeOpProv.regione, sedeOpProv.provincia, sedeOpProv.sigla);
        setFormData(prev => ({
          ...prev,
          sede_operativa_uguale: false,
          sede_operativa_regione: sedeOpProv!.regione,
          sede_operativa_provincia: sedeOpProv!.provincia,
          sede_operativa: codice
        }));
      }
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    setShowErrors(true);
    
    const emailError = !formData.email.trim() || !isEmailValid(formData.email);
    const ragioneSocialeError = !formData.ragione_sociale.trim();
    const pivaError = !formData.partita_iva.trim() || !isPivaValid(formData.partita_iva);
    const tipologiaSoggettoError = !formData.dimensione_azienda;
    
    if (emailError || ragioneSocialeError || pivaError || tipologiaSoggettoError) {
      toast({
        title: "Campi obbligatori mancanti o non validi",
        description: "Correggi i campi evidenziati in rosso",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const insertData: any = {
        email: formData.email,
        ragione_sociale: formData.ragione_sociale,
        partita_iva: formData.partita_iva,
      };

      // Assegnazione in base al ruolo
      if (userRole === 'docente' && docenteId) {
        insertData.inserita_da_docente_id = docenteId;
      } else if (userRole === 'collaboratore' && collaboratoreId) {
        insertData.inserita_da_collaboratore_id = collaboratoreId;
      } else if (userRole === 'gestore') {
        if (formData.collaboratore_id) {
          insertData.inserita_da_collaboratore_id = formData.collaboratore_id;
        } else if (gestoreId) {
          insertData.inserita_da_gestore_id = gestoreId;
        }
      } else if (userRole === 'gestore_pratiche' && gestorePraticheId) {
        insertData.inserita_da_gestore_pratiche_id = gestorePraticheId;
      } else if (userRole === 'admin' && formData.collaboratore_id) {
        insertData.inserita_da_collaboratore_id = formData.collaboratore_id;
      }

      // Altri campi
      if (formData.codice_ateco) insertData.codice_ateco = formData.codice_ateco;
      if (formData.codici_ateco.length > 0) insertData.codici_ateco = formData.codici_ateco;
      if (formData.settore) insertData.settore = formData.settore;
      if (formData.dimensione_azienda) insertData.dimensione_azienda = formData.dimensione_azienda;
      if (formData.regione) insertData.regione = formData.regione;
      if (formData.sede_operativa) insertData.sede_operativa = formData.sede_operativa;
      if (formData.numero_dipendenti) insertData.numero_dipendenti = formData.numero_dipendenti;
      if (formData.costituzione_societa) insertData.costituzione_societa = formData.costituzione_societa;
      if (formData.telefono) insertData.telefono = formData.telefono;
      if (formData.investimenti_interesse.length > 0) insertData.investimenti_interesse = formData.investimenti_interesse;
      if (formData.spese_interesse.length > 0) insertData.spese_interesse = formData.spese_interesse;
      if (formData.badge_formativi.length > 0) insertData.badge_formativi = formData.badge_formativi;
      // Nuovi campi dalla visura
      if (formData.codice_fiscale) insertData.codice_fiscale = formData.codice_fiscale;
      if (formData.pec) insertData.pec = formData.pec;
      if (formData.sito_web) insertData.sito_web = formData.sito_web;
      if (formData.forma_giuridica) insertData.forma_giuridica = formData.forma_giuridica;
      if (formData.descrizione_attivita) insertData.descrizione_attivita = formData.descrizione_attivita;
      if (formData.numero_rea) insertData.numero_rea = formData.numero_rea;
      if (formData.cciaa) insertData.cciaa = formData.cciaa;
      if (formData.qualifiche_azienda.length > 0) insertData.qualifiche_azienda = formData.qualifiche_azienda;

      const { error } = await supabase.from('aziende').insert([insertData]);
      if (error) throw error;

      toast({ title: "Azienda creata con successo!" });
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Errore creazione:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'azienda",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Section header component
  const SectionHeader = ({ icon: Icon, title, color }: { icon: any; title: string; color: string }) => (
    <div className={`flex items-center gap-3 pb-3 mb-4 border-b-2`} style={{ borderColor: color }}>
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <h4 className="font-semibold text-base">{title}</h4>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Nuova Azienda
          </DialogTitle>
          <DialogDescription>Inserisci i dati dell'azienda o precompila automaticamente</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 max-h-[calc(90vh-180px)]">
          <div className="space-y-6 pb-6">
            {/* Sezione Precompila Automaticamente */}
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Precompila Automaticamente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ricerca P.IVA */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Ricerca con Partita IVA
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Es: 12345678901"
                        value={pivaSearch}
                        onChange={(e) => setPivaSearch(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        onKeyDown={(e) => e.key === 'Enter' && handlePivaSearch()}
                        className="font-mono"
                      />
                      <Button 
                        onClick={handlePivaSearch} 
                        disabled={pivaLoading || !pivaSearch.trim()}
                        size="default"
                      >
                        {pivaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recupera i dati da OpenAPI
                    </p>
                  </div>

                  {/* Carica Documento */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileUp className="h-4 w-4" />
                      Carica Documento (Visura, Bilancio)
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={uploadLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        {uploadLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Analizzando...
                          </>
                        ) : (
                          <>
                            <FileUp className="h-4 w-4 mr-2" />
                            Seleziona PDF
                          </>
                        )}
                      </Button>
                    </div>
                    {uploadedFile && (
                      <Badge variant="secondary" className="text-xs">
                        📄 {uploadedFile.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Preview dati estratti - ora mostra un riepilogo di cosa è stato importato */}
                {extractedPreview && (
                  <Card className="border-2 border-green-400/50 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        Dati Importati dal Documento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mb-4">
                        {extractedPreview.ragione_sociale && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Ragione Sociale</span>
                            <span className="font-medium truncate block">{extractedPreview.ragione_sociale}</span>
                          </div>
                        )}
                        {extractedPreview.partita_iva && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">P.IVA</span>
                            <span className="font-mono">{extractedPreview.partita_iva}</span>
                          </div>
                        )}
                        {extractedPreview.codice_fiscale && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Codice Fiscale</span>
                            <span className="font-mono">{extractedPreview.codice_fiscale}</span>
                          </div>
                        )}
                        {extractedPreview.forma_giuridica && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Forma Giuridica</span>
                            <span>{extractedPreview.forma_giuridica}</span>
                          </div>
                        )}
                        {/* Codici ATECO - con evidenziazione principale */}
                        {(extractedPreview.codice_ateco || extractedPreview.codici_ateco_secondari?.length > 0) && (
                          <div className="p-2 rounded bg-background/80 col-span-2 md:col-span-3">
                            <span className="text-xs text-muted-foreground block mb-1">Codici ATECO</span>
                            <div className="flex flex-wrap gap-1.5">
                              {extractedPreview.codice_ateco && (
                                <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                                  ★ {extractedPreview.codice_ateco}
                                </Badge>
                              )}
                              {extractedPreview.codici_ateco_secondari?.map((code: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="font-mono text-xs">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Numero Dipendenti */}
                        {extractedPreview.numero_dipendenti && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Dipendenti</span>
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {extractedPreview.numero_dipendenti}
                            </Badge>
                          </div>
                        )}
                        {/* Tipo/Dimensione Azienda */}
                        {extractedPreview.dimensione_azienda && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Tipo Azienda</span>
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {extractedPreview.dimensione_azienda}
                            </Badge>
                          </div>
                        )}
                        {/* Sede legale completa */}
                        {extractedPreview.sede_legale && (
                          <div className="p-2 rounded bg-background/80 col-span-2">
                            <span className="text-xs text-muted-foreground block">Sede Legale</span>
                            <span className="text-sm">
                              {[
                                extractedPreview.sede_legale.indirizzo,
                                extractedPreview.sede_legale.cap,
                                extractedPreview.sede_legale.comune,
                                extractedPreview.sede_legale.provincia ? `(${extractedPreview.sede_legale.provincia})` : null,
                                extractedPreview.sede_legale.regione
                              ].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        )}
                        {/* Sede operativa se diversa */}
                        {extractedPreview.sede_operativa && extractedPreview.sede_operativa.comune !== extractedPreview.sede_legale?.comune && (
                          <div className="p-2 rounded bg-background/80 col-span-2">
                            <span className="text-xs text-muted-foreground block">Sede Operativa</span>
                            <span className="text-sm">
                              {[
                                extractedPreview.sede_operativa.indirizzo,
                                extractedPreview.sede_operativa.cap,
                                extractedPreview.sede_operativa.comune,
                                extractedPreview.sede_operativa.provincia ? `(${extractedPreview.sede_operativa.provincia})` : null,
                                extractedPreview.sede_operativa.regione
                              ].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        )}
                        {extractedPreview.pec && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">PEC</span>
                            <span className="text-xs truncate block">{extractedPreview.pec}</span>
                          </div>
                        )}
                        {extractedPreview.email && extractedPreview.email !== extractedPreview.pec && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Email</span>
                            <span className="text-xs truncate block">{extractedPreview.email}</span>
                          </div>
                        )}
                        {extractedPreview.telefono && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Telefono</span>
                            <span className="text-sm">{extractedPreview.telefono}</span>
                          </div>
                        )}
                        {extractedPreview.sito_web && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Sito Web</span>
                            <span className="text-xs truncate block">{extractedPreview.sito_web}</span>
                          </div>
                        )}
                        {extractedPreview.data_costituzione && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Data Costituzione</span>
                            <span>{extractedPreview.data_costituzione}</span>
                          </div>
                        )}
                        {extractedPreview.capitale_sociale && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Capitale Sociale</span>
                            <span>€{Number(extractedPreview.capitale_sociale).toLocaleString('it-IT')}</span>
                          </div>
                        )}
                        {extractedPreview.stato_attivita && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Stato</span>
                            <Badge variant={extractedPreview.stato_attivita.toLowerCase().includes('attiv') ? 'default' : 'secondary'} className="text-xs">
                              {extractedPreview.stato_attivita}
                            </Badge>
                          </div>
                        )}
                        {extractedPreview.numero_rea && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Numero REA</span>
                            <span className="font-mono text-sm">{extractedPreview.numero_rea}</span>
                          </div>
                        )}
                        {extractedPreview.cciaa && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">CCIAA</span>
                            <span className="font-mono text-sm">{extractedPreview.cciaa}</span>
                          </div>
                        )}
                        {(extractedPreview.soci?.length > 0 || extractedPreview.amministratori?.length > 0) && (
                          <div className="p-2 rounded bg-background/80">
                            <span className="text-xs text-muted-foreground block">Persone</span>
                            <span className="text-xs">
                              {extractedPreview.soci?.length > 0 && `${extractedPreview.soci.length} soci`}
                              {extractedPreview.soci?.length > 0 && extractedPreview.amministratori?.length > 0 && ' • '}
                              {extractedPreview.amministratori?.length > 0 && `${extractedPreview.amministratori.length} amm.`}
                            </span>
                          </div>
                        )}
                      </div>
                      {extractedPreview.descrizione_attivita && (
                        <div className="p-2 rounded bg-background/80 mb-4">
                          <span className="text-xs text-muted-foreground block">Descrizione Attività</span>
                          <span className="text-sm line-clamp-2">{extractedPreview.descrizione_attivita}</span>
                        </div>
                      )}
                      {/* Messaggio informativo invece del bottone */}
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20 p-3 rounded-lg">
                        <Check className="h-4 w-4 flex-shrink-0" />
                        <span>Dati importati nel form sottostante - verifica e modifica se necessario</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Form Principale */}
            <div className="space-y-6">
              {/* Dati base */}
              <div>
                <SectionHeader icon={Building2} title="Dati Principali" color="#3b82f6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn("text-sm font-medium", getFieldError('ragione_sociale') && "text-destructive")}>
                      Ragione Sociale *
                    </Label>
                    <Input
                      value={formData.ragione_sociale}
                      onChange={(e) => setFormData(p => ({ ...p, ragione_sociale: e.target.value }))}
                      placeholder="Nome azienda"
                      className={cn(getFieldError('ragione_sociale') && "border-destructive focus-visible:ring-destructive")}
                    />
                    {getFieldError('ragione_sociale') && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('ragione_sociale')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className={cn("text-sm font-medium", getFieldError('partita_iva') && "text-destructive")}>
                      Partita IVA *
                    </Label>
                    <div className="relative">
                      <Input
                        value={formData.partita_iva}
                        onChange={(e) => setFormData(p => ({ ...p, partita_iva: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                        onBlur={() => handleFieldBlur('partita_iva')}
                        className={cn(
                          "font-mono pr-10 transition-colors",
                          getFieldError('partita_iva') && "border-destructive focus-visible:ring-destructive",
                          isFieldValid('partita_iva') && "border-green-500 focus-visible:ring-green-500"
                        )}
                        placeholder="12345678901"
                      />
                      {isFieldValid('partita_iva') && (
                        <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {getFieldError('partita_iva') && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('partita_iva')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className={cn("text-sm font-medium", getFieldError('email') && "text-destructive")}>
                      Email *
                    </Label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        onBlur={() => handleFieldBlur('email')}
                        placeholder="info@azienda.it"
                        className={cn(
                          "pr-10 transition-colors",
                          getFieldError('email') && "border-destructive focus-visible:ring-destructive",
                          isFieldValid('email') && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      {isFieldValid('email') && (
                        <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {getFieldError('email') && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('email')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Telefono</Label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))}
                      placeholder="+39 02 1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Codice Fiscale</Label>
                    <Input
                      value={formData.codice_fiscale}
                      onChange={(e) => setFormData(p => ({ ...p, codice_fiscale: e.target.value.toUpperCase() }))}
                      placeholder="RSSMRA80A01H501U o 12345678901"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      PEC
                    </Label>
                    <Input
                      type="email"
                      value={formData.pec}
                      onChange={(e) => setFormData(p => ({ ...p, pec: e.target.value }))}
                      placeholder="azienda@pec.it"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Sito Web
                    </Label>
                    <Input
                      type="url"
                      value={formData.sito_web}
                      onChange={(e) => setFormData(p => ({ ...p, sito_web: e.target.value }))}
                      placeholder="https://www.azienda.it"
                    />
                  </div>
                </div>
              </div>

              {/* Classificazione con AtecoSelector */}
              <div>
                <SectionHeader icon={Target} title="Classificazione (per matching bandi)" color="#8b5cf6" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Codici ATECO</Label>
                    <AtecoSelector
                      selected={formData.codici_ateco}
                      onChange={(v) => setFormData(p => ({ ...p, codici_ateco: v, codice_ateco: v[0] || '' }))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Seleziona i codici ATECO per un matching preciso con i bandi
                    </p>
                  </div>
                  
                  {/* Tipologia di soggetto - Radio buttons */}
                  <div className="space-y-3 mb-4">
                    <Label className={cn("text-sm font-medium", showErrors && !formData.dimensione_azienda && "text-destructive")}>
                      Tipologia di soggetto *
                    </Label>
                    <div className={cn(
                      "grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg border",
                      showErrors && !formData.dimensione_azienda && "border-destructive bg-destructive/5"
                    )}>
                      {TIPOLOGIA_SOGGETTO_OPTIONS.map(opt => (
                        <label 
                          key={opt.value}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                            formData.dimensione_azienda === opt.value 
                              ? "border-primary bg-primary/10" 
                              : "border-border bg-background"
                          )}
                        >
                          <input
                            type="radio"
                            name="tipologia_soggetto"
                            value={opt.value}
                            checked={formData.dimensione_azienda === opt.value}
                            onChange={(e) => setFormData(p => ({ ...p, dimensione_azienda: e.target.value }))}
                            className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                          />
                          <div>
                            <div className="font-medium text-sm">{opt.value}</div>
                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {showErrors && !formData.dimensione_azienda && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Campo obbligatorio
                      </p>
                    )}
                  </div>

                  {/* Qualifiche/Condizioni - Checkbox */}
                  <div className="space-y-3 mb-4">
                    <Label className="text-sm font-medium">Qualifiche / Condizioni (opzionali)</Label>
                    <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-muted/30">
                      {QUALIFICHE_AZIENDA_OPTIONS.map(qualifica => (
                        <label 
                          key={qualifica}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={formData.qualifiche_azienda.includes(qualifica)}
                            onCheckedChange={(checked) => {
                              setFormData(p => ({
                                ...p,
                                qualifiche_azienda: checked 
                                  ? [...p.qualifiche_azienda, qualifica]
                                  : p.qualifiche_azienda.filter(q => q !== qualifica)
                              }));
                            }}
                          />
                          <span className="text-sm">{qualifica}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">N° Dipendenti</Label>
                      <Select
                        value={formData.numero_dipendenti}
                        onValueChange={(v) => setFormData(p => ({ ...p, numero_dipendenti: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                        <SelectContent>
                          {NUMERO_DIPENDENTI_OPTIONS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Anzianità Società</Label>
                      <Select
                        value={formData.costituzione_societa}
                        onValueChange={(v) => setFormData(p => ({ ...p, costituzione_societa: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                        <SelectContent>
                          {COSTITUZIONE_SOCIETA_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Forma giuridica e descrizione attività (se estratti) */}
                  {(formData.forma_giuridica || formData.descrizione_attivita) && (
                    <div className="p-3 rounded-lg bg-muted/50 border space-y-3">
                      {formData.forma_giuridica && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Forma Giuridica:</span>
                          <Badge variant="outline">{formData.forma_giuridica}</Badge>
                        </div>
                      )}
                      {formData.descrizione_attivita && (
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Descrizione Attività (dalla visura)</Label>
                          <Textarea
                            value={formData.descrizione_attivita}
                            onChange={(e) => setFormData(p => ({ ...p, descrizione_attivita: e.target.value }))}
                            rows={2}
                            className="text-sm resize-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sede */}
              <div>
                <SectionHeader icon={MapPin} title="Sede (per matching bandi regionali)" color="#f59e0b" />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Regione Sede Legale</Label>
                      <Select
                        value={formData.regione_nome}
                        onValueChange={(v) => setFormData(p => ({ ...p, regione_nome: v, provincia_nome: "", regione: "" }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona regione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONI_E_PROVINCE.map(r => <SelectItem key={r.nome} value={r.nome}>{r.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Provincia</Label>
                      <Select
                        value={formData.provincia_nome}
                        onValueChange={(v) => {
                          const prov = getProvinceByRegione(formData.regione_nome).find(p => p.nome === v);
                          if (prov) {
                            const codice = buildProvinciaCodice(formData.regione_nome, prov.nome, prov.sigla);
                            setFormData(p => ({
                              ...p, 
                              provincia_nome: v, 
                              regione: codice,
                              ...(p.sede_operativa_uguale ? { sede_operativa: codice } : {})
                            }));
                          }
                        }}
                        disabled={!formData.regione_nome}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona provincia..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getProvinceByRegione(formData.regione_nome).map(p => (
                            <SelectItem key={p.nome} value={p.nome}>{p.nome} ({p.sigla})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.regione && (
                    <Badge variant="outline" className="text-xs">
                      Sede legale per matching: {formData.regione}
                    </Badge>
                  )}
                  
                  {/* Checkbox sede operativa coincide */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="sede_operativa_uguale"
                      checked={formData.sede_operativa_uguale}
                      onCheckedChange={(checked) => {
                        const uguale = !!checked;
                        setFormData(p => ({
                          ...p,
                          sede_operativa_uguale: uguale,
                          sede_operativa_regione: uguale ? "" : p.sede_operativa_regione,
                          sede_operativa_provincia: uguale ? "" : p.sede_operativa_provincia,
                          sede_operativa: uguale ? p.regione : p.sede_operativa
                        }));
                      }}
                    />
                    <Label htmlFor="sede_operativa_uguale" className="text-sm cursor-pointer">
                      La sede operativa coincide con la sede legale
                    </Label>
                  </div>

                  {/* Sede operativa (se diversa) */}
                  {!formData.sede_operativa_uguale && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 border">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Regione Sede Operativa</Label>
                        <Select
                          value={formData.sede_operativa_regione}
                          onValueChange={(v) => setFormData(p => ({ 
                            ...p, 
                            sede_operativa_regione: v, 
                            sede_operativa_provincia: "",
                            sede_operativa: ""
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona regione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONI_E_PROVINCE.map(r => <SelectItem key={r.nome} value={r.nome}>{r.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Provincia Sede Operativa</Label>
                        <Select
                          value={formData.sede_operativa_provincia}
                          onValueChange={(v) => {
                            const prov = getProvinceByRegione(formData.sede_operativa_regione).find(p => p.nome === v);
                            if (prov) {
                              const codice = buildProvinciaCodice(formData.sede_operativa_regione, prov.nome, prov.sigla);
                              setFormData(p => ({
                                ...p, 
                                sede_operativa_provincia: v, 
                                sede_operativa: codice
                              }));
                            }
                          }}
                          disabled={!formData.sede_operativa_regione}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona provincia..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getProvinceByRegione(formData.sede_operativa_regione).map(p => (
                              <SelectItem key={p.nome} value={p.nome}>{p.nome} ({p.sigla})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.sede_operativa && (
                        <Badge variant="secondary" className="text-xs col-span-2 w-fit">
                          Sede operativa: {formData.sede_operativa}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Interessi */}
              <div>
                <SectionHeader icon={Target} title="Interessi (per matching bandi e formazione)" color="#10b981" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Investimenti di Interesse</Label>
                    <MultiSelect
                      options={INVESTIMENTI_OPTIONS}
                      selected={formData.investimenti_interesse}
                      onChange={(v) => setFormData(p => ({ ...p, investimenti_interesse: v }))}
                      placeholder="Seleziona investimenti..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Spese di Interesse</Label>
                    <MultiSelect
                      options={SPESE_OPTIONS}
                      selected={formData.spese_interesse}
                      onChange={(v) => setFormData(p => ({ ...p, spese_interesse: v }))}
                      placeholder="Seleziona spese..."
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Badge Formativi (corsi di interesse)</Label>
                    
                    {/* AI Suggestions */}
                    <BadgeSuggestionsAI
                      codiciAteco={formData.codici_ateco}
                      descrizioneAttivita={formData.descrizione_attivita}
                      dimensioneAzienda={formData.dimensione_azienda}
                      badgeDisponibili={badgeFormativi.map(b => ({
                        nome: b.nome,
                        descrizione: b.descrizione,
                        categoria: b.categoria_id
                      }))}
                      selectedBadges={formData.badge_formativi}
                      onBadgesChange={(v) => setFormData(p => ({ ...p, badge_formativi: v }))}
                      autoFetch={triggerBadgeAI}
                      onAutoFetchComplete={() => setTriggerBadgeAI(false)}
                    />
                    
                    {/* Manual selection */}
                    <MultiSelect
                      options={badgeOptions}
                      selected={formData.badge_formativi}
                      onChange={(v) => setFormData(p => ({ ...p, badge_formativi: v }))}
                      placeholder="Seleziona formazioni di interesse..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Puoi sempre modificare la selezione manualmente
                    </p>
                  </div>
                </div>
              </div>

              {/* Assegnazione collaboratore */}
              {(userRole === 'gestore' || userRole === 'admin') && collaboratori.length > 0 && (
                <div>
                  <SectionHeader icon={Users} title="Assegnazione" color="#6366f1" />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assegna a Collaboratore</Label>
                    <Select
                      value={formData.collaboratore_id}
                      onValueChange={(v) => setFormData(p => ({ ...p, collaboratore_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nessuno (gestito direttamente)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nessuno</SelectItem>
                        {collaboratori.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} {c.cognome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={loading} size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Crea Azienda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
