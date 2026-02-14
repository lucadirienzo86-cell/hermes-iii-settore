import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Avviso {
  id: string;
  titolo: string;
  descrizione: string | null;
  fondo_id: string;
  numero_avviso: string | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  attivo: boolean;
  settore_ateco: string[] | null;
  regioni: string[] | null;
  dimensione_azienda: string[] | null;
  numero_dipendenti: string[] | null;
  badge_formativi: string[] | null;
  tematiche: string[] | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
  link_avviso: string | null;
  pdf_urls: string[] | null;
  note: string | null;
  fondo?: {
    id: string;
    nome: string;
    codice: string | null;
  };
}

export interface AziendaData {
  id: string;
  ragione_sociale?: string;
  codici_ateco: string[] | null;
  regione: string | null;
  dimensione_azienda: string | null;
  numero_dipendenti: string | null;
  badge_formativi: string[] | null;
  sede_operativa: string | null;
}

export interface AvvisoCompatibility extends Avviso {
  compatibilita_percentuale: number;
  criteri_soddisfatti: number;
  criteri_totali: number;
  compatibile: boolean;
  dettaglio_criteri: {
    settore: boolean;
    regione: boolean;
    dimensione: boolean;
    dipendenti: boolean;
    badge: boolean;
  };
  badge_match: string[];
}

export const useFondiCompatibilityApp = () => {
  const { data: avvisi = [], isLoading, refetch } = useQuery({
    queryKey: ['avvisi-fondi-attivi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avvisi_fondi')
        .select(`
          *,
          fondo:fondi_interprofessionali(id, nome, codice)
        `)
        .eq('attivo', true)
        .order('data_apertura', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Avviso[];
    },
  });

  // Filter active avvisi with valid dates
  const avvisiAttivi = avvisi.filter(avviso => {
    if (!avviso.data_chiusura) return true;
    return new Date(avviso.data_chiusura) >= new Date();
  });

  const calculateCompatibility = (
    aziendaData: AziendaData,
    avvisi: Avviso[]
  ): AvvisoCompatibility[] => {
    return avvisi.map(avviso => {
      let criteriSoddisfatti = 0;
      let criteriTotali = 0;
      let badgeMatch: string[] = [];
      let isCompatibile = true; // Flag per criteri vincolanti

      const dettaglioCriteri = {
        settore: true,
        regione: true,
        dimensione: true,
        dipendenti: true,
        badge: true,
      };

      // ========== CRITERI VINCOLANTI ==========

      // 1. ATECO - VINCOLANTE
      if (avviso.settore_ateco && avviso.settore_ateco.length > 0) {
        const hasMatch = aziendaData.codici_ateco?.some(ateco =>
          avviso.settore_ateco?.some(avvisoAteco => 
            ateco.startsWith(avvisoAteco.split('.')[0])
          )
        );
        dettaglioCriteri.settore = hasMatch || false;
        if (!dettaglioCriteri.settore) {
          isCompatibile = false;
        }
      }

      // 2. REGIONE - VINCOLANTE
      if (avviso.regioni && avviso.regioni.length > 0) {
        const hasTuttaItalia = avviso.regioni.includes('Tutta Italia');
        const regioneMatch = avviso.regioni.includes(aziendaData.regione || '');
        const sedeMatch = avviso.regioni.includes(aziendaData.sede_operativa || '');
        const regioneFromSede = aziendaData.sede_operativa?.split(' - ')[0];
        const regioneFromRegione = aziendaData.regione?.split(' - ')[0];
        const regionePartialMatch = avviso.regioni.some(r => 
          r === regioneFromSede || r === regioneFromRegione
        );
        
        dettaglioCriteri.regione = hasTuttaItalia || regioneMatch || sedeMatch || regionePartialMatch;
        if (!dettaglioCriteri.regione) {
          isCompatibile = false;
        }
      }

      // 3. DIMENSIONE IMPRESA - VINCOLANTE
      if (avviso.dimensione_azienda && avviso.dimensione_azienda.length > 0) {
        dettaglioCriteri.dimensione = avviso.dimensione_azienda.includes(aziendaData.dimensione_azienda || '');
        if (!dettaglioCriteri.dimensione) {
          isCompatibile = false;
        }
      }

      // Se i criteri vincolanti non sono soddisfatti, ritorna 0%
      if (!isCompatibile) {
        return {
          ...avviso,
          compatibilita_percentuale: 0,
          criteri_soddisfatti: 0,
          criteri_totali: 0,
          compatibile: false,
          dettaglio_criteri: dettaglioCriteri,
          badge_match: [],
        };
      }

      // 4. NUMERO DIPENDENTI - VINCOLANTE
      if (avviso.numero_dipendenti && avviso.numero_dipendenti.length > 0) {
        const numDipendenti = parseInt(aziendaData.numero_dipendenti || '0');
        const inRange = avviso.numero_dipendenti.some(range => {
          if (range === '+250') return numDipendenti > 250;
          if (range.includes('/')) {
            const [min, max] = range.split('/').map(n => parseInt(n));
            return numDipendenti >= min && numDipendenti <= max;
          }
          return range === aziendaData.numero_dipendenti;
        });
        dettaglioCriteri.dipendenti = inRange;
        if (!dettaglioCriteri.dipendenti) {
          isCompatibile = false;
        }
      }

      // Se i criteri vincolanti non sono soddisfatti, ritorna 0%
      if (!isCompatibile) {
        return {
          ...avviso,
          compatibilita_percentuale: 0,
          criteri_soddisfatti: 0,
          criteri_totali: 0,
          compatibile: false,
          dettaglio_criteri: dettaglioCriteri,
          badge_match: [],
        };
      }

      // ========== CRITERI FACOLTATIVI (PREMIANTI) ==========

      // Verifica badge formativi
      if (avviso.badge_formativi && avviso.badge_formativi.length > 0) {
        criteriTotali++;
        if (aziendaData.badge_formativi && aziendaData.badge_formativi.length > 0) {
          badgeMatch = aziendaData.badge_formativi.filter(badge =>
            avviso.badge_formativi?.includes(badge)
          );
          dettaglioCriteri.badge = badgeMatch.length > 0;
        } else {
          // Se l'azienda non ha badge, consideriamo comunque l'avviso compatibile per questo criterio
          dettaglioCriteri.badge = true;
        }
        if (dettaglioCriteri.badge) criteriSoddisfatti++;
      }

      // Se non ci sono criteri facoltativi, 100% (i vincolanti sono già passati)
      const compatibilitaPercentuale = criteriTotali > 0 
        ? Math.round((criteriSoddisfatti / criteriTotali) * 100)
        : 100;

      return {
        ...avviso,
        compatibilita_percentuale: compatibilitaPercentuale,
        criteri_soddisfatti: criteriSoddisfatti,
        criteri_totali: criteriTotali,
        compatibile: true, // I criteri vincolanti sono già passati
        dettaglio_criteri: dettaglioCriteri,
        badge_match: badgeMatch,
      };
    });
  };

  return {
    avvisi: avvisiAttivi,
    isLoading,
    calculateCompatibility,
    refetch,
  };
};
