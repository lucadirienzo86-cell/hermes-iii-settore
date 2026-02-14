import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RichiestaContatto {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo_richiesto: string;
  messaggio: string | null;
  stato: string;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export const useRichiesteContatto = () => {
  const queryClient = useQueryClient();

  const { data: richieste = [], isLoading, error } = useQuery({
    queryKey: ['richieste-contatto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('richieste_contatto')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RichiestaContatto[];
    },
  });

  const updateStatoMutation = useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('richieste_contatto')
        .update({ 
          stato, 
          processed_at: new Date().toISOString(),
          processed_by: user?.id || null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['richieste-contatto'] });
      toast.success('Stato aggiornato');
    },
    onError: (error: any) => {
      toast.error('Errore durante l\'aggiornamento: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('richieste_contatto')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['richieste-contatto'] });
      toast.success('Richiesta eliminata');
    },
    onError: (error: any) => {
      toast.error('Errore durante l\'eliminazione: ' + error.message);
    },
  });

  return {
    richieste,
    isLoading,
    error,
    updateStato: updateStatoMutation.mutate,
    deleteRichiesta: deleteMutation.mutate,
    isUpdating: updateStatoMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};