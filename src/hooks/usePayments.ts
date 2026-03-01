import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type PaymentLinkType = Database['public']['Enums']['payment_link_type'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

interface PaymentLink {
  id: string;
  associazione_id: string | null;
  pro_loco_id: string | null;
  tipo: PaymentLinkType;
  titolo: string;
  descrizione: string | null;
  importo_fisso: number | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
  attivo: boolean;
  slug: string | null;
  scadenza: string | null;
  external_link_id: string | null;
  created_at: string;
}

interface Pagamento {
  id: string;
  payment_link_id: string | null;
  associazione_id: string | null;
  pro_loco_id: string | null;
  tipo: PaymentLinkType;
  importo: number;
  valuta: string;
  stato: PaymentStatus;
  email_pagatore: string | null;
  nome_pagatore: string | null;
  external_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Donazione {
  id: string;
  pagamento_id: string | null;
  associazione_id: string;
  importo: number;
  messaggio: string | null;
  anonima: boolean;
  email_donatore: string | null;
  nome_donatore: string | null;
  created_at: string;
}

interface CreatePaymentLinkParams {
  associazione_id?: string;
  pro_loco_id?: string;
  tipo: PaymentLinkType;
  titolo: string;
  descrizione?: string;
  importo_fisso?: number;
  importo_minimo?: number;
  importo_massimo?: number;
  scadenza?: string;
}

// Hook for payment links
export const usePaymentLinks = (associazioneId?: string, proLocoId?: string) => {
  return useQuery({
    queryKey: ['payment-links', associazioneId, proLocoId],
    queryFn: async () => {
      let query = supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (associazioneId) {
        query = query.eq('associazione_id', associazioneId);
      } else if (proLocoId) {
        query = query.eq('pro_loco_id', proLocoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentLink[];
    },
    enabled: !!(associazioneId || proLocoId),
  });
};

// Hook for payments/transactions
export const usePagamenti = (associazioneId?: string, proLocoId?: string) => {
  return useQuery({
    queryKey: ['pagamenti', associazioneId, proLocoId],
    queryFn: async () => {
      let query = supabase
        .from('pagamenti')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (associazioneId) {
        query = query.eq('associazione_id', associazioneId);
      } else if (proLocoId) {
        query = query.eq('pro_loco_id', proLocoId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Pagamento[];
    },
    enabled: !!(associazioneId || proLocoId),
  });
};

// Hook for donations
export const useDonazioni = (associazioneId: string) => {
  return useQuery({
    queryKey: ['donazioni', associazioneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donazioni')
        .select('*')
        .eq('associazione_id', associazioneId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Donazione[];
    },
    enabled: !!associazioneId,
  });
};

// Hook for donation stats
export const useDonationStats = (associazioneId: string) => {
  return useQuery({
    queryKey: ['donation-stats', associazioneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donazioni')
        .select('importo')
        .eq('associazione_id', associazioneId);
      
      if (error) throw error;
      
      const totale = data?.reduce((sum, d) => sum + Number(d.importo), 0) || 0;
      return {
        totale,
        count: data?.length || 0,
      };
    },
    enabled: !!associazioneId,
  });
};

// Mutation for creating payment links
export const useCreatePaymentLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreatePaymentLinkParams) => {
      // Generate unique slug
      const slug = `${params.tipo}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('payment_links')
        .insert([{
          ...params,
          slug,
          attivo: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      toast({
        title: 'Link creato',
        description: 'Il link di pagamento è stato creato con successo.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare il link di pagamento.',
        variant: 'destructive',
      });
    },
  });
};

// Mutation for toggling payment link status
export const useTogglePaymentLink = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, attivo }: { id: string; attivo: boolean }) => {
      const { error } = await supabase
        .from('payment_links')
        .update({ attivo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      toast({
        title: 'Stato aggiornato',
        description: 'Lo stato del link è stato aggiornato.',
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

/**
 * Genera il link di pagamento condivisibile.
 *
 * Integrazione Manu Pay: sostituire questa funzione con la chiamata
 * all'endpoint Manu Pay (es. POST /api/payment-links) che restituisce
 * l'URL esterno del gateway. Richiede: MANU_PAY_API_KEY + MANU_PAY_BASE_URL
 * configurati come secrets in Supabase e una Edge Function dedicata.
 *
 * Fino all'integrazione, il link punta alla pagina interna /pay/:slug
 * che mostra i dettagli del pagamento con IBAN/istruzioni manuali.
 */
export const generateManuPayLink = (paymentLink: PaymentLink): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/pay/${paymentLink.slug}`;
};

// Helper to format currency
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(amount);
};
