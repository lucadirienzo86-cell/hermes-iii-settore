import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HersCard } from '@/components/app/HersCard';
import { HersBadge } from '@/components/app/HersBadge';
import { HersButton } from '@/components/app/HersButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { AtecoSelector } from '@/components/AtecoSelector';
import { REGIONI_E_PROVINCE } from '@/data/regioni-province';
import { useInvestimentiOptions } from '@/hooks/useInvestimentiOptions';
import { useSpeseOptions } from '@/hooks/useSpeseOptions';
import { toast } from 'sonner';
import { 
  Building2, 
  MapPin, 
  Users, 
  Target,
  Receipt,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Search,
  Upload,
  FileText,
  X,
  Rocket
} from 'lucide-react';

const DIMENSIONI_AZIENDA = [
  'Startup innovativa',
  'Microimpresa',
  'Piccola impresa',
  'Media impresa',
  'Grande impresa'
];

const NUMERO_DIPENDENTI_OPTIONS = [
  '0',
  '1/3',
  '4/9',
  '10/19',
  '20/49',
  '50/99',
  '100/249',
  '250/499',
  '500+'
];

const COSTITUZIONE_OPTIONS = [
  'Fino a 12 mesi',
  'Da 12 a 24 mesi',
  'Da 24 a 36 mesi',
  'Da 36 a 60 mesi',
  'Oltre 60 mesi'
];

const STEPS = [
  { id: 'welcome', title: 'Benvenuto', icon: Rocket },
  { id: 'company', title: 'Dati Azienda', icon: Building2 },
  { id: 'location', title: 'Sede', icon: MapPin },
  { id: 'size', title: 'Dimensione', icon: Users },
  { id: 'interests', title: 'Interessi', icon: Target },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchingPiva, setSearchingPiva] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [aziendaId, setAziendaId] = useState<string | null>(null);

  // Hooks per opzioni dinamiche
  const { options: investimentiOptions } = useInvestimentiOptions();
  const { options: speseOptions } = useSpeseOptions();

  // Form fields
  const [partitaIva, setPartitaIva] = useState('');
  const [ragioneSociale, setRagioneSociale] = useState('');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [pec, setPec] = useState('');
  const [codiciAteco, setCodiciAteco] = useState<string[]>([]);
  const [regione, setRegione] = useState('');
  const [provincia, setProvincia] = useState('');
  const [sedeOperativa, setSedeOperativa] = useState('');
  const [dimensioneAzienda, setDimensioneAzienda] = useState('');
  const [numeroDipendenti, setNumeroDipendenti] = useState('');
  const [costituzioneSocieta, setCostituzioneSocieta] = useState('');
  const [investimentiInteresse, setInvestimentiInteresse] = useState<string[]>([]);
  const [speseInteresse, setSpeseInteresse] = useState<string[]>([]);

  // Province filtrate per regione selezionata
  const provincePerRegione = useMemo(() => {
    if (!regione) return [];
    const r = REGIONI_E_PROVINCE.find(r => r.nome === regione);
    return r?.province || [];
  }, [regione]);

  // Carica dati azienda esistente
  useEffect(() => {
    const loadAziendaData = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('aziende')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (data) {
        setAziendaId(data.id);
        // Se l'azienda ha già dati completi, redirect alla dashboard
        if (data.partita_iva && data.partita_iva !== 'DA_COMPLETARE' && 
            data.ragione_sociale !== 'Da completare' &&
            data.codici_ateco && data.codici_ateco.length > 0 &&
            data.regione) {
          navigate('/app/dashboard');
          return;
        }
        // Pre-popola i campi
        if (data.partita_iva && data.partita_iva !== 'DA_COMPLETARE') setPartitaIva(data.partita_iva);
        if (data.ragione_sociale && data.ragione_sociale !== 'Da completare') setRagioneSociale(data.ragione_sociale);
        if (data.codice_fiscale) setCodiceFiscale(data.codice_fiscale);
        if (data.pec) setPec(data.pec);
        if (data.codici_ateco) setCodiciAteco(data.codici_ateco);
        if (data.regione) setRegione(data.regione);
        if (data.sede_operativa) setSedeOperativa(data.sede_operativa);
        if (data.dimensione_azienda) setDimensioneAzienda(data.dimensione_azienda);
        if (data.numero_dipendenti) setNumeroDipendenti(data.numero_dipendenti);
        if (data.costituzione_societa) setCostituzioneSocieta(data.costituzione_societa);
        if (data.investimenti_interesse) setInvestimentiInteresse(data.investimenti_interesse);
        if (data.spese_interesse) setSpeseInteresse(data.spese_interesse);
      }
    };

    loadAziendaData();
  }, [user?.id, navigate]);

  // Calcolo completezza
  const completeness = useMemo(() => {
    let filled = 0;
    let total = 5;
    
    if (partitaIva && ragioneSociale) filled++;
    if (codiciAteco.length > 0) filled++;
    if (regione && provincia) filled++;
    if (dimensioneAzienda || numeroDipendenti) filled++;
    if (investimentiInteresse.length > 0 || speseInteresse.length > 0) filled++;
    
    return Math.round((filled / total) * 100);
  }, [partitaIva, ragioneSociale, codiciAteco, regione, provincia, dimensioneAzienda, numeroDipendenti, investimentiInteresse, speseInteresse]);

  // Ricerca P.IVA tramite API
  const handleSearchPiva = async () => {
    if (!partitaIva || partitaIva.length !== 11) {
      toast.error('Inserisci una P.IVA valida (11 cifre)');
      return;
    }
    
    setSearchingPiva(true);
    try {
      const { data, error } = await supabase.functions.invoke('openapi-search', {
        body: { partita_iva: partitaIva }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        const d = data.data;
        if (d.ragione_sociale) setRagioneSociale(d.ragione_sociale);
        if (d.codice_fiscale) setCodiceFiscale(d.codice_fiscale);
        if (d.pec) setPec(d.pec);
        if (d.regione) setRegione(d.regione);
        if (d.provincia) setProvincia(d.provincia);
        if (d.sede_legale) setSedeOperativa(d.sede_legale);
        if (d.dimensione_azienda) setDimensioneAzienda(d.dimensione_azienda);
        if (d.numero_dipendenti) setNumeroDipendenti(d.numero_dipendenti);
        if (d.codici_ateco && d.codici_ateco.length > 0) {
          setCodiciAteco(d.codici_ateco.map((a: any) => a.codice || a));
        } else if (d.codice_ateco) {
          setCodiciAteco([d.codice_ateco]);
        }
        toast.success('Dati azienda trovati!');
      } else {
        toast.error(data?.error || 'Nessun dato trovato');
      }
    } catch (error) {
      console.error('Errore ricerca P.IVA:', error);
      toast.error('Errore nella ricerca');
    } finally {
      setSearchingPiva(false);
    }
  };

  // Upload e parsing Visura PDF
  const handleUploadVisura = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Carica un file PDF');
      return;
    }
    
    setUploadingPdf(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const { data, error } = await supabase.functions.invoke('parse-visura-pdf', {
        body: { pdf_base64: base64 }
      });
      
      if (error) throw error;
      
      if (data) {
        if (data.partita_iva) setPartitaIva(data.partita_iva);
        if (data.ragione_sociale) setRagioneSociale(data.ragione_sociale);
        if (data.codice_fiscale) setCodiceFiscale(data.codice_fiscale);
        if (data.pec) setPec(data.pec);
        if (data.regione) setRegione(data.regione);
        if (data.provincia) setProvincia(data.provincia);
        if (data.sede_legale) setSedeOperativa(data.sede_legale);
        if (data.codice_ateco) {
          setCodiciAteco(Array.isArray(data.codice_ateco) ? data.codice_ateco : [data.codice_ateco]);
        }
        toast.success('Dati estratti dalla visura!');
      }
    } catch (error) {
      console.error('Errore parsing visura:', error);
      toast.error('Errore nell\'elaborazione');
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  // Validazione step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Dati Azienda
        return partitaIva.length === 11 && ragioneSociale.length > 0 && codiciAteco.length > 0;
      case 2: // Sede
        return regione.length > 0 && provincia.length > 0;
      case 3: // Dimensione
        return true; // Opzionale
      case 4: // Interessi
        return true; // Opzionale
      default:
        return true;
    }
  }, [currentStep, partitaIva, ragioneSociale, codiciAteco, regione, provincia]);

  // Salva e completa
  const handleComplete = async () => {
    if (!aziendaId) {
      toast.error('Errore: ID azienda non trovato');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        partita_iva: partitaIva,
        ragione_sociale: ragioneSociale,
        codice_fiscale: codiceFiscale || null,
        pec: pec || null,
        codici_ateco: codiciAteco,
        codice_ateco: codiciAteco[0] || null,
        regione,
        sede_operativa: provincia ? `${sedeOperativa || provincia} (${provincePerRegione.find(p => p.nome === provincia)?.sigla || ''})` : sedeOperativa,
        dimensione_azienda: dimensioneAzienda || null,
        numero_dipendenti: numeroDipendenti || null,
        costituzione_societa: costituzioneSocieta || null,
        investimenti_interesse: investimentiInteresse.length > 0 ? investimentiInteresse : null,
        spese_interesse: speseInteresse.length > 0 ? speseInteresse : null
      };

      const { error } = await supabase
        .from('aziende')
        .update(updateData)
        .eq('id', aziendaId);

      if (error) throw error;

      toast.success('Profilo completato!');
      navigate('/app/dashboard');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipOnboarding = () => {
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <span className="text-2xl font-bold text-primary-foreground">Sonyc</span>
        <button
          onClick={skipOnboarding}
          className="text-primary-foreground/70 text-sm hover:text-primary-foreground"
        >
          Salta
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 bg-card border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} di {STEPS.length}
          </span>
          <span className="text-xs font-medium text-primary">
            {completeness}% completato
          </span>
        </div>
        <Progress value={(currentStep + 1) / STEPS.length * 100} className="h-1.5" />
        
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-primary text-primary-foreground' : 
                  isCompleted ? 'bg-success text-success-foreground' : 
                  'bg-muted'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-medium hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="text-center py-8 space-y-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
                >
                  <Rocket className="w-12 h-12 text-primary" />
                </motion.div>
                
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    Benvenuto in Sonyc! 🎉
                  </h1>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Completa il profilo della tua azienda per trovare i bandi e i finanziamenti più adatti a te.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <HersCard className="!p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Search className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Ricerca automatica</p>
                        <p className="text-xs text-muted-foreground">Inserisci la P.IVA e compiliamo noi</p>
                      </div>
                    </div>
                  </HersCard>
                  
                  <HersCard className="!p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Carica la Visura</p>
                        <p className="text-xs text-muted-foreground">L'AI estrae i dati automaticamente</p>
                      </div>
                    </div>
                  </HersCard>
                </div>
              </div>
            )}

            {/* Step 1: Dati Azienda */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <h2 className="text-xl font-bold text-foreground">Dati Azienda</h2>
                  <p className="text-sm text-muted-foreground">Inserisci i dati principali</p>
                </div>

                {/* Quick fill options */}
                <div className="grid grid-cols-2 gap-3">
                  <HersCard className="!p-3">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-5 h-5 text-primary" />
                      <Input
                        value={partitaIva}
                        onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        placeholder="P.IVA (11 cifre)"
                        className="rounded-xl text-center text-sm"
                        maxLength={11}
                      />
                      <HersButton 
                        onClick={handleSearchPiva}
                        disabled={searchingPiva || partitaIva.length !== 11}
                        className="w-full text-sm"
                      >
                        {searchingPiva ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cerca'}
                      </HersButton>
                    </div>
                  </HersCard>

                  <HersCard className="!p-3">
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <div className="text-center">
                        <p className="text-xs font-medium">Carica Visura PDF</p>
                        {uploadingPdf && <Loader2 className="w-4 h-4 animate-spin mx-auto mt-1" />}
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleUploadVisura}
                        className="hidden"
                        disabled={uploadingPdf}
                      />
                      <HersButton className="w-full text-sm" variant="secondary">
                        <Upload className="w-3 h-3 mr-1" />
                        Carica
                      </HersButton>
                    </label>
                  </HersCard>
                </div>

                {/* Form fields */}
                <HersCard className="!p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Ragione Sociale *</Label>
                    <Input
                      value={ragioneSociale}
                      onChange={(e) => setRagioneSociale(e.target.value)}
                      placeholder="Nome azienda"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Codice Fiscale</Label>
                      <Input
                        value={codiceFiscale}
                        onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                        placeholder="Opzionale"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">PEC</Label>
                      <Input
                        value={pec}
                        onChange={(e) => setPec(e.target.value.toLowerCase())}
                        placeholder="email@pec.it"
                        className="rounded-xl"
                        type="email"
                      />
                    </div>
                  </div>
                </HersCard>

                {/* ATECO */}
                <HersCard className="!p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-success" />
                      <span className="font-medium text-sm">Settori ATECO *</span>
                    </div>
                    {codiciAteco.length > 0 && (
                      <HersBadge variant="mint">{codiciAteco.length}</HersBadge>
                    )}
                  </div>
                  <AtecoSelector
                    selected={codiciAteco}
                    onChange={setCodiciAteco}
                    className="w-full"
                  />
                  {codiciAteco.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {codiciAteco.slice(0, 3).map((cod, idx) => (
                        <HersBadge key={idx} variant="gray" className="text-xs">{cod}</HersBadge>
                      ))}
                      {codiciAteco.length > 3 && (
                        <HersBadge variant="gray" className="text-xs">+{codiciAteco.length - 3}</HersBadge>
                      )}
                    </div>
                  )}
                </HersCard>
              </div>
            )}

            {/* Step 2: Sede */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <h2 className="text-xl font-bold text-foreground">Sede Legale</h2>
                  <p className="text-sm text-muted-foreground">Dove si trova la tua azienda?</p>
                </div>

                <HersCard className="!p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Regione *</Label>
                    <Select value={regione} onValueChange={(v) => {
                      setRegione(v);
                      setProvincia('');
                    }}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleziona regione" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONI_E_PROVINCE.map(r => (
                          <SelectItem key={r.nome} value={r.nome}>{r.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Provincia *</Label>
                    <Select value={provincia} onValueChange={setProvincia} disabled={!regione}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={regione ? "Seleziona provincia" : "Prima seleziona la regione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {provincePerRegione.map(p => (
                          <SelectItem key={p.sigla} value={p.nome}>{p.nome} ({p.sigla})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Indirizzo (opzionale)</Label>
                    <Input
                      value={sedeOperativa}
                      onChange={(e) => setSedeOperativa(e.target.value)}
                      placeholder="Via/Piazza, Civico, CAP, Città"
                      className="rounded-xl"
                    />
                  </div>
                </HersCard>
              </div>
            )}

            {/* Step 3: Dimensione */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <h2 className="text-xl font-bold text-foreground">Dimensione Azienda</h2>
                  <p className="text-sm text-muted-foreground">Aiutaci a trovare bandi adatti</p>
                </div>

                <HersCard className="!p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipologia azienda</Label>
                    <Select value={dimensioneAzienda} onValueChange={setDimensioneAzienda}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleziona tipologia" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIMENSIONI_AZIENDA.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Numero dipendenti</Label>
                    <Select value={numeroDipendenti} onValueChange={setNumeroDipendenti}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleziona range" />
                      </SelectTrigger>
                      <SelectContent>
                        {NUMERO_DIPENDENTI_OPTIONS.map(n => (
                          <SelectItem key={n} value={n}>{n} dipendenti</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Anzianità azienda</Label>
                    <Select value={costituzioneSocieta} onValueChange={setCostituzioneSocieta}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Costituita da..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COSTITUZIONE_OPTIONS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </HersCard>
              </div>
            )}

            {/* Step 4: Interessi */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <h2 className="text-xl font-bold text-foreground">I Tuoi Interessi</h2>
                  <p className="text-sm text-muted-foreground">Cosa ti interessa finanziare?</p>
                </div>

                {/* Investimenti */}
                <HersCard className="!p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-success" />
                      <span className="font-medium text-sm">Investimenti</span>
                    </div>
                    {investimentiInteresse.length > 0 && (
                      <HersBadge variant="mint">{investimentiInteresse.length}</HersBadge>
                    )}
                  </div>
                  
                  {investimentiInteresse.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {investimentiInteresse.map((inv) => (
                        <div
                          key={inv}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs"
                        >
                          <span className="truncate max-w-[120px]">{inv}</span>
                          <button onClick={() => setInvestimentiInteresse(prev => prev.filter(i => i !== inv))}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-1.5 max-h-[120px] overflow-y-auto">
                    {investimentiOptions.map((opt) => {
                      const isSelected = investimentiInteresse.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${
                            isSelected ? 'bg-success/10' : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setInvestimentiInteresse(prev => [...prev, opt]);
                              } else {
                                setInvestimentiInteresse(prev => prev.filter(i => i !== opt));
                              }
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </HersCard>

                {/* Spese */}
                <HersCard className="!p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-warning" />
                      <span className="font-medium text-sm">Spese da sostenere</span>
                    </div>
                    {speseInteresse.length > 0 && (
                      <HersBadge variant="yellow">{speseInteresse.length}</HersBadge>
                    )}
                  </div>

                  {speseInteresse.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {speseInteresse.map((spesa) => (
                        <div
                          key={spesa}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-full text-xs"
                        >
                          <span className="truncate max-w-[120px]">{spesa}</span>
                          <button onClick={() => setSpeseInteresse(prev => prev.filter(s => s !== spesa))}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-1.5 max-h-[120px] overflow-y-auto">
                    {speseOptions.map((opt) => {
                      const isSelected = speseInteresse.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${
                            isSelected ? 'bg-warning/10' : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSpeseInteresse(prev => [...prev, opt]);
                              } else {
                                setSpeseInteresse(prev => prev.filter(s => s !== opt));
                              }
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </HersCard>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="p-4 bg-card border-t flex gap-3">
        {currentStep > 0 && (
          <HersButton
            variant="secondary"
            onClick={prevStep}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </HersButton>
        )}
        
        <HersButton
          onClick={nextStep}
          disabled={!canProceed || loading}
          fullWidth
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : currentStep === STEPS.length - 1 ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completa
            </>
          ) : (
            <>
              Continua
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </HersButton>
      </div>
    </div>
  );
}
