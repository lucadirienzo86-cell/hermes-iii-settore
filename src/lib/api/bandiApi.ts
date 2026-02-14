import { supabase } from '@/integrations/supabase/client';

/**
 * Unified Bandi API Client
 * 
 * This client provides access to the centralized bandi database.
 * All sources (ARSIAL, Regione Lazio, EU, manual uploads) are normalized
 * and accessible through this single API.
 * 
 * The frontend should NEVER call external sources directly.
 */

export interface BandoAPI {
  id: string;
  titolo: string;
  descrizione: string | null;
  ente: string | null;
  livello: 'UE' | 'NAZ' | 'REG' | 'COM' | null;
  fonte: string | null;
  metodo_acquisizione: 'API' | 'SCRAPING' | 'UPLOAD' | null;
  data_sync: string | null;
  stato: string | null;
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
  beneficiari: string[] | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
  link_bando: string | null;
  note: string | null;
  created_at: string;
}

export interface BandiFilters {
  fonte?: string;
  livello?: 'UE' | 'NAZ' | 'REG' | 'COM';
  attivo?: boolean;
  settore_ateco?: string;
  regione?: string;
  tipo_azienda?: string;
  limit?: number;
  offset?: number;
}

export interface BandiResponse {
  success: boolean;
  data: BandoAPI[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface SingleBandoResponse {
  success: boolean;
  data: BandoAPI;
  error?: string;
}

/**
 * Fetch bandi from the centralized API
 * Supports filtering by fonte, livello, regione, etc.
 */
export async function fetchBandi(filters?: BandiFilters): Promise<BandiResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.fonte) params.append('fonte', filters.fonte);
    if (filters?.livello) params.append('livello', filters.livello);
    if (filters?.attivo !== undefined) params.append('attivo', String(filters.attivo));
    if (filters?.settore_ateco) params.append('settore_ateco', filters.settore_ateco);
    if (filters?.regione) params.append('regione', filters.regione);
    if (filters?.tipo_azienda) params.append('tipo_azienda', filters.tipo_azienda);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const path = queryString ? `bandi-api?${queryString}` : 'bandi-api';

    const { data, error } = await supabase.functions.invoke(path, {
      method: 'GET',
    });

    if (error) {
      console.error('[bandiApi] Error fetching bandi:', error);
      return {
        success: false,
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
        error: error.message,
      };
    }

    return data as BandiResponse;
  } catch (error) {
    console.error('[bandiApi] Unexpected error:', error);
    return {
      success: false,
      data: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch a single bando by ID
 */
export async function fetchBandoById(id: string): Promise<SingleBandoResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke(`bandi-api/${id}`, {
      method: 'GET',
    });

    if (error) {
      console.error('[bandiApi] Error fetching bando:', error);
      return null;
    }

    return data as SingleBandoResponse;
  } catch (error) {
    console.error('[bandiApi] Unexpected error:', error);
    return null;
  }
}

/**
 * Upload bandi manually (admin only)
 * Accepts single bando or array of bandi
 */
export async function uploadBandi(bandi: Partial<BandoAPI> | Partial<BandoAPI>[]): Promise<{
  success: boolean;
  uploaded: number;
  errors: number;
  details: { titolo: string; status: 'created' | 'error'; error?: string }[];
}> {
  try {
    const { data, error } = await supabase.functions.invoke('bandi-upload', {
      method: 'POST',
      body: { bandi: Array.isArray(bandi) ? bandi : [bandi] },
    });

    if (error) {
      console.error('[bandiApi] Error uploading bandi:', error);
      return {
        success: false,
        uploaded: 0,
        errors: 1,
        details: [{ titolo: 'Upload', status: 'error', error: error.message }],
      };
    }

    return data;
  } catch (error) {
    console.error('[bandiApi] Unexpected error:', error);
    return {
      success: false,
      uploaded: 0,
      errors: 1,
      details: [{ titolo: 'Upload', status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }],
    };
  }
}

/**
 * Trigger manual sync of external sources (admin only)
 * Can sync all sources or a specific one
 */
export async function triggerSync(fonte?: string): Promise<{
  success: boolean;
  totals: {
    bandi_trovati: number;
    bandi_nuovi: number;
    bandi_aggiornati: number;
    errori: number;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('bandi-sync', {
      method: 'POST',
      body: fonte ? { fonte } : {},
    });

    if (error) {
      console.error('[bandiApi] Error triggering sync:', error);
      return {
        success: false,
        totals: { bandi_trovati: 0, bandi_nuovi: 0, bandi_aggiornati: 0, errori: 1 },
        error: error.message,
      };
    }

    return data;
  } catch (error) {
    console.error('[bandiApi] Unexpected error:', error);
    return {
      success: false,
      totals: { bandi_trovati: 0, bandi_nuovi: 0, bandi_aggiornati: 0, errori: 1 },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export livello labels for UI
export const LIVELLO_LABELS: Record<string, string> = {
  UE: 'Unione Europea',
  NAZ: 'Nazionale',
  REG: 'Regionale',
  COM: 'Comunale',
};

// Export fonte labels for UI
export const FONTE_LABELS: Record<string, string> = {
  ARSIAL: 'ARSIAL',
  REGIONE_LAZIO: 'Regione Lazio',
  UE: 'Unione Europea',
  COMUNE: 'Comune',
  MANUALE: 'Inserimento Manuale',
  INVITALIA: 'Invitalia',
  MISE: 'MISE',
  ALTRO: 'Altra Fonte',
};
