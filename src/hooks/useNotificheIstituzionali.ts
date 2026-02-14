import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificaIstituzionale {
  id: string;
  tipo: string;
  titolo: string;
  messaggio: string | null;
  priorita: string;
  letta: boolean;
  data_scadenza: string | null;
  link_azione: string | null;
  entity_type: string | null;
  entity_id: string | null;
  destinatario_id: string | null;
  created_at: string;
}

export const useNotificheIstituzionali = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifiche, isLoading, error } = useQuery({
    queryKey: ['notifiche-istituzionali'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifiche_istituzionali')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as NotificaIstituzionale[];
    },
  });

  const { data: nonLette } = useQuery({
    queryKey: ['notifiche-istituzionali-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifiche_istituzionali')
        .select('*', { count: 'exact', head: true })
        .eq('letta', false);

      if (error) throw error;
      return count || 0;
    },
  });

  const segnaComeLetta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifiche_istituzionali')
        .update({ letta: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifiche-istituzionali'] });
      queryClient.invalidateQueries({ queryKey: ['notifiche-istituzionali-count'] });
    },
  });

  const creaNofitifica = useMutation({
    mutationFn: async (notifica: Omit<NotificaIstituzionale, 'id' | 'created_at' | 'letta'>) => {
      const { data, error } = await supabase
        .from('notifiche_istituzionali')
        .insert({
          ...notifica,
          letta: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifiche-istituzionali'] });
      toast({ title: 'Notifica creata' });
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
    notifiche: notifiche || [],
    nonLette: nonLette || 0,
    isLoading,
    error,
    segnaComeLetta,
    creaNofitifica,
  };
};
