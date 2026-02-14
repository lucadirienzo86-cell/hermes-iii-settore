import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, CheckCircle2, XCircle, Loader2, FileText, Euro, Save, Database, Download, FileSpreadsheet, Filter, X, Clock, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { subYears, parseISO, isBefore, format, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";

// Array di fonti configurabili
const DATABASE_SOURCES = [
  {
    id: 'fondimpresa',
    name: 'Fondimpresa',
    description: 'Fondo interprofessionale - Database locale',
    checkFunction: 'local', // Indica ricerca locale
    responseField: 'fondimpresa',
    icon: Database,
  },
  {
    id: 'fondoforte',
    name: 'Fondo Forte',
    description: 'Fondo paritetico interprofessionale nazionale',
    checkFunction: 'rna-check',
    responseField: 'fondoforte',
    icon: Building2,
  },
  {
    id: 'rna',
    name: 'Aiuti di Stato (RNA)',
    description: 'Registro Nazionale Aiuti di Stato',
    checkFunction: 'rna-check',
    responseField: 'rna',
    icon: FileText,
  },
];

interface FondoDataItem {
  found: boolean;
  denominazione?: string;
  annoAdesione?: number;
  dataAdesione?: string;
  stato?: string;
  regione?: string;
  provincia?: string;
}

interface AiutoItem {
  autoritaConcedente?: string;
  titoloMisura?: string;
  importoAgevolazione?: number | null;
  dataConcessione?: string;
  tipologia?: string;
  titoloProgetto?: string;
  strumento?: string;
  // Nuovi campi
  codiceCar?: string;
  codiceCe?: string;
  tipoMisura?: string;
  cor?: string;
  regione?: string;
  denominazioneBeneficiario?: string;
}

interface RnaDataItem {
  found: boolean;
  aiuti?: AiutoItem[];
  numeroAiuti?: number;
  numeroAiutiDeminimis?: number;
  aiutiDeminimis?: AiutoItem[];
}

interface SourceResult {
  found: boolean;
  data?: FondoDataItem | RnaDataItem | null;
  error?: string;
  loading?: boolean;
}

interface AziendaMatch {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
}

type SearchResults = Record<string, SourceResult>;
type SearchType = 'partitaIva' | 'ragioneSociale';

const RicercaImprese = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<SearchType>('partitaIva');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [lastSearched, setLastSearched] = useState<string>("");
  const [matchingAzienda, setMatchingAzienda] = useState<AziendaMatch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSources, setSavedSources] = useState<Set<string>>(new Set());
  const [filterTipologia, setFilterTipologia] = useState<string>("all");
  const [filterAutorita, setFilterAutorita] = useState<string>("all");
  const [filterSoloDeminimis, setFilterSoloDeminimis] = useState<boolean>(false);

  const cleanPartitaIva = (piva: string): string => {
    return piva
      .trim()
      .toUpperCase()
      .replace(/^IT/, '')
      .replace(/\s/g, '');
  };

  // Cerca azienda nel database locale
  const checkAziendaInDatabase = async (piva: string) => {
    try {
      const { data, error } = await supabase
        .from('aziende')
        .select('id, ragione_sociale, partita_iva')
        .eq('partita_iva', piva)
        .maybeSingle();
      
      if (error) {
        console.error('Errore ricerca azienda:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Errore:', err);
      return null;
    }
  };

  // Cerca Fondimpresa nel database locale
  const checkFondimpresaLocal = async (piva: string): Promise<FondoDataItem> => {
    try {
      const { data, error } = await supabase
        .from('fondimpresa_aziende')
        .select('*')
        .or(`partita_iva.eq.${piva},codice_fiscale.eq.${piva}`)
        .maybeSingle();
      
      if (error) {
        console.error('Errore ricerca Fondimpresa:', error);
        return { found: false };
      }
      
      if (data) {
        return {
          found: true,
          denominazione: data.ragione_sociale || undefined,
          annoAdesione: data.anno_adesione || undefined,
          dataAdesione: data.data_adesione || undefined,
          stato: data.stato_registrazione || undefined,
          regione: data.regione || undefined,
          provincia: data.provincia || undefined,
        };
      }
      
      return { found: false };
    } catch (err) {
      console.error('Errore:', err);
      return { found: false };
    }
  };

  const handleSearch = async () => {
    const searchValue = searchType === 'partitaIva' 
      ? cleanPartitaIva(searchTerm)
      : searchTerm.trim();
    
    if (!searchValue) {
      toast.error(searchType === 'partitaIva' 
        ? "Inserisci una Partita IVA o Codice Fiscale"
        : "Inserisci una Ragione Sociale"
      );
      return;
    }

    if (searchType === 'partitaIva' && searchValue.length < 11) {
      toast.error("La Partita IVA deve essere di almeno 11 caratteri");
      return;
    }

    if (searchType === 'ragioneSociale') {
      toast.error("La ricerca per Ragione Sociale non è supportata per questo endpoint");
      return;
    }

    setIsSearching(true);
    setLastSearched(searchValue);
    setMatchingAzienda(null);
    setSavedSources(new Set());
    
    // Inizializza tutti i risultati come "loading"
    const initialResults: SearchResults = {};
    DATABASE_SOURCES.forEach(source => {
      initialResults[source.id] = { found: false, loading: true };
    });
    setSearchResults(initialResults);

    try {
      // Controlla se l'azienda esiste nel database locale
      const aziendaMatch = await checkAziendaInDatabase(searchValue);
      setMatchingAzienda(aziendaMatch);

      // Cerca Fondimpresa nel database locale (in parallelo con API esterna)
      const [fondimpresaResult, rnaApiResult] = await Promise.all([
        checkFondimpresaLocal(searchValue),
        supabase.functions.invoke('rna-check', {
          body: { partitaIva: searchValue }
        })
      ]);

      const { data: rnaData, error: rnaError } = rnaApiResult;

      if (rnaError) {
        throw new Error(rnaError.message);
      }

      // Distribuisci i risultati alle varie fonti
      const finalResults: SearchResults = {};
      DATABASE_SOURCES.forEach(source => {
        if (source.id === 'fondimpresa') {
          // Usa risultato dal database locale
          finalResults[source.id] = {
            found: fondimpresaResult.found,
            data: fondimpresaResult
          };
        } else {
          // Usa risultato dall'API RNA
          const sourceData = rnaData[source.responseField];
          finalResults[source.id] = {
            found: sourceData?.found || false,
            data: sourceData
          };
        }
      });

      setSearchResults(finalResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      toast.error(`Errore nella ricerca: ${errorMessage}`);
      
      // Imposta errore per tutte le fonti
      const errorResults: SearchResults = {};
      DATABASE_SOURCES.forEach(source => {
        errorResults[source.id] = { found: false, error: errorMessage };
      });
      setSearchResults(errorResults);
    }

    setIsSearching(false);
  };

  // Salva i dati Fondimpresa/Fondoforte
  const saveFondoData = async (fondoName: string, fondoData: FondoDataItem) => {
    if (!matchingAzienda) return;
    
    try {
      // Trova il fondo nel database
      const { data: fondo, error: fondoError } = await supabase
        .from('fondi_interprofessionali')
        .select('id')
        .ilike('nome', `%${fondoName}%`)
        .maybeSingle();
      
      if (fondoError || !fondo) {
        toast.error(`Fondo "${fondoName}" non trovato nel database`);
        return false;
      }

      // Controlla se esiste già
      const { data: existing } = await supabase
        .from('aziende_fondi')
        .select('id')
        .eq('azienda_id', matchingAzienda.id)
        .eq('fondo_id', fondo.id)
        .maybeSingle();

      if (existing) {
        // Aggiorna
        const { error } = await supabase
          .from('aziende_fondi')
          .update({
            data_adesione: fondoData.dataAdesione || null,
            verificato: true,
            data_verifica: new Date().toISOString(),
            note: `Verificato automaticamente - Anno adesione: ${fondoData.annoAdesione || 'N/D'}`
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Inserisci
        const { error } = await supabase
          .from('aziende_fondi')
          .insert({
            azienda_id: matchingAzienda.id,
            fondo_id: fondo.id,
            data_adesione: fondoData.dataAdesione || null,
            verificato: true,
            data_verifica: new Date().toISOString(),
            note: `Verificato automaticamente - Anno adesione: ${fondoData.annoAdesione || 'N/D'}`
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (err) {
      console.error('Errore salvataggio fondo:', err);
      return false;
    }
  };

  // Salva i dati RNA
  const saveRnaData = async (rnaData: RnaDataItem) => {
    if (!matchingAzienda || !rnaData.aiuti?.length) return false;
    
    try {
      // Prepara i record da inserire
      const records = rnaData.aiuti.map(aiuto => ({
        azienda_id: matchingAzienda.id,
        data_concessione: aiuto.dataConcessione || null,
        titolo_progetto: aiuto.titoloProgetto || null,
        titolo_misura: aiuto.titoloMisura || null,
        importo_agevolazione: aiuto.importoAgevolazione || null,
        autorita_concedente: aiuto.autoritaConcedente || null,
        tipologia: aiuto.tipologia || null,
        strumento: aiuto.strumento || null
      }));

      // Inserisci con upsert (ignora duplicati)
      const { error } = await supabase
        .from('aziende_aiuti_rna')
        .upsert(records, { 
          onConflict: 'azienda_id,data_concessione,titolo_progetto,importo_agevolazione',
          ignoreDuplicates: true 
        });
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Errore salvataggio RNA:', err);
      return false;
    }
  };

  // Salva tutti i dati trovati
  const handleSaveAll = async () => {
    if (!matchingAzienda || !searchResults) return;
    
    setIsSaving(true);
    const newSaved = new Set<string>();
    let successCount = 0;
    let errorCount = 0;

    for (const source of DATABASE_SOURCES) {
      const result = searchResults[source.id];
      if (!result?.found || !result.data) continue;

      let success = false;
      if (source.id === 'rna') {
        success = await saveRnaData(result.data as RnaDataItem);
      } else if (source.id === 'fondimpresa' || source.id === 'fondoforte') {
        success = await saveFondoData(source.name, result.data as FondoDataItem);
      }

      if (success) {
        newSaved.add(source.id);
        successCount++;
      } else {
        errorCount++;
      }
    }

    setSavedSources(newSaved);
    setIsSaving(false);

    if (successCount > 0 && errorCount === 0) {
      toast.success(`Tutti i dati salvati correttamente per ${matchingAzienda.ragione_sociale}`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} fonte/i salvata/e, ${errorCount} errore/i`);
    } else {
      toast.error('Errore nel salvataggio dei dati');
    }
  };

  // Salva singola fonte
  const handleSaveSource = async (sourceId: string) => {
    if (!matchingAzienda || !searchResults) return;
    
    const result = searchResults[sourceId];
    if (!result?.found || !result.data) return;

    setIsSaving(true);
    let success = false;

    if (sourceId === 'rna') {
      success = await saveRnaData(result.data as RnaDataItem);
    } else if (sourceId === 'fondimpresa' || sourceId === 'fondoforte') {
      const source = DATABASE_SOURCES.find(s => s.id === sourceId);
      if (source) {
        success = await saveFondoData(source.name, result.data as FondoDataItem);
      }
    }

    if (success) {
      setSavedSources(prev => new Set([...prev, sourceId]));
      toast.success(`Dati salvati per ${matchingAzienda.ragione_sociale}`);
    } else {
      toast.error('Errore nel salvataggio');
    }

    setIsSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return 'N/D';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numValue);
  };

  const renderFondoDetails = (data: FondoDataItem, sourceId: string) => {
    // Per Fondo Forte, ora è solo un boolean "found" senza dati aggiuntivi
    if (sourceId === 'fondoforte') {
      return (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">Azienda registrata a Fondo Forte</span>
          </div>
        </div>
      );
    }

    // Per altri fondi (se in futuro verranno aggiunti)
    return (
      <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
        {data.denominazione && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Denominazione:</span>
            <span className="text-sm font-medium">{data.denominazione}</span>
          </div>
        )}
        {data.annoAdesione && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Anno Adesione:</span>
            <span className="text-sm font-medium">{data.annoAdesione}</span>
          </div>
        )}
        {data.dataAdesione && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Data Adesione:</span>
            <span className="text-sm font-medium">{data.dataAdesione}</span>
          </div>
        )}
        {data.stato && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stato:</span>
            <span className="text-sm font-medium">{data.stato}</span>
          </div>
        )}
        {(data.regione || data.provincia) && (
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Sede:</span>
            <span className="text-sm font-medium">
              {[data.regione, data.provincia].filter(Boolean).join(' - ')}
            </span>
          </div>
        )}
      </div>
    );
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/D';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Export RNA data to CSV
  const exportRnaToCsv = (rnaData: RnaDataItem, piva: string) => {
    const allAiuti = rnaData.aiuti || [];
    const aiutiDeminimis = rnaData.aiutiDeminimis || [];
    
    if (allAiuti.length === 0 && aiutiDeminimis.length === 0) {
      toast.error("Nessun dato da esportare");
      return;
    }

    // CSV header
    const headers = [
      "Tipo",
      "Titolo Progetto",
      "Titolo Misura",
      "Autorità Concedente",
      "Importo Agevolazione",
      "Data Concessione",
      "Tipologia",
      "Strumento",
      "Codice CAR",
      "Codice CE",
      "Regione"
    ];

    // Convert data to CSV rows
    const rows: string[][] = [];
    
    allAiuti.forEach(aiuto => {
      rows.push([
        "Aiuto RNA",
        aiuto.titoloProgetto || "",
        aiuto.titoloMisura || "",
        aiuto.autoritaConcedente || "",
        aiuto.importoAgevolazione?.toString() || "",
        aiuto.dataConcessione || "",
        aiuto.tipologia || "",
        aiuto.strumento || "",
        aiuto.codiceCar || "",
        aiuto.codiceCe || "",
        aiuto.regione || ""
      ]);
    });

    aiutiDeminimis.forEach(aiuto => {
      rows.push([
        "De Minimis",
        aiuto.titoloProgetto || "",
        aiuto.titoloMisura || "",
        aiuto.autoritaConcedente || "",
        aiuto.importoAgevolazione?.toString() || "",
        aiuto.dataConcessione || "",
        aiuto.tipologia || "",
        aiuto.strumento || "",
        aiuto.codiceCar || "",
        aiuto.codiceCe || "",
        aiuto.regione || ""
      ]);
    });

    // Escape CSV values
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Add BOM for Excel compatibility with UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aiuti_rna_${piva}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Esportati ${rows.length} aiuti in CSV`);
  };

  // Export RNA data to Excel
  const exportRnaToExcel = (rnaData: RnaDataItem, piva: string) => {
    const allAiuti = rnaData.aiuti || [];
    const aiutiDeminimis = rnaData.aiutiDeminimis || [];
    
    if (allAiuti.length === 0 && aiutiDeminimis.length === 0) {
      toast.error("Nessun dato da esportare");
      return;
    }

    // Prepare data for Excel
    const excelData: Record<string, unknown>[] = [];
    
    allAiuti.forEach(aiuto => {
      excelData.push({
        "Tipo": "Aiuto RNA",
        "Titolo Progetto": aiuto.titoloProgetto || "",
        "Titolo Misura": aiuto.titoloMisura || "",
        "Autorità Concedente": aiuto.autoritaConcedente || "",
        "Importo Agevolazione": aiuto.importoAgevolazione || 0,
        "Data Concessione": aiuto.dataConcessione || "",
        "Tipologia": aiuto.tipologia || "",
        "Strumento": aiuto.strumento || "",
        "Codice CAR": aiuto.codiceCar || "",
        "Codice CE": aiuto.codiceCe || "",
        "Regione": aiuto.regione || ""
      });
    });

    aiutiDeminimis.forEach(aiuto => {
      excelData.push({
        "Tipo": "De Minimis",
        "Titolo Progetto": aiuto.titoloProgetto || "",
        "Titolo Misura": aiuto.titoloMisura || "",
        "Autorità Concedente": aiuto.autoritaConcedente || "",
        "Importo Agevolazione": aiuto.importoAgevolazione || 0,
        "Data Concessione": aiuto.dataConcessione || "",
        "Tipologia": aiuto.tipologia || "",
        "Strumento": aiuto.strumento || "",
        "Codice CAR": aiuto.codiceCar || "",
        "Codice CE": aiuto.codiceCe || "",
        "Regione": aiuto.regione || ""
      });
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // Tipo
      { wch: 40 },  // Titolo Progetto
      { wch: 30 },  // Titolo Misura
      { wch: 30 },  // Autorità Concedente
      { wch: 20 },  // Importo
      { wch: 15 },  // Data
      { wch: 20 },  // Tipologia
      { wch: 20 },  // Strumento
      { wch: 15 },  // Codice CAR
      { wch: 15 },  // Codice CE
      { wch: 15 },  // Regione
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Aiuti RNA");

    // Generate and download file
    const filename = `aiuti_rna_${piva}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast.success(`Esportati ${excelData.length} aiuti in Excel`);
  };

  const renderRnaDetails = (data: RnaDataItem) => {
    const allAiuti = data.aiuti || [];
    const aiutiDeminimis = data.aiutiDeminimis || [];
    const hasAiuti = allAiuti.length > 0 || aiutiDeminimis.length > 0;

    if (!hasAiuti) {
      return (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          Nessun aiuto di stato registrato
        </div>
      );
    }

    // Estrai opzioni uniche per i filtri
    const tipologieUniche = [...new Set(allAiuti.map(a => a.tipologia).filter(Boolean))] as string[];
    const autoritaUniche = [...new Set(allAiuti.map(a => a.autoritaConcedente).filter(Boolean))] as string[];

    // Applica filtri
    const filteredAiuti = allAiuti.filter(aiuto => {
      const matchTipologia = filterTipologia === "all" || aiuto.tipologia === filterTipologia;
      const matchAutorita = filterAutorita === "all" || aiuto.autoritaConcedente === filterAutorita;
      return matchTipologia && matchAutorita;
    });

    const filteredDeminimis = aiutiDeminimis.filter(aiuto => {
      const matchTipologia = filterTipologia === "all" || aiuto.tipologia === filterTipologia;
      const matchAutorita = filterAutorita === "all" || aiuto.autoritaConcedente === filterAutorita;
      return matchTipologia && matchAutorita;
    });

    const hasActiveFilters = filterTipologia !== "all" || filterAutorita !== "all" || filterSoloDeminimis;

    // Calcola il totale aiuti generali (su dati filtrati)
    const totaleImporto = filteredAiuti.reduce((sum, aiuto) => {
      return sum + (aiuto.importoAgevolazione || 0);
    }, 0);

    // Calcola il totale de minimis (su dati filtrati)
    const totaleDeminimis = filteredDeminimis.reduce((sum, aiuto) => {
      return sum + (aiuto.importoAgevolazione || 0);
    }, 0);

    // Raggruppa per tipologia (solo aiuti filtrati)
    const perTipologia = filteredAiuti.reduce((acc, aiuto) => {
      const tipo = aiuto.tipologia || 'Altro';
      if (!acc[tipo]) acc[tipo] = { count: 0, totale: 0 };
      acc[tipo].count++;
      acc[tipo].totale += aiuto.importoAgevolazione || 0;
      return acc;
    }, {} as Record<string, { count: number; totale: number }>);

    // Raggruppa per autorità concedente (solo aiuti filtrati)
    const perEnte = filteredAiuti.reduce((acc, aiuto) => {
      const ente = aiuto.autoritaConcedente || 'Non specificato';
      if (!acc[ente]) acc[ente] = { count: 0, totale: 0 };
      acc[ente].count++;
      acc[ente].totale += aiuto.importoAgevolazione || 0;
      return acc;
    }, {} as Record<string, { count: number; totale: number }>);

    const resetFilters = () => {
      setFilterTipologia("all");
      setFilterAutorita("all");
      setFilterSoloDeminimis(false);
    };

    // Debug: log delle date per il calcolo de minimis (inclusivo)
    const treAnniFaDebug = startOfDay(subYears(new Date(), 3));
    console.log('De minimis debug:', {
      periodoDal: format(treAnniFaDebug, 'dd/MM/yyyy'),
      periodoAl: format(new Date(), 'dd/MM/yyyy'),
      note: 'Il periodo DAL è INCLUSIVO (>=)',
      aiutiDeminimisRaw: aiutiDeminimis.map(a => ({
        titolo: a.titoloProgetto,
        dataRaw: a.dataConcessione,
        parsed: a.dataConcessione ? parseISO(a.dataConcessione) : null,
        isRecent: a.dataConcessione ? !isBefore(startOfDay(parseISO(a.dataConcessione)), treAnniFaDebug) : false
      }))
    });

    return (
      <div className="mt-4 space-y-4">
        {/* Avviso dati API esterna */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Nota:</span> I dati provengono da un'API di terze parti e potrebbero non essere completi. 
            Per la lista ufficiale, consultare il{" "}
            <a 
              href="https://www.rna.gov.it/RegistroNazionaleTrasparenza/faces/pages/TrassparenzaAiuto.jspx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline font-medium"
            >
              Registro Nazionale Aiuti
            </a>.
          </div>
        </div>

        {/* Header con export */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {allAiuti.length + aiutiDeminimis.length} aiuti trovati
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportRnaToCsv(data, lastSearched)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportRnaToExcel(data, lastSearched)}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filtri */}
        <div className="p-4 bg-muted/30 border border-border/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtra aiuti</span>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 gap-1">
                <X className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
          
          {/* Toggle Solo De Minimis */}
          <div className="flex items-center gap-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <input
              type="checkbox"
              id="filterDeminimis"
              checked={filterSoloDeminimis}
              onChange={(e) => setFilterSoloDeminimis(e.target.checked)}
              className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            <Label htmlFor="filterDeminimis" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Mostra solo aiuti De Minimis
            </Label>
            {filterSoloDeminimis && (
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 ml-auto">
                {aiutiDeminimis.length} de minimis
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tipologieUniche.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipologia</Label>
                <Select value={filterTipologia} onValueChange={setFilterTipologia}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tutte le tipologie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le tipologie</SelectItem>
                    {tipologieUniche.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {autoritaUniche.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Autorità Concedente</Label>
                <Select value={filterAutorita} onValueChange={setFilterAutorita}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tutte le autorità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le autorità</SelectItem>
                    {autoritaUniche.map(autorita => (
                      <SelectItem key={autorita} value={autorita}>{autorita}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <div className="text-xs text-muted-foreground">
              {filterSoloDeminimis 
                ? `Mostrati ${filteredDeminimis.length} aiuti de minimis` 
                : `Mostrati ${filteredAiuti.length + filteredDeminimis.length} di ${allAiuti.length + aiutiDeminimis.length} aiuti`}
            </div>
          )}
        </div>

        {/* Riepilogo totale - nascosto se filtro solo de minimis */}
        {!filterSoloDeminimis && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700">Totale Aiuti RNA{hasActiveFilters ? " (filtrati)" : ""}</span>
              </div>
              <span className="text-xl font-bold text-green-600">{formatCurrency(totaleImporto)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAiuti.length} aiuti{hasActiveFilters ? ` su ${allAiuti.length}` : " totali"}
            </p>
          </div>
        )}

        {/* Sezione De Minimis con evidenziazione ultimi 3 anni */}
        {(filteredDeminimis.length > 0 || (!hasActiveFilters && aiutiDeminimis.length > 0)) && (() => {
          // Calcola la data limite (3 anni fa da oggi, inclusivo)
          const treAnniFa = startOfDay(subYears(new Date(), 3));

          // Funzione per verificare se un aiuto è negli ultimi 3 anni (inclusivo)
          const isWithinLastThreeYears = (dataConcessione: string | undefined): boolean => {
            if (!dataConcessione) return false;
            try {
              const data = startOfDay(parseISO(dataConcessione));
              // !isBefore significa >= (inclusivo del giorno di confine)
              return !isBefore(data, treAnniFa);
            } catch {
              return false;
            }
          };

          // Separa de minimis in due gruppi
          const deminimisTreAnni = filteredDeminimis.filter(a => isWithinLastThreeYears(a.dataConcessione));
          const deminimisStorico = filteredDeminimis.filter(a => !isWithinLastThreeYears(a.dataConcessione));

          // Calcola totali separati
          const totaleDeminimisTreAnni = deminimisTreAnni.reduce((sum, a) => sum + (a.importoAgevolazione || 0), 0);
          const totaleDeminimisStorico = deminimisStorico.reduce((sum, a) => sum + (a.importoAgevolazione || 0), 0);

          // Massimale de minimis (€300.000 per settore generale)
          const MASSIMALE_DEMINIMIS = 300000;
          const massimaleDisponibile = Math.max(0, MASSIMALE_DEMINIMIS - totaleDeminimisTreAnni);
          const percentualeUtilizzata = (totaleDeminimisTreAnni / MASSIMALE_DEMINIMIS) * 100;
          const isVicinoAlLimite = percentualeUtilizzata >= 80;

          return (
            <div className="space-y-4">
              {/* Header De Minimis con riepilogo ultimi 3 anni */}
              <div className={`p-4 rounded-lg border-2 ${isVicinoAlLimite ? 'bg-red-500/10 border-red-500/40' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">DE MINIMIS - Ultimi 3 anni</span>
                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                    Rilevante per il massimale
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground mb-3">
                  Periodo: dal {format(treAnniFa, "dd/MM/yyyy", { locale: it })} al {format(new Date(), "dd/MM/yyyy", { locale: it })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-3 rounded-lg ${isVicinoAlLimite ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    <div className="text-xs text-muted-foreground">Totale rilevante</div>
                    <div className={`text-xl font-bold ${isVicinoAlLimite ? 'text-red-600' : 'text-amber-600'}`}>
                      {formatCurrency(totaleDeminimisTreAnni)}
                    </div>
                    <div className="text-xs text-muted-foreground">{deminimisTreAnni.length} aiuti</div>
                  </div>
                  
                  <div className="p-3 bg-background/50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Massimale disponibile</div>
                    <div className={`text-xl font-bold ${isVicinoAlLimite ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(massimaleDisponibile)}
                    </div>
                    <div className="text-xs text-muted-foreground">su €300.000 max</div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Storico precedente</div>
                    <div className="text-xl font-bold text-muted-foreground">
                      {formatCurrency(totaleDeminimisStorico)}
                    </div>
                    <div className="text-xs text-muted-foreground">{deminimisStorico.length} aiuti (non più rilevanti)</div>
                  </div>
                </div>

                {isVicinoAlLimite && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Attenzione: {percentualeUtilizzata.toFixed(0)}% del massimale già utilizzato!</span>
                  </div>
                )}
              </div>

              {/* Lista aiuti de minimis ultimi 3 anni (rilevanti) */}
              {deminimisTreAnni.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Ultimi 3 anni - Rilevanti per il massimale ({deminimisTreAnni.length})
                  </h4>
                  {deminimisTreAnni.map((aiuto, idx) => (
                    <div key={idx} className="p-3 bg-amber-100/50 border-2 border-amber-400 rounded-lg space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-600 text-white text-xs">Rilevante</Badge>
                        {aiuto.titoloProgetto && (
                          <span className="font-medium text-sm">{aiuto.titoloProgetto}</span>
                        )}
                      </div>
                      {(aiuto.codiceCar || aiuto.codiceCe || aiuto.regione) && (
                        <div className="flex flex-wrap gap-2">
                          {aiuto.codiceCar && (
                            <Badge variant="outline" className="text-xs font-mono bg-slate-100">
                              CAR: {aiuto.codiceCar}
                            </Badge>
                          )}
                          {aiuto.codiceCe && (
                            <Badge variant="outline" className="text-xs font-mono bg-slate-100">
                              CE: {aiuto.codiceCe}
                            </Badge>
                          )}
                          {aiuto.regione && (
                            <Badge variant="secondary" className="text-xs">
                              {aiuto.regione}
                            </Badge>
                          )}
                        </div>
                      )}
                      {aiuto.titoloMisura && (
                        <div className="text-xs text-muted-foreground italic">{aiuto.titoloMisura}</div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {aiuto.autoritaConcedente && (
                          <div>
                            <span className="text-muted-foreground">Autorità: </span>
                            <span>{aiuto.autoritaConcedente}</span>
                          </div>
                        )}
                        {aiuto.importoAgevolazione !== undefined && aiuto.importoAgevolazione !== null && (
                          <div>
                            <span className="text-muted-foreground">Importo: </span>
                            <span className="font-medium text-amber-700">{formatCurrency(aiuto.importoAgevolazione)}</span>
                          </div>
                        )}
                        {aiuto.dataConcessione && (
                          <div>
                            <span className="text-muted-foreground">Data: </span>
                            <span className="font-medium">{formatDate(aiuto.dataConcessione)}</span>
                          </div>
                        )}
                        {aiuto.tipologia && (
                          <div>
                            <span className="text-muted-foreground">Tipo: </span>
                            <span>{aiuto.tipologia}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista aiuti de minimis storici (oltre 3 anni) */}
              {deminimisStorico.length > 0 && (
                <div className="space-y-2 opacity-70">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    Storico - Oltre 3 anni ({deminimisStorico.length})
                    <Badge variant="outline" className="text-xs">Non più rilevanti</Badge>
                  </h4>
                  {deminimisStorico.map((aiuto, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 border border-muted rounded-lg space-y-1">
                      {aiuto.titoloProgetto && (
                        <div className="font-medium text-sm text-muted-foreground">{aiuto.titoloProgetto}</div>
                      )}
                      {(aiuto.codiceCar || aiuto.codiceCe || aiuto.regione) && (
                        <div className="flex flex-wrap gap-2">
                          {aiuto.codiceCar && (
                            <Badge variant="outline" className="text-xs font-mono opacity-60">
                              CAR: {aiuto.codiceCar}
                            </Badge>
                          )}
                          {aiuto.codiceCe && (
                            <Badge variant="outline" className="text-xs font-mono opacity-60">
                              CE: {aiuto.codiceCe}
                            </Badge>
                          )}
                          {aiuto.regione && (
                            <Badge variant="outline" className="text-xs opacity-60">
                              {aiuto.regione}
                            </Badge>
                          )}
                        </div>
                      )}
                      {aiuto.titoloMisura && (
                        <div className="text-xs text-muted-foreground italic">{aiuto.titoloMisura}</div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {aiuto.autoritaConcedente && (
                          <div>
                            <span className="text-muted-foreground">Autorità: </span>
                            <span className="text-muted-foreground">{aiuto.autoritaConcedente}</span>
                          </div>
                        )}
                        {aiuto.importoAgevolazione !== undefined && aiuto.importoAgevolazione !== null && (
                          <div>
                            <span className="text-muted-foreground">Importo: </span>
                            <span className="text-muted-foreground">{formatCurrency(aiuto.importoAgevolazione)}</span>
                          </div>
                        )}
                        {aiuto.dataConcessione && (
                          <div>
                            <span className="text-muted-foreground">Data: </span>
                            <span className="text-muted-foreground">{formatDate(aiuto.dataConcessione)}</span>
                          </div>
                        )}
                        {aiuto.tipologia && (
                          <div>
                            <span className="text-muted-foreground">Tipo: </span>
                            <span className="text-muted-foreground">{aiuto.tipologia}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ricerca Imprese"
        description="Verifica la presenza di un'azienda nei database disponibili"
        icon={<Search className="h-6 w-6 text-primary" />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
          { label: 'Ricerca Imprese', icon: 'ricerca-imprese' }
        ]}
      />

      {/* Search Box */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cerca Azienda
          </CardTitle>
          <CardDescription>
            Inserisci la Partita IVA o il Codice Fiscale dell'azienda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={searchType} 
            onValueChange={(v) => {
              setSearchType(v as SearchType);
              setSearchResults(null);
            }}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partitaIva" id="partitaIva" />
              <Label htmlFor="partitaIva" className="cursor-pointer">Partita IVA / C.F.</Label>
            </div>
          </RadioGroup>

          <div className="flex gap-3">
            <Input
              placeholder="Es: 12345678901 o IT12345678901"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="min-w-[120px]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ricerca...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Cerca
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Azienda Match Banner */}
      {searchResults && matchingAzienda && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary">Azienda trovata nel database</p>
                  <p className="text-sm text-muted-foreground">{matchingAzienda.ragione_sociale} - P.IVA: {matchingAzienda.partita_iva}</p>
                </div>
              </div>
              <Button 
                onClick={handleSaveAll}
                disabled={isSaving || !DATABASE_SOURCES.some(s => searchResults[s.id]?.found && !savedSources.has(s.id))}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : savedSources.size === DATABASE_SOURCES.filter(s => searchResults[s.id]?.found).length ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Salvato
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salva tutti i dati
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Risultati per: {lastSearched}
            </h2>
            <Badge variant="outline">
              {DATABASE_SOURCES.length} fonti consultate
            </Badge>
          </div>

          <div className="grid gap-4">
            {DATABASE_SOURCES.map((source) => {
              const result = searchResults[source.id];
              const Icon = source.icon;
              const isRna = source.id === 'rna';
              const rnaData = result?.data as RnaDataItem | undefined;
              const fondoData = result?.data as FondoDataItem | undefined;
              const isSaved = savedSources.has(source.id);

              return (
                <Card key={source.id} className={result?.found ? 'border-green-500/50' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${result?.found ? 'bg-green-500/10' : 'bg-muted'}`}>
                        <Icon className={`h-6 w-6 ${result?.found ? 'text-green-600' : 'text-muted-foreground'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{source.name}</h3>
                            <p className="text-sm text-muted-foreground">{source.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {result?.loading ? (
                              <Badge variant="outline" className="gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Verifica...
                              </Badge>
                            ) : result?.error ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Errore
                              </Badge>
                            ) : result?.found ? (
                              <Badge className="gap-1 bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="h-3 w-3" />
                                {isRna && rnaData?.numeroAiuti ? `${rnaData.numeroAiuti} aiuti` : 'Presente'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Non trovato
                              </Badge>
                            )}
                            
                            {/* Save button per singola fonte */}
                            {matchingAzienda && result?.found && !result.loading && (
                              <Button
                                variant={isSaved ? "outline" : "secondary"}
                                size="sm"
                                onClick={() => handleSaveSource(source.id)}
                                disabled={isSaving || isSaved}
                                className="gap-1"
                              >
                                {isSaved ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600">Salvato</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-3 w-3" />
                                    Salva
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {result?.error && (
                          <p className="text-sm text-destructive mt-2">{result.error}</p>
                        )}

                        {/* Render details based on type */}
                        {result?.found && result.data && (
                          isRna 
                            ? renderRnaDetails(rnaData!) 
                            : renderFondoDetails(fondoData!, source.id)
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchResults && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Inserisci una Partita IVA per iniziare
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Verranno consultati Fondo Forte e il Registro Aiuti di Stato
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RicercaImprese;