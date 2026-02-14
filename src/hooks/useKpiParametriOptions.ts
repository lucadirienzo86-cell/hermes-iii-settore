import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KpiParametro {
  id: string;
  nome: string;
  codice: string;
  tipo_dato: 'importo' | 'percentuale' | 'rapporto';
  unita_misura: string | null;
  descrizione: string | null;
  attivo: boolean;
  ordine: number;
}

export const useKpiParametriOptions = () => {
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['kpi-parametri-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_parametri_options' as any)
        .select('*')
        .eq('attivo', true)
        .order('ordine', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as KpiParametro[];
    },
  });

  const addOption = useMutation({
    mutationFn: async (option: Omit<KpiParametro, 'id'>) => {
      const { data, error } = await supabase
        .from('kpi_parametri_options' as any)
        .insert(option as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-parametri-options'] });
      toast.success('Parametro KPI aggiunto con successo');
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const updateOption = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KpiParametro> & { id: string }) => {
      const { data, error } = await supabase
        .from('kpi_parametri_options' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-parametri-options'] });
      toast.success('Parametro KPI aggiornato');
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const deleteOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kpi_parametri_options' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-parametri-options'] });
      toast.success('Parametro KPI eliminato');
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  return {
    options,
    isLoading,
    addOption,
    updateOption,
    deleteOption,
  };
};
