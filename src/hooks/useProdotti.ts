import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Prodotto {
  id: string;
  associazione_id: string;
  pro_loco_id: string | null;
  nome: string;
  descrizione: string | null;
  prezzo: number;
  quantita_disponibile: number | null;
  immagine_url: string | null;
  payment_link_id: string | null;
  attivo: boolean;
  created_at: string;
}

interface CreateProdottoParams {
  associazione_id: string;
  pro_loco_id?: string;
  nome: string;
  descrizione?: string;
  prezzo: number;
  quantita_disponibile?: number;
}

// Hook for products
export const useProdotti = (associazioneId?: string, proLocoId?: string) => {
  return useQuery({
    queryKey: ['prodotti', associazioneId, proLocoId],
    queryFn: async () => {
      let query = supabase
        .from('prodotti_associazione')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (associazioneId) {
        query = query.eq('associazione_id', associazioneId);
      } else if (proLocoId) {
        query = query.eq('pro_loco_id', proLocoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Prodotto[];
    },
    enabled: !!(associazioneId || proLocoId),
  });
};

// Mutation for creating products
export const useCreateProdotto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateProdottoParams) => {
      const { data, error } = await supabase
        .from('prodotti_associazione')
        .insert([{
          ...params,
          attivo: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prodotti'] });
      toast({
        title: 'Prodotto creato',
        description: 'Il prodotto è stato creato con successo.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare il prodotto.',
        variant: 'destructive',
      });
    },
  });
};

// Mutation for updating products
export const useUpdateProdotto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Prodotto> & { id: string }) => {
      const { error } = await supabase
        .from('prodotti_associazione')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prodotti'] });
      toast({
        title: 'Prodotto aggiornato',
        description: 'Il prodotto è stato aggiornato con successo.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiornare il prodotto.',
        variant: 'destructive',
      });
    },
  });
};

// Mutation for deleting products
export const useDeleteProdotto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prodotti_associazione')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prodotti'] });
      toast({
        title: 'Prodotto eliminato',
        description: 'Il prodotto è stato eliminato.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile eliminare il prodotto.',
        variant: 'destructive',
      });
    },
  });
};
