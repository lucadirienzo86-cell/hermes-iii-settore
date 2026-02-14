import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface EsercizioContabile {
  id: string;
  associazione_id: string;
  anno: number;
  data_inizio: string;
  data_fine: string;
  stato: 'aperto' | 'chiuso' | 'in_elaborazione';
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaContabile {
  id: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  modello: 'mod_a' | 'mod_b' | 'mod_c' | 'mod_d';
  sezione: string | null;
  voce_principale: string | null;
  sottovoce: string | null;
  ordine: number;
  modificabile: boolean;
  attivo: boolean;
}

export interface MovimentoContabile {
  id: string;
  associazione_id: string;
  esercizio_id: string;
  categoria_id: string;
  progetto_id: string | null;
  tipo: 'entrata' | 'uscita';
  data_movimento: string;
  importo: number;
  descrizione: string;
  beneficiario_pagatore: string | null;
  metodo_pagamento: string | null;
  riferimento_documento: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  categoria?: CategoriaContabile;
  progetto?: ProgettoContabile;
}

export interface ProgettoContabile {
  id: string;
  associazione_id: string;
  esercizio_id: string | null;
  titolo: string;
  descrizione: string | null;
  cig: string | null;
  cup: string | null;
  ente_finanziatore: string | null;
  importo_finanziato: number | null;
  importo_rendicontato: number | null;
  data_inizio: string | null;
  data_fine: string | null;
  stato: 'attivo' | 'completato' | 'rendicontato' | 'archiviato';
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentoContabile {
  id: string;
  movimento_id: string;
  nome_file: string;
  file_path: string;
  tipo_documento: string | null;
  mime_type: string | null;
  dimensione: number | null;
  note: string | null;
  created_at: string;
}

export interface RelazioneMissione {
  id: string;
  associazione_id: string;
  esercizio_id: string;
  missione_statutaria: string | null;
  attivita_interesse_generale: string | null;
  attivita_diverse: string | null;
  raccolta_fondi: string | null;
  numero_volontari: number;
  numero_dipendenti: number;
  numero_soci: number;
  situazione_economica: string | null;
  obiettivi_raggiunti: string | null;
  obiettivi_futuri: string | null;
  informazioni_aggiuntive: string | null;
  bozza: boolean;
  data_approvazione: string | null;
  approvato_da: string | null;
  created_at: string;
  updated_at: string;
}

// Hook per esercizi contabili
export function useEserciziContabili(associazioneId: string | undefined) {
  return useQuery({
    queryKey: ['esercizi-contabili', associazioneId],
    queryFn: async () => {
      if (!associazioneId) return [];
      const { data, error } = await supabase
        .from('esercizi_contabili')
        .select('*')
        .eq('associazione_id', associazioneId)
        .order('anno', { ascending: false });
      if (error) throw error;
      return data as EsercizioContabile[];
    },
    enabled: !!associazioneId,
  });
}

// Hook per categorie contabili (Mod. D di default)
export function useCategorieContabili(modello: 'mod_a' | 'mod_b' | 'mod_c' | 'mod_d' = 'mod_d') {
  return useQuery({
    queryKey: ['categorie-contabili', modello],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorie_contabili')
        .select('*')
        .eq('modello', modello)
        .eq('attivo', true)
        .order('ordine');
      if (error) throw error;
      return data as CategoriaContabile[];
    },
  });
}

// Hook per movimenti contabili
export function useMovimentiContabili(esercizioId: string | undefined) {
  return useQuery({
    queryKey: ['movimenti-contabili', esercizioId],
    queryFn: async () => {
      if (!esercizioId) return [];
      const { data, error } = await supabase
        .from('movimenti_contabili')
        .select(`
          *,
          categoria:categorie_contabili(*),
          progetto:progetti_contabili(*)
        `)
        .eq('esercizio_id', esercizioId)
        .order('data_movimento', { ascending: false });
      if (error) throw error;
      return data as MovimentoContabile[];
    },
    enabled: !!esercizioId,
  });
}

// Hook per progetti contabili
export function useProgettiContabili(associazioneId: string | undefined) {
  return useQuery({
    queryKey: ['progetti-contabili', associazioneId],
    queryFn: async () => {
      if (!associazioneId) return [];
      const { data, error } = await supabase
        .from('progetti_contabili')
        .select('*')
        .eq('associazione_id', associazioneId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProgettoContabile[];
    },
    enabled: !!associazioneId,
  });
}

// Hook per statistiche cassa
export function useStatisticheCassa(esercizioId: string | undefined) {
  return useQuery({
    queryKey: ['statistiche-cassa', esercizioId],
    queryFn: async () => {
      if (!esercizioId) return { entrate: 0, uscite: 0, saldo: 0 };
      
      const { data, error } = await supabase
        .from('movimenti_contabili')
        .select('tipo, importo')
        .eq('esercizio_id', esercizioId);
      
      if (error) throw error;
      
      const entrate = data
        .filter(m => m.tipo === 'entrata')
        .reduce((acc, m) => acc + Number(m.importo), 0);
      
      const uscite = data
        .filter(m => m.tipo === 'uscita')
        .reduce((acc, m) => acc + Number(m.importo), 0);
      
      return {
        entrate,
        uscite,
        saldo: entrate - uscite,
      };
    },
    enabled: !!esercizioId,
  });
}

// Mutation per creare esercizio
export function useCreateEsercizio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      associazione_id: string;
      anno: number;
      data_inizio: string;
      data_fine: string;
      note?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('esercizi_contabili')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['esercizi-contabili', variables.associazione_id] });
      toast({ title: 'Esercizio creato', description: `Esercizio ${variables.anno} creato con successo` });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });
}

// Mutation per creare movimento
export function useCreateMovimento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<MovimentoContabile, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'progetto'>) => {
      const { data: result, error } = await supabase
        .from('movimenti_contabili')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movimenti-contabili', variables.esercizio_id] });
      queryClient.invalidateQueries({ queryKey: ['statistiche-cassa', variables.esercizio_id] });
      toast({ title: 'Movimento registrato', description: 'Il movimento è stato salvato correttamente' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });
}

// Mutation per creare progetto
export function useCreateProgetto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<ProgettoContabile, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('progetti_contabili')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progetti-contabili', variables.associazione_id] });
      toast({ title: 'Progetto creato', description: 'Il progetto è stato salvato correttamente' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook per relazione di missione
export function useRelazioneMissione(esercizioId: string | undefined) {
  return useQuery({
    queryKey: ['relazione-missione', esercizioId],
    queryFn: async () => {
      if (!esercizioId) return null;
      const { data, error } = await supabase
        .from('relazioni_missione')
        .select('*')
        .eq('esercizio_id', esercizioId)
        .maybeSingle();
      if (error) throw error;
      return data as RelazioneMissione | null;
    },
    enabled: !!esercizioId,
  });
}

// Mutation per salvare relazione di missione
export function useSaveRelazioneMissione() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<RelazioneMissione, 'id' | 'created_at' | 'updated_at' | 'data_approvazione' | 'approvato_da'>) => {
      const { data: result, error } = await supabase
        .from('relazioni_missione')
        .upsert(data, { onConflict: 'associazione_id,esercizio_id' })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['relazione-missione', variables.esercizio_id] });
      toast({ title: 'Salvato', description: 'La relazione di missione è stata salvata' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook per calcolare rendiconto Mod. D
export function useRendicontoModD(esercizioId: string | undefined) {
  const { data: movimenti } = useMovimentiContabili(esercizioId);
  const { data: categorie } = useCategorieContabili('mod_d');

  return useQuery({
    queryKey: ['rendiconto-mod-d', esercizioId, movimenti?.length, categorie?.length],
    queryFn: () => {
      if (!movimenti || !categorie) return null;

      const rendiconto: Record<string, { 
        codice: string;
        nome: string;
        voce_principale: string | null;
        importo_corrente: number;
        importo_precedente: number;
        sezione: string | null;
        ordine: number;
      }> = {};

      // Inizializza tutte le categorie
      categorie.forEach(cat => {
        rendiconto[cat.codice] = {
          codice: cat.codice,
          nome: cat.nome,
          voce_principale: cat.voce_principale,
          importo_corrente: 0,
          importo_precedente: 0, // Da implementare con esercizio precedente
          sezione: cat.sezione,
          ordine: cat.ordine,
        };
      });

      // Calcola totali per categoria
      movimenti.forEach(mov => {
        if (mov.categoria) {
          const codice = mov.categoria.codice;
          if (rendiconto[codice]) {
            rendiconto[codice].importo_corrente += Number(mov.importo);
          }
        }
      });

      // Ordina per ordine
      const sorted = Object.values(rendiconto).sort((a, b) => a.ordine - b.ordine);

      // Calcola totali sezione
      const totaleEntrate = sorted
        .filter(r => r.sezione === 'ENTRATE' && r.codice.length <= 3)
        .reduce((acc, r) => acc + r.importo_corrente, 0);

      const totaleUscite = sorted
        .filter(r => r.sezione === 'USCITE' && r.codice.length <= 3)
        .reduce((acc, r) => acc + r.importo_corrente, 0);

      return {
        voci: sorted,
        totaleEntrate,
        totaleUscite,
        avanzoDisavanzo: totaleEntrate - totaleUscite,
      };
    },
    enabled: !!esercizioId && !!movimenti && !!categorie,
  });
}
