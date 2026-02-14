import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ArticoloRassegna {
  id: string;
  titolo: string;
  fonte: string | null;
  url: string | null;
  data_pubblicazione: string | null;
  tipo: 'articolo' | 'comunicato' | 'determina' | 'delibera' | 'altro';
  contenuto: string | null;
  allegato_url: string | null;
  associazione_id: string | null;
  bando_id: string | null;
  visibilita: 'pubblico' | 'interno' | 'riservato';
  created_by: string | null;
  created_at: string;
}

export const useRassegnaStampa = (filters?: { tipo?: string; visibilita?: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articoli, isLoading, error } = useQuery({
    queryKey: ['rassegna-stampa', filters],
    queryFn: async () => {
      let query = supabase
        .from('rassegna_stampa')
        .select('*')
        .order('data_pubblicazione', { ascending: false });

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.visibilita) {
        query = query.eq('visibilita', filters.visibilita);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as ArticoloRassegna[];
    },
  });

  const aggiungiArticolo = useMutation({
    mutationFn: async (articolo: Omit<ArticoloRassegna, 'id' | 'created_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('rassegna_stampa')
        .insert({
          ...articolo,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rassegna-stampa'] });
      toast({ title: 'Articolo aggiunto alla rassegna stampa' });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Errore', 
        description: error.message 
      });
    },
  });

  const eliminaArticolo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rassegna_stampa')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rassegna-stampa'] });
      toast({ title: 'Articolo eliminato' });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Errore', 
        description: error.message 
      });
    },
  });

  return {
    articoli: articoli || [],
    isLoading,
    error,
    aggiungiArticolo,
    eliminaArticolo,
  };
};
