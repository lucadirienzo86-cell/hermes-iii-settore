import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, FileText, User, Search, TrendingUp, Plus, CheckCircle2, Landmark, GraduationCap, Bell, BellOff, ChevronDown, ChevronUp, ChevronsUpDown, ChevronsDownUp, Network } from "lucide-react";
import { toast } from "sonner";
import { useFondiCompatibility } from "@/hooks/useFondiCompatibility";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { registraLogPratica } from "@/hooks/usePraticaLog";

interface Incrocio {
  id: string;
  azienda_id: string;
  azienda_nome: string;
  azienda_piva: string;
  bando_id: string;
  bando_nome: string;
  responsabile: string;
  responsabile_tipo: 'gestore' | 'docente';
  percentuale_match: number;
  criteri_matched: string[];
  data_incrocio: string;
}

interface BadgeMatch {
  azienda: any;
  avviso: any;
  fondoNome: string;
  matchingBadges: string[];
  allBadgesMatch: boolean;
}

interface GroupedIncroci {
  azienda: {
    id: string;
    nome: string;
    piva: string;
    responsabile: string;
    responsabile_tipo: 'gestore' | 'docente';
  };
  matches: Incrocio[];
  avgMatch: number;
  totaleMatch: number;
}

interface GroupedFondiMatch {
  azienda: { id: string; ragione_sociale: string; partita_iva?: string };
  matches: any[];
  avgMatch: number;
  totaleMatch: number;
}

interface GroupedBadgeMatch {
  azienda: { id: string; ragione_sociale: string; partita_iva?: string };
  matches: BadgeMatch[];
  totaleMatch: number;
}

const Incroci = () => {
  const { profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const [incroci, setIncroci] = useState<Incrocio[]>([]);
  const [filteredIncroci, setFilteredIncroci] = useState<Incrocio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermFondi, setSearchTermFondi] = useState("");
  const [searchTermBadge, setSearchTermBadge] = useState("");
  const [searchTermAlert, setSearchTermAlert] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [praticheEsistenti, setPraticheEsistenti] = useState<Set<string>>(new Set());
  const [adesioniEsistenti, setAdesioniEsistenti] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("bandi");
  const [expandedAziende, setExpandedAziende] = useState<Set<string>>(new Set());
  const [selectedAziendaFilter, setSelectedAziendaFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totaleIncroci: 0,
    aziende: 0,
    bandi: 0,
  });

  // Fondi data
  const [aziende, setAziende] = useState<any[]>([]);
  const [avvisi, setAvvisi] = useState<any[]>([]);
  const [fondi, setFondi] = useState<{ id: string; nome: string }[]>([]);

  // Alert esistenti
  const { data: alertEsistenti = [] } = useQuery({
    queryKey: ["avvisi_alert"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avvisi_alert")
        .select("*");
      if (error) throw error;
      return data || [];
    }
  });

  const alertSet = useMemo(() => 
    new Set(alertEsistenti.map(a => `${a.avviso_id}-${a.azienda_id}`)),
    [alertEsistenti]
  );

  // Mutation per creare alert
  const createAlertMutation = useMutation({
    mutationFn: async ({ avviso_id, azienda_id }: { avviso_id: string; azienda_id: string }) => {
      const { error } = await supabase.from("avvisi_alert").insert({
        avviso_id,
        azienda_id,
        created_by: profile?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avvisi_alert"] });
      toast.success("Alert creato con successo");
    },
    onError: () => {
      toast.error("Errore nella creazione dell'alert");
    }
  });

  // Mutation per rimuovere alert
  const deleteAlertMutation = useMutation({
    mutationFn: async ({ avviso_id, azienda_id }: { avviso_id: string; azienda_id: string }) => {
      const { error } = await supabase
        .from("avvisi_alert")
        .delete()
        .eq("avviso_id", avviso_id)
        .eq("azienda_id", azienda_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avvisi_alert"] });
      toast.success("Alert rimosso");
    },
    onError: () => {
      toast.error("Errore nella rimozione dell'alert");
    }
  });

  useEffect(() => {
    if (profile) {
      loadIncroci();
      loadPratiche();
      loadAdesioni();
      loadFondiData();
    }
  }, [profile]);

  const loadFondiData = async () => {
    // Per gestore/docente: filtra solo le proprie aziende
    let aziendeQuery = supabase.from("aziende").select("*");
    
    if (profile?.role === 'gestore') {
      const { data: gestoreData } = await supabase
        .from('gestori')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (gestoreData) {
        aziendeQuery = aziendeQuery.eq('inserita_da_gestore_id', gestoreData.id);
      }
    } else if (profile?.role === 'docente') {
      const { data: docenteData } = await supabase
        .from('docenti')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (docenteData) {
        aziendeQuery = aziendeQuery.eq('inserita_da_docente_id', docenteData.id);
      }
    }
    
    const [aziendeRes, avvisiRes, fondiRes] = await Promise.all([
      aziendeQuery,
      supabase.from("avvisi_fondi").select("*").eq("attivo", true),
      supabase.from("fondi_interprofessionali").select("id, nome").eq("attivo", true)
    ]);
    
    if (aziendeRes.data) setAziende(aziendeRes.data);
    if (avvisiRes.data) setAvvisi(avvisiRes.data);
    if (fondiRes.data) setFondi(fondiRes.data);
  };

  // Use the hook for fondi compatibility
  const fondiMatches = useFondiCompatibility(aziende, avvisi, fondi);

  const filteredFondiMatches = fondiMatches.filter(match =>
    match.azienda.ragione_sociale.toLowerCase().includes(searchTermFondi.toLowerCase()) ||
    match.avviso.titolo.toLowerCase().includes(searchTermFondi.toLowerCase()) ||
    match.fondoNome.toLowerCase().includes(searchTermFondi.toLowerCase())
  );

  // Calcola match basati su badge formativi
  const badgeMatches: BadgeMatch[] = useMemo(() => {
    const matches: BadgeMatch[] = [];
    
    aziende.forEach(azienda => {
      if (!azienda.badge_formativi?.length) return;
      
      avvisi.forEach(avviso => {
        if (!avviso.badge_formativi?.length) return;
        
        const matchingBadges = azienda.badge_formativi.filter((badge: string) =>
          avviso.badge_formativi.includes(badge)
        );
        
        if (matchingBadges.length > 0) {
          const fondo = fondi.find(f => f.id === avviso.fondo_id);
          matches.push({
            azienda,
            avviso,
            fondoNome: fondo?.nome || "N/A",
            matchingBadges,
            allBadgesMatch: matchingBadges.length === avviso.badge_formativi.length
          });
        }
      });
    });
    
    // Ordina per numero di badge matchati (decrescente)
    return matches.sort((a, b) => b.matchingBadges.length - a.matchingBadges.length);
  }, [aziende, avvisi, fondi]);

  // Filtra per avvisi sempre disponibili
  const badgeMatchesSempreDisponibili = useMemo(() => 
    badgeMatches.filter(m => m.avviso.sempre_disponibile),
    [badgeMatches]
  );

  // Filtra per avvisi a progetto
  const badgeMatchesAProgetto = useMemo(() => 
    badgeMatches.filter(m => !m.avviso.sempre_disponibile),
    [badgeMatches]
  );

  // Auto-switch al tab con risultati disponibili
  useEffect(() => {
    if (loadingData) return;
    
    // Priorità: mostra il primo tab con match disponibili
    if (stats.totaleIncroci > 0) {
      setActiveTab("bandi");
    } else if (fondiMatches.length > 0) {
      setActiveTab("fondi");
    } else if (badgeMatchesSempreDisponibili.length > 0) {
      setActiveTab("badge");
    } else if (badgeMatchesAProgetto.length > 0) {
      setActiveTab("alert");
    }
    // Se nessuno ha match, lascia il default "bandi"
  }, [loadingData, stats.totaleIncroci, fondiMatches.length, badgeMatchesSempreDisponibili.length, badgeMatchesAProgetto.length]);

  const filteredBadgeMatches = useMemo(() => {
    const term = searchTermBadge.toLowerCase();
    return badgeMatchesSempreDisponibili.filter(match =>
      match.azienda.ragione_sociale.toLowerCase().includes(term) ||
      match.avviso.titolo.toLowerCase().includes(term) ||
      match.fondoNome.toLowerCase().includes(term) ||
      match.matchingBadges.some(b => b.toLowerCase().includes(term))
    );
  }, [badgeMatchesSempreDisponibili, searchTermBadge]);

  const filteredAlertMatches = useMemo(() => {
    const term = searchTermAlert.toLowerCase();
    return badgeMatchesAProgetto.filter(match =>
      match.azienda.ragione_sociale.toLowerCase().includes(term) ||
      match.avviso.titolo.toLowerCase().includes(term) ||
      match.fondoNome.toLowerCase().includes(term) ||
      match.matchingBadges.some(b => b.toLowerCase().includes(term))
    );
  }, [badgeMatchesAProgetto, searchTermAlert]);

  const loadPratiche = async () => {
    const { data } = await supabase
      .from('pratiche')
      .select('azienda_id, bando_id');
    
    if (data) {
      const set = new Set(data.map(p => `${p.azienda_id}-${p.bando_id}`));
      setPraticheEsistenti(set);
    }
  };

  const loadAdesioni = async () => {
    const { data } = await supabase
      .from('aziende_fondi')
      .select('azienda_id, fondo_id');
    
    if (data) {
      const set = new Set(data.map(af => `${af.azienda_id}-${af.fondo_id}`));
      setAdesioniEsistenti(set);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = incroci.filter(incrocio =>
        incrocio.azienda_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incrocio.bando_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incrocio.responsabile.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIncroci(filtered);
    } else {
      setFilteredIncroci(incroci);
    }
  }, [searchTerm, incroci]);

  // Raggruppa incroci per azienda
  const incrociByAzienda = useMemo((): GroupedIncroci[] => {
    const grouped: Record<string, GroupedIncroci> = {};
    
    filteredIncroci.forEach(incrocio => {
      if (!grouped[incrocio.azienda_id]) {
        grouped[incrocio.azienda_id] = {
          azienda: {
            id: incrocio.azienda_id,
            nome: incrocio.azienda_nome,
            piva: incrocio.azienda_piva,
            responsabile: incrocio.responsabile,
            responsabile_tipo: incrocio.responsabile_tipo
          },
          matches: [],
          avgMatch: 0,
          totaleMatch: 0
        };
      }
      grouped[incrocio.azienda_id].matches.push(incrocio);
    });
    
    Object.values(grouped).forEach(group => {
      group.totaleMatch = group.matches.length;
      group.avgMatch = Math.round(
        group.matches.reduce((sum, m) => sum + m.percentuale_match, 0) / group.matches.length
      );
    });
    
    return Object.values(grouped).sort((a, b) => b.avgMatch - a.avgMatch);
  }, [filteredIncroci]);

  // Raggruppa fondi matches per azienda
  const fondiMatchesByAzienda = useMemo((): GroupedFondiMatch[] => {
    const grouped: Record<string, GroupedFondiMatch> = {};
    
    filteredFondiMatches.forEach(match => {
      if (!grouped[match.azienda.id]) {
        grouped[match.azienda.id] = {
          azienda: {
            id: match.azienda.id,
            ragione_sociale: match.azienda.ragione_sociale,
            partita_iva: match.azienda.partita_iva
          },
          matches: [],
          avgMatch: 0,
          totaleMatch: 0
        };
      }
      grouped[match.azienda.id].matches.push(match);
    });
    
    Object.values(grouped).forEach(group => {
      group.totaleMatch = group.matches.length;
      group.avgMatch = Math.round(
        group.matches.reduce((sum, m) => sum + m.percentage, 0) / group.matches.length
      );
    });
    
    return Object.values(grouped).sort((a, b) => b.avgMatch - a.avgMatch);
  }, [filteredFondiMatches]);

  // Raggruppa badge matches per azienda
  const badgeMatchesByAzienda = useMemo((): GroupedBadgeMatch[] => {
    const grouped: Record<string, GroupedBadgeMatch> = {};
    
    filteredBadgeMatches.forEach(match => {
      if (!grouped[match.azienda.id]) {
        grouped[match.azienda.id] = {
          azienda: {
            id: match.azienda.id,
            ragione_sociale: match.azienda.ragione_sociale,
            partita_iva: match.azienda.partita_iva
          },
          matches: [],
          totaleMatch: 0
        };
      }
      grouped[match.azienda.id].matches.push(match);
    });
    
    Object.values(grouped).forEach(group => {
      group.totaleMatch = group.matches.length;
    });
    
    return Object.values(grouped).sort((a, b) => b.totaleMatch - a.totaleMatch);
  }, [filteredBadgeMatches]);

  // Raggruppa alert matches per azienda
  const alertMatchesByAzienda = useMemo((): GroupedBadgeMatch[] => {
    const grouped: Record<string, GroupedBadgeMatch> = {};
    
    filteredAlertMatches.forEach(match => {
      if (!grouped[match.azienda.id]) {
        grouped[match.azienda.id] = {
          azienda: {
            id: match.azienda.id,
            ragione_sociale: match.azienda.ragione_sociale,
            partita_iva: match.azienda.partita_iva
          },
          matches: [],
          totaleMatch: 0
        };
      }
      grouped[match.azienda.id].matches.push(match);
    });
    
    Object.values(grouped).forEach(group => {
      group.totaleMatch = group.matches.length;
    });
    
    return Object.values(grouped).sort((a, b) => b.totaleMatch - a.totaleMatch);
  }, [filteredAlertMatches]);

  const toggleAzienda = (aziendaId: string) => {
    setExpandedAziende(prev => {
      const newSet = new Set(prev);
      if (newSet.has(aziendaId)) {
        newSet.delete(aziendaId);
      } else {
        newSet.add(aziendaId);
      }
      return newSet;
    });
  };

  // Lista unica di aziende per il filtro dropdown
  const aziendeList = useMemo(() => {
    const allAziende = new Map<string, { id: string; nome: string }>();
    
    aziende.forEach(a => {
      allAziende.set(a.id, { id: a.id, nome: a.ragione_sociale });
    });
    
    return Array.from(allAziende.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [aziende]);

  // Funzioni per espandere/chiudere tutti
  const expandAll = () => {
    const allIds = new Set<string>();
    aziendeList.forEach(a => allIds.add(a.id));
    setExpandedAziende(allIds);
  };

  const collapseAll = () => {
    setExpandedAziende(new Set());
  };

  // Filtra i raggruppamenti per azienda selezionata
  const filteredIncrociByAzienda = useMemo(() => {
    if (selectedAziendaFilter === "all") return incrociByAzienda;
    return incrociByAzienda.filter(g => g.azienda.id === selectedAziendaFilter);
  }, [incrociByAzienda, selectedAziendaFilter]);

  const filteredFondiMatchesByAzienda = useMemo(() => {
    if (selectedAziendaFilter === "all") return fondiMatchesByAzienda;
    return fondiMatchesByAzienda.filter(g => g.azienda.id === selectedAziendaFilter);
  }, [fondiMatchesByAzienda, selectedAziendaFilter]);

  const filteredBadgeMatchesByAzienda = useMemo(() => {
    if (selectedAziendaFilter === "all") return badgeMatchesByAzienda;
    return badgeMatchesByAzienda.filter(g => g.azienda.id === selectedAziendaFilter);
  }, [badgeMatchesByAzienda, selectedAziendaFilter]);

  const filteredAlertMatchesByAzienda = useMemo(() => {
    if (selectedAziendaFilter === "all") return alertMatchesByAzienda;
    return alertMatchesByAzienda.filter(g => g.azienda.id === selectedAziendaFilter);
  }, [alertMatchesByAzienda, selectedAziendaFilter]);

  // Helper: estrae la sigla provincia da una stringa (es. "Via Roma, 00100 Roma (RM)" → "RM")
  const extractProvincia = (str: string | null): string | null => {
    if (!str) return null;
    const match = str.match(/\(([A-Z]{2})\)/);
    return match ? match[1] : null;
  };

  const calculateMatch = (azienda: any, bando: any): { match: boolean; percentage: number; criteria: string[] } => {
    const criteria: string[] = [];
    
    // ========== CRITERI VINCOLANTI ==========
    
    // 1. ATECO - OBBLIGATORIO (se il bando lo richiede)
    if (bando.settore_ateco?.length > 0) {
      if (!azienda.codici_ateco?.length) {
        // Bando richiede ATECO ma azienda non ne ha → NO match
        return { match: false, percentage: 0, criteria: [] };
      }
      const hasAtecoMatch = azienda.codici_ateco.some((codiceAzienda: string) =>
        bando.settore_ateco.some((codiceBando: string) => {
          const gruppoAzienda = codiceAzienda.substring(0, 4);
          const gruppoBando = codiceBando.substring(0, 4);
          return gruppoAzienda === gruppoBando;
        })
      );
      if (!hasAtecoMatch) {
        // Nessun ATECO compatibile → NO match
        return { match: false, percentage: 0, criteria: [] };
      }
      criteria.push("Settore ATECO");
    }
    
    // 2. ZONA - OBBLIGATORIO (se il bando lo richiede)
    const zoneToCheck = bando.zone_applicabilita?.length > 0 
      ? bando.zone_applicabilita 
      : bando.sede_interesse;
      
    if (zoneToCheck?.length > 0) {
      // "Tutta Italia" = match automatico
      if (zoneToCheck.includes("Tutta Italia")) {
        criteria.push("Zona");
      } else {
        // Estrae provincia azienda da sede_operativa o regione
        const aziendaProvincia = extractProvincia(azienda.sede_operativa) 
                              || extractProvincia(azienda.regione);
        const aziendaRegione = azienda.regione?.split(" - ")[0]?.trim();
        
        // Verifica match su provincia O regione
        const zonaMatch = zoneToCheck.some((zona: string) => {
          const zonaProvincia = extractProvincia(zona);
          const zonaRegione = zona.split(" - ")[0]?.trim();
          
          // Se la zona specifica una provincia, deve matchare sulla provincia
          if (zonaProvincia && aziendaProvincia) {
            return zonaProvincia === aziendaProvincia;
          }
          // Altrimenti match su regione
          return zonaRegione === aziendaRegione;
        });
        
        if (!zonaMatch) {
          // Zona non compatibile → NO match
          return { match: false, percentage: 0, criteria: [] };
        }
        criteria.push("Zona");
      }
    }
    
    // 3. DIMENSIONE IMPRESA - VINCOLANTE
    if (bando.tipo_azienda?.length > 0) {
      // I valori sono ora allineati - match diretto
      const dimensioneMatch = bando.tipo_azienda.some((tipo: string) => {
        // Match per dimensione (diretto)
        if (azienda.dimensione_azienda === tipo) return true;
        // Match per qualifica
        if (azienda.qualifiche_azienda?.includes(tipo)) return true;
        return false;
      });
      
      if (!dimensioneMatch) {
        // Dimensione non compatibile → NO match
        return { match: false, percentage: 0, criteria: [] };
      }
      criteria.push("Dimensione");
    }

    // 4. NUMERO DIPENDENTI - VINCOLANTE
    if (bando.numero_dipendenti?.length > 0) {
      if (!azienda.numero_dipendenti || !bando.numero_dipendenti.includes(azienda.numero_dipendenti)) {
        // Prova match con range
        const numDip = parseInt(azienda.numero_dipendenti || '0');
        const inRange = bando.numero_dipendenti.some((range: string) => {
          if (range === '0') return numDip === 0;
          if (range === '+250' || range === '250+' || range === '500+') return numDip >= 250;
          if (range.includes('/')) {
            const parts = range.split('/');
            const min = parseInt(parts[0]);
            const max = parseInt(parts[1]);
            return numDip >= min && numDip <= max;
          }
          return false;
        });
        if (!inRange) {
          return { match: false, percentage: 0, criteria: [] };
        }
      }
      criteria.push("N. Dipendenti");
    }
    
    // 5. COSTITUZIONE SOCIETÀ - VINCOLANTE
    if (bando.costituzione_societa?.length > 0) {
      if (!azienda.costituzione_societa || !bando.costituzione_societa.includes(azienda.costituzione_societa)) {
        return { match: false, percentage: 0, criteria: [] };
      }
      criteria.push("Costituzione");
    }

    // ========== CRITERI FACOLTATIVI (PREMIANTI) ==========
    let totalOptional = 0;
    let matchedOptional = 0;
    
    // Investimenti
    if (bando.investimenti_finanziabili?.length > 0 && azienda.investimenti_interesse?.length > 0) {
      totalOptional++;
      const hasInvestimentiMatch = azienda.investimenti_interesse.some((inv: string) =>
        bando.investimenti_finanziabili.includes(inv)
      );
      if (hasInvestimentiMatch) {
        matchedOptional++;
        criteria.push("Investimenti");
      }
    }
    
    // Spese
    if (bando.spese_ammissibili?.length > 0 && azienda.spese_interesse?.length > 0) {
      totalOptional++;
      const hasSpeseMatch = azienda.spese_interesse.some((spesa: string) =>
        bando.spese_ammissibili.includes(spesa)
      );
      if (hasSpeseMatch) {
        matchedOptional++;
        criteria.push("Spese");
      }
    }
    
    // Calcolo percentuale sui criteri facoltativi
    // Se non ci sono criteri facoltativi, 100% (i vincolanti sono già passati)
    const percentage = totalOptional > 0 
      ? Math.round((matchedOptional / totalOptional) * 100) 
      : 100;
    
    return {
      match: true, // I criteri vincolanti sono già passati
      percentage,
      criteria
    };
  };

  const loadIncroci = async () => {
    try {
      setLoadingData(true);

      // Carica TUTTI i bandi attivi - il matching determinerà quali sono compatibili
      const { data: bandi, error: bandiError } = await supabase
        .from('bandi')
        .select('*')
        .eq('attivo', true);
      if (bandiError) throw bandiError;

      // Per gestore/docente: filtra solo le proprie aziende
      let aziendeQuery = supabase
        .from('aziende')
        .select(`
          *,
          gestore:gestori!aziende_inserita_da_gestore_id_fkey(id, nome, cognome),
          docente:docenti!aziende_inserita_da_docente_id_fkey(id, nome, cognome)
        `);

      if (profile?.role === 'gestore') {
        const { data: gestoreData } = await supabase
          .from('gestori')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        
        if (gestoreData) {
          aziendeQuery = aziendeQuery.eq('inserita_da_gestore_id', gestoreData.id);
        }
      } else if (profile?.role === 'docente') {
        const { data: docenteData } = await supabase
          .from('docenti')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        
        if (docenteData) {
          aziendeQuery = aziendeQuery.eq('inserita_da_docente_id', docenteData.id);
        }
      }

      const { data: aziende, error: aziendeError } = await aziendeQuery;

      if (aziendeError) throw aziendeError;

      const increciTrovati: Incrocio[] = [];
      const aziendeUniche = new Set<string>();
      const bandiUniche = new Set<string>();

      aziende?.forEach((azienda) => {
        bandi?.forEach((bando) => {
          const matchResult = calculateMatch(azienda, bando);
          
          if (matchResult.match) {
            let responsabile = "Non assegnato";
            let responsabileTipo: 'gestore' | 'docente' = 'gestore';

            if (azienda.gestore) {
              responsabile = `${azienda.gestore.nome} ${azienda.gestore.cognome}`;
              responsabileTipo = 'gestore';
            } else if (azienda.docente) {
              responsabile = `${azienda.docente.nome} ${azienda.docente.cognome}`;
              responsabileTipo = 'docente';
            }

            increciTrovati.push({
              id: `${azienda.id}-${bando.id}`,
              azienda_id: azienda.id,
              azienda_nome: azienda.ragione_sociale,
              azienda_piva: azienda.partita_iva,
              bando_id: bando.id,
              bando_nome: bando.titolo,
              responsabile,
              responsabile_tipo: responsabileTipo,
              percentuale_match: matchResult.percentage,
              criteri_matched: matchResult.criteria,
              data_incrocio: new Date().toISOString(),
            });

            aziendeUniche.add(azienda.id);
            bandiUniche.add(bando.id);
          }
        });
      });

      increciTrovati.sort((a, b) => b.percentuale_match - a.percentuale_match);

      setIncroci(increciTrovati);
      setFilteredIncroci(increciTrovati);
      setStats({
        totaleIncroci: increciTrovati.length,
        aziende: aziendeUniche.size,
        bandi: bandiUniche.size,
      });

    } catch (error: any) {
      console.error("Errore caricamento incroci:", error);
      toast.error("Errore nel caricamento degli incroci");
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <PageHeader
          title="Incroci"
          description="Match automatico tra aziende, bandi e fondi basato sui parametri inseriti"
          icon={<Network className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Incroci', icon: 'incroci' }
          ]}
          counters={[
            { label: 'bandi', count: stats.totaleIncroci, variant: 'default' },
            { label: 'aziende', count: stats.aziende, variant: 'info' },
            { label: 'fondi', count: fondiMatches.length, variant: 'success' }
          ]}
        />

        {/* Filtro Azienda e Pulsanti Espandi/Chiudi */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px]">
                <Select value={selectedAziendaFilter} onValueChange={setSelectedAziendaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtra per azienda..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le aziende</SelectItem>
                    {aziendeList.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  <ChevronsUpDown className="h-4 w-4 mr-2" />
                  Espandi tutti
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  <ChevronsDownUp className="h-4 w-4 mr-2" />
                  Chiudi tutti
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="bandi" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bandi ({stats.totaleIncroci})
            </TabsTrigger>
            <TabsTrigger value="fondi" className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Fondi ({fondiMatches.length})
            </TabsTrigger>
            <TabsTrigger value="badge" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Badge Formativi ({badgeMatchesSempreDisponibili.length})
            </TabsTrigger>
            <TabsTrigger value="alert" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alert ({badgeMatchesAProgetto.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Bandi */}
          <TabsContent value="bandi" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Totale Incroci</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totaleIncroci}</div>
                  <p className="text-xs text-muted-foreground">Match trovati</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aziende Coinvolte</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.aziende}</div>
                  <p className="text-xs text-muted-foreground">Con almeno un match</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bandi Attivi</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.bandi}</div>
                  <p className="text-xs text-muted-foreground">Con match disponibili</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per azienda, bando o responsabile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Incroci Grouped by Azienda */}
            <Card>
              <CardHeader>
                <CardTitle>Incroci Bandi ({filteredIncroci.length} match in {filteredIncrociByAzienda.length} aziende)</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredIncrociByAzienda.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || selectedAziendaFilter !== "all" ? "Nessun incrocio trovato con i criteri di ricerca" : "Nessun incrocio disponibile"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredIncrociByAzienda.map((group) => (
                      <Collapsible
                        key={group.azienda.id}
                        open={expandedAziende.has(group.azienda.id)}
                        onOpenChange={() => toggleAzienda(group.azienda.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-4">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-semibold">{group.azienda.nome}</div>
                                <div className="text-sm text-muted-foreground">P.IVA: {group.azienda.piva}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">{group.totaleMatch} match</Badge>
                              <Badge
                                variant={group.avgMatch >= 80 ? "default" : group.avgMatch >= 60 ? "secondary" : "outline"}
                              >
                                Ø {group.avgMatch}%
                              </Badge>
                              {expandedAziende.has(group.azienda.id) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Bando</TableHead>
                                  <TableHead>Match %</TableHead>
                                  <TableHead>Criteri</TableHead>
                                  <TableHead className="text-right">Azioni</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.matches.map((incrocio) => (
                                  <TableRow key={incrocio.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {incrocio.bando_nome}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          incrocio.percentuale_match >= 80
                                            ? "default"
                                            : incrocio.percentuale_match >= 60
                                            ? "secondary"
                                            : "outline"
                                        }
                                      >
                                        {incrocio.percentuale_match}%
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {incrocio.criteri_matched.map((criterio) => {
                                          const isVincolante = criterio === "Settore ATECO" || criterio === "Zona";
                                          return (
                                            <Badge 
                                              key={criterio} 
                                              variant={isVincolante ? "default" : "outline"} 
                                              className={isVincolante 
                                                ? "text-xs bg-green-600 hover:bg-green-700 text-white" 
                                                : "text-xs"
                                              }
                                            >
                                              {isVincolante && "✓ "}
                                              {criterio}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {praticheEsistenti.has(`${incrocio.azienda_id}-${incrocio.bando_id}`) ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                            Richiesta
                                          </span>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            
                                            const { data: existing } = await supabase
                                              .from('pratiche')
                                              .select('id')
                                              .eq('azienda_id', incrocio.azienda_id)
                                              .eq('bando_id', incrocio.bando_id)
                                              .maybeSingle();

                                            if (existing) {
                                              toast.error('Pratica già esistente per questo bando');
                                              return;
                                            }

                                            const { data: newPratica, error } = await supabase.from('pratiche').insert({
                                              azienda_id: incrocio.azienda_id,
                                              bando_id: incrocio.bando_id,
                                              titolo: incrocio.bando_nome || 'Nuova Pratica',
                                              stato: 'richiesta'
                                            }).select('id').single();

                                            if (error) {
                                              toast.error('Errore nella creazione della pratica');
                                              return;
                                            }

                                            // Registra log
                                            if (newPratica && profile?.id) {
                                              await registraLogPratica(
                                                newPratica.id,
                                                profile.id,
                                                profile.role || 'unknown',
                                                'richiesta_pratica',
                                                { 
                                                  titolo: incrocio.bando_nome,
                                                  bando_id: incrocio.bando_id,
                                                  azienda_nome: incrocio.azienda_nome
                                                }
                                              );
                                            }

                                            setPraticheEsistenti(prev => new Set(prev).add(`${incrocio.azienda_id}-${incrocio.bando_id}`));
                                            toast.success('Pratica inviata! Un gestore la prenderà in carico.');
                                          }}
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Richiedi pratica
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Fondi */}
          <TabsContent value="fondi" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Totale Match Fondi</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fondiMatches.length}</div>
                  <p className="text-xs text-muted-foreground">Match trovati</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aziende Coinvolte</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(fondiMatches.map(m => m.azienda.id)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">Con almeno un match</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avvisi Attivi</CardTitle>
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(fondiMatches.map(m => m.avviso.id)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">Con match disponibili</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per azienda, avviso o fondo..."
                    value={searchTermFondi}
                    onChange={(e) => setSearchTermFondi(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fondi Grouped by Azienda */}
            <Card>
              <CardHeader>
                <CardTitle>Incroci Fondi ({filteredFondiMatches.length} match in {filteredFondiMatchesByAzienda.length} aziende)</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredFondiMatchesByAzienda.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTermFondi || selectedAziendaFilter !== "all" ? "Nessun incrocio trovato" : "Nessun incrocio fondi disponibile"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFondiMatchesByAzienda.map((group) => (
                      <Collapsible
                        key={`fondi-${group.azienda.id}`}
                        open={expandedAziende.has(`fondi-${group.azienda.id}`)}
                        onOpenChange={() => toggleAzienda(`fondi-${group.azienda.id}`)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-4">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-semibold">{group.azienda.ragione_sociale}</div>
                                <div className="text-sm text-muted-foreground">P.IVA: {group.azienda.partita_iva}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">{group.totaleMatch} match</Badge>
                              <Badge
                                variant={group.avgMatch >= 80 ? "default" : group.avgMatch >= 60 ? "secondary" : "outline"}
                              >
                                Ø {group.avgMatch}%
                              </Badge>
                              {expandedAziende.has(`fondi-${group.azienda.id}`) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fondo</TableHead>
                                  <TableHead>Avviso</TableHead>
                                  <TableHead>Match %</TableHead>
                                  <TableHead>Criteri</TableHead>
                                  <TableHead className="text-right">Azioni</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.matches.map((match, idx) => (
                                  <TableRow key={`${match.azienda.id}-${match.avviso.id}-${idx}`}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Landmark className="h-4 w-4 text-muted-foreground" />
                                        {match.fondoNome}
                                      </div>
                                    </TableCell>
                                    <TableCell>{match.avviso.titolo}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          match.percentage >= 80
                                            ? "default"
                                            : match.percentage >= 60
                                            ? "secondary"
                                            : "outline"
                                        }
                                      >
                                        {match.percentage}%
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {match.criteria.map((criterio: string) => (
                                          <Badge key={criterio} variant="outline" className="text-xs">
                                            {criterio}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {adesioniEsistenti.has(`${match.azienda.id}-${match.avviso.fondo_id}`) ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                            Attiva
                                          </span>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            
                                            const { data: existing } = await supabase
                                              .from('aziende_fondi')
                                              .select('id')
                                              .eq('azienda_id', match.azienda.id)
                                              .eq('fondo_id', match.avviso.fondo_id)
                                              .maybeSingle();

                                            if (existing) {
                                              toast.error('Adesione già esistente per questo fondo');
                                              return;
                                            }

                                            const { error } = await supabase.from('aziende_fondi').insert({
                                              azienda_id: match.azienda.id,
                                              fondo_id: match.avviso.fondo_id,
                                              data_adesione: new Date().toISOString().split('T')[0],
                                              note: `Adesione creata da incrocio con avviso: ${match.avviso.titolo}`
                                            });

                                            if (error) {
                                              toast.error('Errore nella creazione dell\'adesione');
                                              return;
                                            }

                                            setAdesioniEsistenti(prev => new Set(prev).add(`${match.azienda.id}-${match.avviso.fondo_id}`));
                                            toast.success('Adesione al fondo creata con successo');
                                          }}
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Crea Adesione
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Badge Formativi - Sempre Disponibili */}
          <TabsContent value="badge" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Match Badge</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{badgeMatchesSempreDisponibili.length}</div>
                  <p className="text-xs text-muted-foreground">Avvisi sempre disponibili</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aziende con Badge</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(badgeMatchesSempreDisponibili.map(m => m.azienda.id)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">Con formazione compatibile</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avvisi Sempre Disponibili</CardTitle>
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(badgeMatchesSempreDisponibili.map(m => m.avviso.id)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">Con match attivi</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per azienda, avviso, fondo o badge..."
                    value={searchTermBadge}
                    onChange={(e) => setSearchTermBadge(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Badge Matches Grouped by Azienda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Match Badge Formativi ({filteredBadgeMatches.length} match in {filteredBadgeMatchesByAzienda.length} aziende)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredBadgeMatchesByAzienda.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTermBadge || selectedAziendaFilter !== "all" ? "Nessun match trovato" : "Nessun match badge per avvisi sempre disponibili"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBadgeMatchesByAzienda.map((group) => (
                      <Collapsible
                        key={`badge-${group.azienda.id}`}
                        open={expandedAziende.has(`badge-${group.azienda.id}`)}
                        onOpenChange={() => toggleAzienda(`badge-${group.azienda.id}`)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-4">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-semibold">{group.azienda.ragione_sociale}</div>
                                <div className="text-sm text-muted-foreground">P.IVA: {group.azienda.partita_iva}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">{group.totaleMatch} match</Badge>
                              {expandedAziende.has(`badge-${group.azienda.id}`) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fondo</TableHead>
                                  <TableHead>Avviso</TableHead>
                                  <TableHead>Badge Compatibili</TableHead>
                                  <TableHead className="text-right">Azioni</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.matches.map((match, idx) => (
                                  <TableRow key={`badge-${match.azienda.id}-${match.avviso.id}-${idx}`}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Landmark className="h-4 w-4 text-muted-foreground" />
                                        {match.fondoNome}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                          Sempre Disponibile
                                        </Badge>
                                        <span>{match.avviso.titolo}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {match.matchingBadges.map((badge: string) => (
                                          <Badge key={badge} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                            {badge}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {adesioniEsistenti.has(`${match.azienda.id}-${match.avviso.fondo_id}`) ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                            Attiva
                                          </span>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            
                                            const { error } = await supabase.from('aziende_fondi').insert({
                                              azienda_id: match.azienda.id,
                                              fondo_id: match.avviso.fondo_id,
                                              data_adesione: new Date().toISOString().split('T')[0],
                                              note: `Adesione creata da match badge: ${match.matchingBadges.join(', ')}`
                                            });

                                            if (error) {
                                              toast.error('Errore nella creazione dell\'adesione');
                                              return;
                                            }

                                            setAdesioniEsistenti(prev => new Set(prev).add(`${match.azienda.id}-${match.avviso.fondo_id}`));
                                            toast.success('Adesione al fondo creata con successo');
                                          }}
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Crea Adesione
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Alert - Avvisi a Progetto */}
          <TabsContent value="alert" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Match a Progetto</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{badgeMatchesAProgetto.length}</div>
                  <p className="text-xs text-muted-foreground">Avvisi a progetto con match</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alert Attivi</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{alertEsistenti.length}</div>
                  <p className="text-xs text-muted-foreground">Notifiche configurate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aziende Coinvolte</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(badgeMatchesAProgetto.map(m => m.azienda.id)).size}
                  </div>
                  <p className="text-xs text-muted-foreground">Per avvisi a progetto</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Sistema Alert per Avvisi a Progetto</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Gli avvisi "a progetto" non sono sempre disponibili. Puoi configurare un alert per ogni match: 
                      quando l'avviso sarà attivo, riceverai una notifica per le aziende compatibili.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per azienda, avviso, fondo o badge..."
                    value={searchTermAlert}
                    onChange={(e) => setSearchTermAlert(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alert Matches Grouped by Azienda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Match Avvisi a Progetto ({filteredAlertMatches.length} match in {filteredAlertMatchesByAzienda.length} aziende)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAlertMatchesByAzienda.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTermAlert || selectedAziendaFilter !== "all" ? "Nessun match trovato" : "Nessun match per avvisi a progetto"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAlertMatchesByAzienda.map((group) => (
                      <Collapsible
                        key={`alert-${group.azienda.id}`}
                        open={expandedAziende.has(`alert-${group.azienda.id}`)}
                        onOpenChange={() => toggleAzienda(`alert-${group.azienda.id}`)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-4">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-semibold">{group.azienda.ragione_sociale}</div>
                                <div className="text-sm text-muted-foreground">P.IVA: {group.azienda.partita_iva}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">{group.totaleMatch} match</Badge>
                              {expandedAziende.has(`alert-${group.azienda.id}`) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fondo</TableHead>
                                  <TableHead>Avviso</TableHead>
                                  <TableHead>Badge Compatibili</TableHead>
                                  <TableHead className="text-right">Alert</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.matches.map((match, idx) => {
                                  const hasAlert = alertSet.has(`${match.avviso.id}-${match.azienda.id}`);
                                  
                                  return (
                                    <TableRow key={`alert-${match.azienda.id}-${match.avviso.id}-${idx}`}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Landmark className="h-4 w-4 text-muted-foreground" />
                                          {match.fondoNome}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                            A Progetto
                                          </Badge>
                                          <span>{match.avviso.titolo}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                          {match.matchingBadges.map((badge: string) => (
                                            <Badge key={badge} className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                              {badge}
                                            </Badge>
                                          ))}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {hasAlert ? (
                                          <button
                                            onClick={() => deleteAlertMutation.mutate({ 
                                              avviso_id: match.avviso.id, 
                                              azienda_id: match.azienda.id 
                                            })}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 dark:hover:border-red-800 transition-colors group"
                                          >
                                            <Bell className="h-4 w-4 text-green-600 dark:text-green-400 group-hover:hidden" />
                                            <BellOff className="h-4 w-4 text-red-600 dark:text-red-400 hidden group-hover:block" />
                                            <span className="text-sm font-medium text-green-700 dark:text-green-300 group-hover:text-red-700 dark:group-hover:text-red-300">
                                              Attivo
                                            </span>
                                          </button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800 border-amber-200 dark:border-amber-800"
                                            onClick={() => createAlertMutation.mutate({ 
                                              avviso_id: match.avviso.id, 
                                              azienda_id: match.azienda.id 
                                            })}
                                          >
                                            <Bell className="h-4 w-4 mr-1" />
                                            Crea Alert
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Incroci;
