import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Bando interface - unified schema for all sources
 * Sources: ARSIAL, REGIONE_LAZIO, UE, COMUNE, MANUALE
 * All bandi are normalized to this schema in the central database
 */
export interface Bando {
  id: string;
  titolo: string;
  descrizione: string | null;
  ente: string | null;
  tipo_agevolazione: string | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  attivo: boolean;
  settore_ateco: string[] | null;
  sede_interesse: string[] | null;
  zone_applicabilita: string[] | null;
  tipo_azienda: string[] | null;
  numero_dipendenti: string[] | null;
  costituzione_societa: string[] | null;
  investimenti_finanziabili: string[] | null;
  spese_ammissibili: string[] | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
  link_bando: string | null;
  note: string | null;
  created_at: string;
  // Extended fields for source tracking (optional for backward compat)
  fonte?: string | null;
  livello?: string | null;
  beneficiari?: string[] | null;
  metodo_acquisizione?: string | null;
  data_sync?: string | null;
}

export interface AziendaData {
  id: string;
  ragione_sociale?: string;
  codici_ateco: string[] | null;
  codice_ateco?: string | null; // backward compatibility
  regione: string | null;
  dimensione_azienda: string | null;
  qualifiche_azienda?: string[] | null; // nuovo campo per qualifiche opzionali
  numero_dipendenti: string | null;
  costituzione_societa: string | null;
  investimenti_interesse: string[] | null;
  spese_interesse: string[] | null;
  sede_operativa: string | null;
}

export interface BandoCompatibility extends Bando {
  compatibilita_percentuale: number;
  criteri_soddisfatti: number;
  criteri_totali: number;
  compatibile: boolean;
  dettaglio_criteri: {
    settore: boolean;
    sede: boolean;
    dimensione: boolean;
    dipendenti: boolean;
    costituzione: boolean;
    investimenti: boolean;
    spese: boolean;
  };
  investimenti_match: string[];
  spese_match: string[];
}

export const useBandiCompatibility = () => {
  const { data: bandi = [], isLoading, refetch } = useQuery({
    queryKey: ['bandi-attivi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bandi')
        .select('*')
        .eq('attivo', true)
        .gte('data_chiusura', new Date().toISOString().split('T')[0])
        .order('data_apertura', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Bando[];
    },
  });

  // Helper: estrae la sigla provincia da una stringa (es. "Via Roma, 00100 Roma (RM)" → "RM")
  const extractProvincia = (str: string | null): string | null => {
    if (!str) return null;
    const match = str.match(/\(([A-Z]{2})\)/);
    return match ? match[1] : null;
  };

  // Helper: ottiene i codici ATECO dell'azienda (supporta sia array che singolo codice)
  const getAziendaAtecoCodes = (aziendaData: AziendaData): string[] => {
    if (aziendaData.codici_ateco && aziendaData.codici_ateco.length > 0) {
      return aziendaData.codici_ateco;
    }
    if (aziendaData.codice_ateco) {
      return [aziendaData.codice_ateco];
    }
    return [];
  };

  // Helper: converte costituzione_societa testuale in mesi
  const costituzioneToMesi = (costituzione: string | null): number | null => {
    if (!costituzione) return null;
    
    // Se è già un numero (anno), calcola i mesi
    const annoValue = parseInt(costituzione);
    if (!isNaN(annoValue) && annoValue > 1900 && annoValue <= new Date().getFullYear()) {
      return (new Date().getFullYear() - annoValue) * 12;
    }
    
    // Altrimenti interpreta come range testuale
    switch (costituzione) {
      case 'Fino a 12 mesi': return 6; // media
      case 'Da 12 a 24 mesi': return 18;
      case 'Da 24 a 36 mesi': return 30;
      case 'Da 36 a 60 mesi': return 48;
      case 'Oltre 60 mesi': return 72;
      default: return null;
    }
  };

  // Helper: verifica se un range di costituzione è compatibile
  const matchCostituzione = (aziendaCostit: string | null, bandoRanges: string[]): boolean => {
    if (!aziendaCostit) return false;
    
    // Se l'azienda ha esattamente uno dei range richiesti
    if (bandoRanges.includes(aziendaCostit)) return true;
    
    // Calcola i mesi per confronto
    const aziendaMesi = costituzioneToMesi(aziendaCostit);
    if (aziendaMesi === null) return false;
    
    return bandoRanges.some(range => {
      if (range === 'Fino a 12 mesi') return aziendaMesi <= 12;
      if (range === 'Da 12 a 24 mesi') return aziendaMesi > 12 && aziendaMesi <= 24;
      if (range === 'Da 24 a 36 mesi') return aziendaMesi > 24 && aziendaMesi <= 36;
      if (range === 'Da 24 a 60 mesi') return aziendaMesi > 24 && aziendaMesi <= 60;
      if (range === 'Da 36 a 60 mesi') return aziendaMesi > 36 && aziendaMesi <= 60;
      if (range === 'Oltre 60 mesi') return aziendaMesi > 60;
      if (range === 'Da costituire') return aziendaMesi <= 0;
      return false;
    });
  };

  // Helper: verifica match numero dipendenti
  const matchDipendenti = (aziendaDip: string | null, bandoRanges: string[]): boolean => {
    if (!aziendaDip) return false;
    
    // Match diretto
    if (bandoRanges.includes(aziendaDip)) return true;
    
    // Estrai numero medio dal range azienda
    let numDipendenti = 0;
    if (aziendaDip === '0') numDipendenti = 0;
    else if (aziendaDip === '500+') numDipendenti = 500;
    else if (aziendaDip.includes('/')) {
      const parts = aziendaDip.split('/');
      const min = parseInt(parts[0]);
      const max = parseInt(parts[1]);
      numDipendenti = Math.floor((min + max) / 2);
    } else {
      numDipendenti = parseInt(aziendaDip) || 0;
    }
    
    return bandoRanges.some(range => {
      if (range === '0') return numDipendenti === 0;
      if (range === '+250' || range === '250+' || range === '500+') return numDipendenti >= 250;
      if (range.includes('/')) {
        const parts = range.split('/');
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);
        return numDipendenti >= min && numDipendenti <= max;
      }
      return false;
    });
  };

  const calculateCompatibility = (
    aziendaData: AziendaData,
    bandi: Bando[]
  ): BandoCompatibility[] => {
    return bandi.map(bando => {
      let criteriSoddisfatti = 0;
      let criteriTotali = 0;
      let investimentiMatch: string[] = [];
      let speseMatch: string[] = [];
      let isCompatibile = true; // Flag per criteri vincolanti

      const dettaglioCriteri = {
        settore: true,
        sede: true,
        dimensione: true,
        dipendenti: true,
        costituzione: true,
        investimenti: true,
        spese: true,
      };

      // ========== CRITERI VINCOLANTI ==========

      // 1. ATECO - VINCOLANTE
      if (bando.settore_ateco && bando.settore_ateco.length > 0) {
        const aziendaAteco = getAziendaAtecoCodes(aziendaData);
        if (aziendaAteco.length === 0) {
          // Bando richiede ATECO ma azienda non ne ha
          isCompatibile = false;
          dettaglioCriteri.settore = false;
        } else {
          const hasMatch = aziendaAteco.some(ateco =>
            bando.settore_ateco?.some(bandoAteco => {
              // Match a livello di gruppo (primi 4 caratteri: XX.X)
              const gruppoAzienda = ateco.substring(0, 4);
              const gruppoBando = bandoAteco.substring(0, 4);
              return gruppoAzienda === gruppoBando;
            })
          );
          dettaglioCriteri.settore = hasMatch;
          if (!hasMatch) {
            isCompatibile = false;
          }
        }
      }

      // 2. ZONA - VINCOLANTE
      const zoneToCheck = (bando.zone_applicabilita && bando.zone_applicabilita.length > 0) 
        ? bando.zone_applicabilita 
        : bando.sede_interesse;
      
      if (zoneToCheck && zoneToCheck.length > 0) {
        if (zoneToCheck.includes('Tutta Italia')) {
          dettaglioCriteri.sede = true;
        } else {
          const aziendaProvincia = extractProvincia(aziendaData.sede_operativa) 
                                || extractProvincia(aziendaData.regione);
          const aziendaRegione = aziendaData.regione?.split(" - ")[0]?.trim();
          
          const zonaMatch = zoneToCheck.some((zona: string) => {
            const zonaProvincia = extractProvincia(zona);
            const zonaRegione = zona.split(" - ")[0]?.trim();
            
            if (zonaProvincia && aziendaProvincia) {
              return zonaProvincia === aziendaProvincia;
            }
            return zonaRegione === aziendaRegione;
          });
          
          dettaglioCriteri.sede = zonaMatch;
          if (!zonaMatch) {
            isCompatibile = false;
          }
        }
      }

      // 3. DIMENSIONE IMPRESA - VINCOLANTE
      if (bando.tipo_azienda && bando.tipo_azienda.length > 0) {
        // I valori sono ora allineati - match diretto
        const dimensioneMatch = bando.tipo_azienda.some(tipo => {
          // Match per dimensione (diretto)
          if (aziendaData.dimensione_azienda === tipo) return true;
          // Match per qualifica
          if (aziendaData.qualifiche_azienda?.includes(tipo)) return true;
          return false;
        });
        
        dettaglioCriteri.dimensione = dimensioneMatch;
        if (!dimensioneMatch) {
          isCompatibile = false;
        }
      }

      // Se i criteri vincolanti non sono soddisfatti, ritorna 0%
      if (!isCompatibile) {
        return {
          ...bando,
          compatibilita_percentuale: 0,
          criteri_soddisfatti: 0,
          criteri_totali: 0,
          compatibile: false,
          dettaglio_criteri: dettaglioCriteri,
          investimenti_match: [],
          spese_match: [],
        };
      }

      // ========== CRITERI VINCOLANTI AGGIUNTIVI ==========

      // 4. NUMERO DIPENDENTI - VINCOLANTE
      if (bando.numero_dipendenti && bando.numero_dipendenti.length > 0) {
        dettaglioCriteri.dipendenti = matchDipendenti(aziendaData.numero_dipendenti, bando.numero_dipendenti);
        if (!dettaglioCriteri.dipendenti) {
          isCompatibile = false;
        }
      }

      // 5. COSTITUZIONE SOCIETÀ - VINCOLANTE
      if (bando.costituzione_societa && bando.costituzione_societa.length > 0) {
        dettaglioCriteri.costituzione = matchCostituzione(aziendaData.costituzione_societa, bando.costituzione_societa);
        if (!dettaglioCriteri.costituzione) {
          isCompatibile = false;
        }
      }

      // Se i criteri vincolanti non sono soddisfatti, ritorna 0%
      if (!isCompatibile) {
        return {
          ...bando,
          compatibilita_percentuale: 0,
          criteri_soddisfatti: 0,
          criteri_totali: 0,
          compatibile: false,
          dettaglio_criteri: dettaglioCriteri,
          investimenti_match: [],
          spese_match: [],
        };
      }

      // ========== CRITERI FACOLTATIVI (PREMIANTI) ==========

      // Investimenti finanziabili
      if (bando.investimenti_finanziabili && bando.investimenti_finanziabili.length > 0) {
        criteriTotali++;
        if (aziendaData.investimenti_interesse && aziendaData.investimenti_interesse.length > 0) {
          investimentiMatch = aziendaData.investimenti_interesse.filter(inv =>
            bando.investimenti_finanziabili?.includes(inv)
          );
          dettaglioCriteri.investimenti = investimentiMatch.length > 0;
        } else {
          dettaglioCriteri.investimenti = false;
        }
        if (dettaglioCriteri.investimenti) criteriSoddisfatti++;
      }

      // Spese ammissibili
      if (bando.spese_ammissibili && bando.spese_ammissibili.length > 0) {
        criteriTotali++;
        if (aziendaData.spese_interesse && aziendaData.spese_interesse.length > 0) {
          speseMatch = aziendaData.spese_interesse.filter(spesa =>
            bando.spese_ammissibili?.includes(spesa)
          );
          dettaglioCriteri.spese = speseMatch.length > 0;
        } else {
          dettaglioCriteri.spese = false;
        }
        if (dettaglioCriteri.spese) criteriSoddisfatti++;
      }

      // Se non ci sono criteri facoltativi, 100% (i vincolanti sono già passati)
      const compatibilitaPercentuale = criteriTotali > 0 
        ? Math.round((criteriSoddisfatti / criteriTotali) * 100)
        : 100;

      return {
        ...bando,
        compatibilita_percentuale: compatibilitaPercentuale,
        criteri_soddisfatti: criteriSoddisfatti,
        criteri_totali: criteriTotali,
        compatibile: true, // I criteri vincolanti sono già passati
        dettaglio_criteri: dettaglioCriteri,
        investimenti_match: investimentiMatch,
        spese_match: speseMatch,
      };
    });
  };

  return {
    bandi,
    isLoading,
    calculateCompatibility,
    refetch,
  };
};
