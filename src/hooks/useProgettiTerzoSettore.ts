import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProgettoTerzoSettore {
  id: string;
  bando_id: string;
  associazione_id: string;
  titolo: string;
  descrizione: string | null;
  stato: 'candidatura_inviata' | 'in_valutazione' | 'approvato' | 'respinto' | 'avviato' | 'in_corso' | 'completato';
  importo_richiesto: number | null;
  importo_approvato: number | null;
  data_candidatura: string;
  data_valutazione: string | null;
  data_avvio: string | null;
  data_completamento: string | null;
  note_valutazione: string | null;
  documenti_allegati: any;
  created_at: string;
  // Joined data
  bando?: {
    titolo: string;
    ambito: string | null;
  };
  associazione?: {
    denominazione: string;
    tipologia: string;
  };
}

export const useProgettiTerzoSettore = (filters?: { stato?: string; bandoId?: string }) => {
  return useQuery({
    queryKey: ['progetti-terzo-settore', filters],
    queryFn: async (): Promise<ProgettoTerzoSettore[]> => {
      let query = supabase
        .from('progetti_terzo_settore')
        .select(`
          *,
          bando:bandi_terzo_settore(titolo, ambito),
          associazione:associazioni_terzo_settore(denominazione, tipologia)
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.stato) {
        query = query.eq('stato', filters.stato as any);
      }
      if (filters?.bandoId) {
        query = query.eq('bando_id', filters.bandoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(p => ({
        ...p,
        stato: p.stato as ProgettoTerzoSettore['stato'],
        importo_richiesto: p.importo_richiesto ? Number(p.importo_richiesto) : null,
        importo_approvato: p.importo_approvato ? Number(p.importo_approvato) : null,
      }));
    },
  });
};

export const useUpdateProgettoTS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProgettoTerzoSettore> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('progetti_terzo_settore')
        .update({
          stato: data.stato,
          importo_approvato: data.importo_approvato,
          note_valutazione: data.note_valutazione,
          data_valutazione: data.stato && ['approvato', 'respinto'].includes(data.stato) 
            ? new Date().toISOString() 
            : undefined,
          data_avvio: data.stato === 'avviato' ? new Date().toISOString().split('T')[0] : undefined,
          data_completamento: data.stato === 'completato' ? new Date().toISOString().split('T')[0] : undefined,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progetti-terzo-settore'] });
      queryClient.invalidateQueries({ queryKey: ['terzo-settore-stats'] });
      toast({ title: 'Progetto aggiornato' });
    },
    onError: (error) => {
      toast({ 
        title: 'Errore', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};
