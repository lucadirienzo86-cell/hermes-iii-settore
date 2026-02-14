import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AttivitaTerritorio {
  id: string;
  associazione_id: string;
  titolo: string;
  descrizione: string | null;
  tipo: string | null;
  data_inizio: string | null;
  data_fine: string | null;
  luogo: string | null;
  patrocinato_comune: boolean;
  stato: string;
  created_at: string;
  // Joined
  associazione?: {
    denominazione: string;
  };
}

export const useAttivitaTerritorio = (filters?: { stato?: string; patrocinato?: boolean }) => {
  return useQuery({
    queryKey: ['attivita-territorio', filters],
    queryFn: async (): Promise<AttivitaTerritorio[]> => {
      let query = supabase
        .from('attivita_territorio')
        .select(`
          *,
          associazione:associazioni_terzo_settore(denominazione)
        `)
        .order('data_inizio', { ascending: false });
      
      if (filters?.stato) {
        query = query.eq('stato', filters.stato);
      }
      if (filters?.patrocinato !== undefined) {
        query = query.eq('patrocinato_comune', filters.patrocinato);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    },
  });
};

export const useUpdateAttivita = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AttivitaTerritorio> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('attivita_territorio')
        .update({
          titolo: data.titolo,
          descrizione: data.descrizione,
          tipo: data.tipo,
          data_inizio: data.data_inizio,
          data_fine: data.data_fine,
          luogo: data.luogo,
          patrocinato_comune: data.patrocinato_comune,
          stato: data.stato,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attivita-territorio'] });
      queryClient.invalidateQueries({ queryKey: ['terzo-settore-stats'] });
      toast({ title: 'Attività aggiornata' });
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
