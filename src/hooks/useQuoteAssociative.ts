import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type PaymentStatus = Database['public']['Enums']['payment_status'];

interface QuotaAssociativa {
  id: string;
  pro_loco_id: string;
  associazione_id: string;
  anno: number;
  importo: number;
  pagamento_id: string | null;
  stato: PaymentStatus;
  data_scadenza: string | null;
  note: string | null;
  created_at: string;
}

interface CreateQuotaParams {
  pro_loco_id: string;
  associazione_id: string;
  anno: number;
  importo: number;
  data_scadenza?: string;
  note?: string;
}

// Hook for quotes by Pro Loco
export const useQuoteByProLoco = (proLocoId: string) => {
  return useQuery({
    queryKey: ['quote-pro-loco', proLocoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_associative')
        .select(`
          *,
          associazione:associazioni_terzo_settore(id, denominazione, email)
        `)
        .eq('pro_loco_id', proLocoId)
        .order('anno', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!proLocoId,
  });
};

// Hook for quotes by Association
export const useQuoteByAssociazione = (associazioneId: string) => {
  return useQuery({
    queryKey: ['quote-associazione', associazioneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_associative')
        .select(`
          *,
          pro_loco:pro_loco(id, denominazione)
        `)
        .eq('associazione_id', associazioneId)
        .order('anno', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!associazioneId,
  });
};

// Hook for quote stats
export const useQuoteStats = (proLocoId: string) => {
  return useQuery({
    queryKey: ['quote-stats', proLocoId],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('quote_associative')
        .select('stato, importo')
        .eq('pro_loco_id', proLocoId)
        .eq('anno', currentYear);
      
      if (error) throw error;
      
      const totale = data?.length || 0;
      const pagate = data?.filter(q => q.stato === 'success').length || 0;
      const incassato = data
        ?.filter(q => q.stato === 'success')
        .reduce((sum, q) => sum + Number(q.importo), 0) || 0;
      const attese = data?.filter(q => q.stato === 'pending').length || 0;
      
      return {
        anno: currentYear,
        totale,
        pagate,
        attese,
        incassato,
      };
    },
    enabled: !!proLocoId,
  });
};

// Mutation for creating quotes
export const useCreateQuota = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateQuotaParams) => {
      const { data, error } = await supabase
        .from('quote_associative')
        .insert([{
          ...params,
          stato: 'pending' as PaymentStatus,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-pro-loco'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
      toast({
        title: 'Quota creata',
        description: 'La quota associativa è stata creata.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare la quota.',
        variant: 'destructive',
      });
    },
  });
};

// Mutation for bulk creating quotes
export const useBulkCreateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quotes: CreateQuotaParams[]) => {
      const { data, error } = await supabase
        .from('quote_associative')
        .insert(quotes.map(q => ({
          ...q,
          stato: 'pending' as PaymentStatus,
        })))
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-pro-loco'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
      toast({
        title: 'Quote create',
        description: `${data?.length || 0} quote associative create.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare le quote.',
        variant: 'destructive',
      });
    },
  });
};

// Mutation for updating quote status
export const useUpdateQuotaStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: PaymentStatus }) => {
      const { error } = await supabase
        .from('quote_associative')
        .update({ stato })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-pro-loco'] });
      queryClient.invalidateQueries({ queryKey: ['quote-associazione'] });
      queryClient.invalidateQueries({ queryKey: ['quote-stats'] });
      toast({
        title: 'Stato aggiornato',
        description: 'Lo stato della quota è stato aggiornato.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile aggiornare lo stato.',
        variant: 'destructive',
      });
    },
  });
};
