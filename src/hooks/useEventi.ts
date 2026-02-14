import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Evento {
  id: string;
  associazione_id: string;
  pro_loco_id: string | null;
  titolo: string;
  descrizione: string | null;
  luogo: string | null;
  data_inizio: string;
  data_fine: string | null;
  prezzo_biglietto: number | null;
  posti_disponibili: number | null;
  posti_venduti: number;
  immagine_url: string | null;
  payment_link_id: string | null;
  attivo: boolean;
  created_at: string;
}

interface CreateEventoParams {
  associazione_id: string;
  pro_loco_id?: string;
  titolo: string;
  descrizione?: string;
  luogo?: string;
  data_inizio: string;
  data_fine?: string;
  prezzo_biglietto?: number;
  posti_disponibili?: number;
}

// Hook for events
export const useEventi = (associazioneId?: string, proLocoId?: string) => {
  return useQuery({
    queryKey: ['eventi', associazioneId, proLocoId],
    queryFn: async () => {
      let query = supabase
        .from('eventi_associazione')
        .select('*')
        .order('data_inizio', { ascending: true });
      
      if (associazioneId) {
        query = query.eq('associazione_id', associazioneId);
      } else if (proLocoId) {
        query = query.eq('pro_loco_id', proLocoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Evento[];
    },
    enabled: !!(associazioneId || proLocoId),
  });
};

// Hook for upcoming events
export const useUpcomingEventi = (associazioneId: string) => {
  return useQuery({
    queryKey: ['eventi-upcoming', associazioneId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('eventi_associazione')
        .select('*')
        .eq('associazione_id', associazioneId)
        .eq('attivo', true)
        .gte('data_inizio', now)
        .order('data_inizio', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data as Evento[];
    },
    enabled: !!associazioneId,
  });
};

// Mutation for creating events
export const useCreateEvento = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateEventoParams) => {
      const { data, error } = await supabase
        .from('eventi_associazione')
        .insert([{
          ...params,
          attivo: true,
          posti_venduti: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventi'] });
      toast({
        title: 'Evento creato',
        description: 'L\'evento è stato creato con successo.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare l\'evento.',
        variant: 'destructive',
      });
    },
  });
};

// Mutation for updating events
export const useUpdateEvento = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Evento> & { id: string }) => {
      const { error } = await supabase
        .from('eventi_associazione')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventi'] });
      toast({
        title: 'Evento aggiornato',
        description: 'L\'evento è stato aggiornato con successo.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiornare l\'evento.',
        variant: 'destructive',
      });
    },
  });
};

// Mutation for deleting events
export const useDeleteEvento = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('eventi_associazione')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventi'] });
      toast({
        title: 'Evento eliminato',
        description: 'L\'evento è stato eliminato.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile eliminare l\'evento.',
        variant: 'destructive',
      });
    },
  });
};
