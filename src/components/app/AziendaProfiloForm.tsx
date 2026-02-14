import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { HersCard } from './HersCard';
import { HersBadge } from './HersBadge';
import { HersButton } from './HersButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AtecoSelector } from '@/components/AtecoSelector';
import { REGIONI_E_PROVINCE } from '@/data/regioni-province';
import { useInvestimentiOptions } from '@/hooks/useInvestimentiOptions';
import { useSpeseOptions } from '@/hooks/useSpeseOptions';
import { 
  Search, 
  FileText, 
  Edit3, 
  Building2, 
  MapPin, 
  Users, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Sparkles,
  Target,
  Receipt,
  X
} from 'lucide-react';

interface AziendaProfiloFormProps {
  aziendaId: string;
  initialData?: any;
  onSave?: () => void;
}

// Tipologie di soggetto (selezione singola)
const DIMENSIONI_AZIENDA = [
  { value: 'Professionista', description: 'Attività professionale individuale o associata' },
  { value: 'Micro impresa', description: '(meno di 10 addetti)' },
  { value: 'PMI', description: '(meno di 250 addetti)' },
  { value: 'Grande impresa', description: '(250+ addetti)' }
];

// Qualifiche/condizioni opzionali
const QUALIFICHE_AZIENDA_OPTIONS = [
  'Startup / Impresa innovativa',
  'Impresa in rete / Aggregazione',
  'Ditta individuale'
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

export function AziendaProfiloForm({ aziendaId, initialData, onSave }: AziendaProfiloFormProps) {
  const [activeTab, setActiveTab] = useState<string>('manuale');
  const [loading, setLoading] = useState(false);
  const [searchingPiva, setSearchingPiva] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // Hooks per opzioni dinamiche
  const { options: investimentiOptions } = useInvestimentiOptions();
  const { options: speseOptions } = useSpeseOptions();
  
  // Form fields
  const [partitaIva, setPartitaIva] = useState(initialData?.partita_iva || '');
  const [ragioneSociale, setRagioneSociale] = useState(initialData?.ragione_sociale || '');
  const [codiceFiscale, setCodiceFiscale] = useState(initialData?.codice_fiscale || '');
  const [pec, setPec] = useState(initialData?.pec || '');
  const [codiciAteco, setCodiciAteco] = useState<string[]>(initialData?.codici_ateco || []);
  const [regione, setRegione] = useState(initialData?.regione || '');
  const [provincia, setProvincia] = useState('');
  const [sedeOperativa, setSedeOperativa] = useState(initialData?.sede_operativa || '');
  const [dimensioneAzienda, setDimensioneAzienda] = useState(initialData?.dimensione_azienda || '');
  const [numeroDipendenti, setNumeroDipendenti] = useState(initialData?.numero_dipendenti || '');
  const [costituzioneSocieta, setCostituzioneSocieta] = useState(initialData?.costituzione_societa || '');
  const [descrizioneAttivita, setDescrizioneAttivita] = useState(initialData?.descrizione_attivita || '');
  
  // Campi per matching bandi
  const [investimentiInteresse, setInvestimentiInteresse] = useState<string[]>(initialData?.investimenti_interesse || []);
  const [speseInteresse, setSpeseInteresse] = useState<string[]>(initialData?.spese_interesse || []);

  // Province filtrate per regione selezionata
  const provincePerRegione = useMemo(() => {
    if (!regione) return [];
    const r = REGIONI_E_PROVINCE.find(r => r.nome === regione);
    return r?.province || [];
  }, [regione]);

  // Extract provincia from sede_operativa if available
  useEffect(() => {
    if (initialData?.sede_operativa) {
      // Try to extract provincia from sede_operativa format "Comune (XX)"
      const match = initialData.sede_operativa.match(/\(([A-Z]{2})\)/);
      if (match) {
        const sigla = match[1];
        // Find the provincia
        for (const reg of REGIONI_E_PROVINCE) {
          const prov = reg.province.find(p => p.sigla === sigla);
          if (prov) {
            setProvincia(prov.nome);
            if (!regione) setRegione(reg.nome);
            break;
          }
        }
      }
    }
  }, [initialData]);

  // Calcolo completezza profilo
  const completeness = useMemo(() => {
    const fields = [
      { name: 'Partita IVA', value: partitaIva, weight: 10, required: true },
      { name: 'Ragione Sociale', value: ragioneSociale, weight: 10, required: true },
      { name: 'Codici ATECO', value: codiciAteco.length > 0, weight: 15, required: true },
      { name: 'Regione', value: regione, weight: 10, required: true },
      { name: 'Provincia', value: provincia, weight: 10, required: true },
      { name: 'Dimensione', value: dimensioneAzienda, weight: 10, required: false },
      { name: 'Dipendenti', value: numeroDipendenti, weight: 10, required: false },
      { name: 'Costituzione', value: costituzioneSocieta, weight: 5, required: false },
      { name: 'Investimenti', value: investimentiInteresse.length > 0, weight: 10, required: false },
      { name: 'Spese', value: speseInteresse.length > 0, weight: 10, required: false }
    ];
    
    let totalWeight = 0;
    let completedWeight = 0;
    const missing: string[] = [];
    
    fields.forEach(f => {
      totalWeight += f.weight;
      if (f.value) {
        completedWeight += f.weight;
      } else if (f.required) {
        missing.push(f.name);
      }
    });
    
    return {
      percentage: Math.round((completedWeight / totalWeight) * 100),
      missing,
      isComplete: missing.length === 0
    };
  }, [partitaIva, ragioneSociale, codiciAteco, regione, provincia, dimensioneAzienda, numeroDipendenti, costituzioneSocieta, investimentiInteresse, speseInteresse]);

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
        
        // Pre-compila i campi
        if (d.ragione_sociale) setRagioneSociale(d.ragione_sociale);
        if (d.codice_fiscale) setCodiceFiscale(d.codice_fiscale);
        if (d.pec) setPec(d.pec);
        if (d.regione) setRegione(d.regione);
        if (d.provincia) setProvincia(d.provincia);
        if (d.sede_legale) setSedeOperativa(d.sede_legale);
        if (d.dimensione_azienda) setDimensioneAzienda(d.dimensione_azienda);
        if (d.numero_dipendenti) setNumeroDipendenti(d.numero_dipendenti);
        
        // ATECO codes
        if (d.codici_ateco && d.codici_ateco.length > 0) {
          setCodiciAteco(d.codici_ateco.map((a: any) => a.codice || a));
        } else if (d.codice_ateco) {
          setCodiciAteco([d.codice_ateco]);
        }
        
        toast.success('Dati azienda trovati e compilati!');
      } else {
        toast.error(data?.error || 'Nessun dato trovato per questa P.IVA');
      }
    } catch (error: any) {
      console.error('Errore ricerca P.IVA:', error);
      toast.error('Errore nella ricerca. Riprova.');
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
      // Convert to base64
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
        // Pre-compila i campi estratti
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
    } catch (error: any) {
      console.error('Errore parsing visura:', error);
      toast.error('Errore nell\'elaborazione del PDF');
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  // Salvataggio dati
  const handleSave = async () => {
    if (!partitaIva || !ragioneSociale) {
      toast.error('P.IVA e Ragione Sociale sono obbligatori');
      return;
    }
    
    if (codiciAteco.length === 0) {
      toast.error('Seleziona almeno un codice ATECO');
      return;
    }
    
    if (!regione || !provincia) {
      toast.error('Regione e Provincia sono obbligatorie');
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
        codice_ateco: codiciAteco[0] || null, // Primary ATECO for backward compatibility
        regione,
        sede_operativa: provincia ? `${sedeOperativa || provincia} (${provincePerRegione.find(p => p.nome === provincia)?.sigla || ''})` : sedeOperativa,
        dimensione_azienda: dimensioneAzienda || null,
        numero_dipendenti: numeroDipendenti || null,
        costituzione_societa: costituzioneSocieta || null,
        descrizione_attivita: descrizioneAttivita || null,
        investimenti_interesse: investimentiInteresse.length > 0 ? investimentiInteresse : null,
        spese_interesse: speseInteresse.length > 0 ? speseInteresse : null
      };
      
      const { error } = await supabase
        .from('aziende')
        .update(updateData)
        .eq('id', aziendaId);
      
      if (error) throw error;
      
      toast.success('Dati azienda salvati con successo!');
      onSave?.();
    } catch (error: any) {
      console.error('Errore salvataggio:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <HersCard className="!p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Completezza profilo per matching
          </span>
          <span className={`text-sm font-bold ${completeness.isComplete ? 'text-success' : 'text-warning'}`}>
            {completeness.percentage}%
          </span>
        </div>
        <Progress value={completeness.percentage} className="h-2" />
        {!completeness.isComplete && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3 text-warning" />
            <span>Mancano: {completeness.missing.join(', ')}</span>
          </div>
        )}
        {completeness.isComplete && (
          <div className="mt-2 flex items-center gap-2 text-xs text-success">
            <CheckCircle2 className="w-3 h-3" />
            <span>Profilo completo per il matching!</span>
          </div>
        )}
      </HersCard>

      {/* Tabs per le 3 modalità */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-muted rounded-2xl">
          <TabsTrigger 
            value="api" 
            className="flex flex-col items-center gap-1 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span className="text-xs">Cerca P.IVA</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai" 
            className="flex flex-col items-center gap-1 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">Carica PDF</span>
          </TabsTrigger>
          <TabsTrigger 
            value="manuale" 
            className="flex flex-col items-center gap-1 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-xs">Manuale</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Ricerca API */}
        <TabsContent value="api" className="mt-4">
          <HersCard className="!p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ricerca automatica</p>
                <p className="text-xs text-muted-foreground">
                  Inserisci la P.IVA per compilare automaticamente i dati aziendali
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={partitaIva}
                onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="Es. 12345678901"
                className="rounded-xl flex-1"
                maxLength={11}
              />
              <HersButton 
                onClick={handleSearchPiva} 
                disabled={searchingPiva || partitaIva.length !== 11}
                className="flex-shrink-0"
              >
                {searchingPiva ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Cerca'
                )}
              </HersButton>
            </div>
          </HersCard>
        </TabsContent>

        {/* Tab Upload PDF */}
        <TabsContent value="ai" className="mt-4">
          <HersCard className="!p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Estrazione AI da Visura</p>
                <p className="text-xs text-muted-foreground">
                  Carica la Visura Camerale PDF e l'AI estrarrà automaticamente i dati
                </p>
              </div>
            </div>
            <label className="block">
              <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors
                ${uploadingPdf ? 'bg-muted border-muted-foreground/20' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
              >
                {uploadingPdf ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Elaborazione in corso...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Carica Visura PDF</p>
                    <p className="text-xs text-muted-foreground">Tocca per selezionare il file</p>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleUploadVisura}
                className="hidden"
                disabled={uploadingPdf}
              />
            </label>
          </HersCard>
        </TabsContent>

        {/* Tab Manuale - sempre visibile sotto */}
        <TabsContent value="manuale" className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Compila manualmente tutti i campi necessari per il matching con i bandi.
          </p>
        </TabsContent>
      </Tabs>

      {/* Form sempre visibile */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Dati Azienda</h3>
        </div>

        {/* P.IVA e Ragione Sociale */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Partita IVA *</Label>
            <Input
              value={partitaIva}
              onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="11 cifre"
              className="rounded-xl"
              maxLength={11}
            />
          </div>
          
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
        </div>
      </HersCard>

      {/* ATECO */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">Settori ATECO *</h3>
          </div>
          {codiciAteco.length > 0 && (
            <HersBadge variant="mint">{codiciAteco.length} selezionati</HersBadge>
          )}
        </div>
        
        <AtecoSelector
          selected={codiciAteco}
          onChange={setCodiciAteco}
          className="w-full"
        />
        
        {codiciAteco.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {codiciAteco.slice(0, 5).map((cod, idx) => (
              <HersBadge key={idx} variant="gray" className="text-xs">{cod}</HersBadge>
            ))}
            {codiciAteco.length > 5 && (
              <HersBadge variant="gray" className="text-xs">+{codiciAteco.length - 5}</HersBadge>
            )}
          </div>
        )}
      </HersCard>

      {/* Sede */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Sede Legale *</h3>
        </div>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Regione *</Label>
            <Select value={regione} onValueChange={(v) => {
              setRegione(v);
              setProvincia(''); // Reset provincia when region changes
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
            <Label className="text-xs text-muted-foreground">Indirizzo sede operativa</Label>
            <Input
              value={sedeOperativa}
              onChange={(e) => setSedeOperativa(e.target.value)}
              placeholder="Via/Piazza, Civico, CAP, Città"
              className="rounded-xl"
            />
          </div>
        </div>
      </HersCard>

      {/* Dimensione e Dipendenti */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Dimensione Azienda</h3>
        </div>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipologia di soggetto</Label>
            <Select value={dimensioneAzienda} onValueChange={setDimensioneAzienda}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Seleziona tipologia" />
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONI_AZIENDA.map(d => (
                  <SelectItem key={d.value} value={d.value}>
                    <div className="flex flex-col">
                      <span>{d.value}</span>
                      <span className="text-xs text-muted-foreground">{d.description}</span>
                    </div>
                  </SelectItem>
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
        </div>
      </HersCard>

      {/* Qualifiche/Condizioni */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Qualifiche / Condizioni</h3>
          <span className="text-xs text-muted-foreground">(opzionale)</span>
        </div>
        
        <div className="space-y-3">
          {QUALIFICHE_AZIENDA_OPTIONS.map(qualifica => (
            <label 
              key={qualifica}
              className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 cursor-pointer hover:border-primary/50 transition-all"
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => {}}
              />
              <span className="text-sm">{qualifica}</span>
            </label>
          ))}
        </div>
      </HersCard>

      {/* Costituzione */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent-foreground" />
          <h3 className="font-semibold text-foreground">Anzianità Azienda</h3>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Costituita da</Label>
          <Select value={costituzioneSocieta} onValueChange={setCostituzioneSocieta}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Seleziona periodo" />
            </SelectTrigger>
            <SelectContent>
              {COSTITUZIONE_OPTIONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Descrizione attività (opzionale)</Label>
          <Textarea
            value={descrizioneAttivita}
            onChange={(e) => setDescrizioneAttivita(e.target.value)}
            placeholder="Breve descrizione dell'attività aziendale..."
            className="rounded-xl min-h-[80px]"
          />
        </div>
      </HersCard>

      {/* Interessi Investimenti - per matching bandi */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">Investimenti di Interesse</h3>
          </div>
          {investimentiInteresse.length > 0 && (
            <HersBadge variant="mint">{investimentiInteresse.length} selezionati</HersBadge>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Seleziona gli investimenti che vorresti fare per trovare bandi compatibili
        </p>

        {/* Chips selezionati */}
        {investimentiInteresse.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {investimentiInteresse.map((inv) => (
              <div
                key={inv}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-medium"
              >
                <span>{inv}</span>
                <button
                  type="button"
                  onClick={() => setInvestimentiInteresse(prev => prev.filter(i => i !== inv))}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lista opzioni */}
        <div className="grid gap-2 max-h-[200px] overflow-y-auto">
          {investimentiOptions.map((opt) => {
            const isSelected = investimentiInteresse.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
                  isSelected 
                    ? 'bg-success/10 border-success/30' 
                    : 'bg-muted/30 border-transparent hover:bg-muted/50'
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
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            );
          })}
        </div>
      </HersCard>

      {/* Spese di Interesse - per matching bandi */}
      <HersCard className="!p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">Spese da Sostenere</h3>
          </div>
          {speseInteresse.length > 0 && (
            <HersBadge variant="yellow">{speseInteresse.length} selezionate</HersBadge>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Indica le tipologie di spese che prevedi di sostenere
        </p>

        {/* Chips selezionati */}
        {speseInteresse.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {speseInteresse.map((spesa) => (
              <div
                key={spesa}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-warning/10 text-warning rounded-full text-xs font-medium"
              >
                <span>{spesa}</span>
                <button
                  type="button"
                  onClick={() => setSpeseInteresse(prev => prev.filter(s => s !== spesa))}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lista opzioni */}
        <div className="grid gap-2 max-h-[200px] overflow-y-auto">
          {speseOptions.map((opt) => {
            const isSelected = speseInteresse.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
                  isSelected 
                    ? 'bg-warning/10 border-warning/30' 
                    : 'bg-muted/30 border-transparent hover:bg-muted/50'
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
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            );
          })}
        </div>
      </HersCard>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-4 pt-4"
      >
        <HersButton 
          onClick={handleSave} 
          disabled={loading}
          fullWidth
          className="shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Salva Dati Azienda
            </>
          )}
        </HersButton>
      </motion.div>
    </div>
  );
}
