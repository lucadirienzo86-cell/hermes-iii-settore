import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface AssociazioneData {
  id: string;
  profile_id: string | null;
  denominazione: string;
  tipologia: string;
  codice_fiscale: string | null;
  partita_iva: string | null;
  stato_runts: string | null;
  numero_iscritti: number | null;
  attiva: boolean | null;
  logo_url: string | null;
  email: string | null;
  pec: string | null;
  telefono: string | null;
  indirizzo: string | null;
  comune: string | null;
  descrizione: string | null;
  data_costituzione: string | null;
  settori_intervento: string[] | null;
  pro_loco_id: string | null;
  stato_albo: string | null;
  fonte_dato: string | null;
  campi_completi: boolean | null;
  stato_registrazione: string | null;
  onboarding_completato: boolean | null;
  iscrizione_albo_comunale: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProLocoInfo {
  id: string;
  denominazione: string;
  email: string | null;
}

export const useAssociazione = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['associazione', user?.id],
    queryFn: async (): Promise<AssociazioneData | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useProLocoInfo = (proLocoId: string | null) => {
  return useQuery({
    queryKey: ['pro-loco-info', proLocoId],
    queryFn: async (): Promise<ProLocoInfo | null> => {
      if (!proLocoId) return null;
      
      const { data, error } = await supabase
        .from('pro_loco')
        .select('id, denominazione, email')
        .eq('id', proLocoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!proLocoId,
  });
};

export const useUpdateAssociazione = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<AssociazioneData> & { id: string }) => {
      const { id, fonte_dato, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('associazioni_terzo_settore')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associazione', user?.id] });
      toast({ title: 'Dati aggiornati con successo' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (associazioneId: string) => {
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .update({ onboarding_completato: true })
        .eq('id', associazioneId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associazione', user?.id] });
      toast({ title: 'Onboarding completato!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};
