import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AziendaKpiValore {
  id: string;
  azienda_id: string;
  kpi_parametro_id: string;
  valore: number;
  anno_riferimento: number;
  fonte: string | null;
  created_at: string;
  updated_at: string;
  kpi_parametro?: {
    nome: string;
    codice: string;
    tipo_dato: string;
    unita_misura: string | null;
  };
}

export const useAziendaKpi = (aziendaId?: string) => {
  const queryClient = useQueryClient();

  const { data: kpiValori = [], isLoading: loadingKpi } = useQuery({
    queryKey: ['azienda-kpi-valori', aziendaId],
    queryFn: async () => {
      if (!aziendaId) return [];
      
      const { data, error } = await supabase
        .from('aziende_kpi_valori' as any)
        .select(`
          *,
          kpi_parametro:kpi_parametri_options(nome, codice, tipo_dato, unita_misura)
        `)
        .eq('azienda_id', aziendaId)
        .order('anno_riferimento', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as AziendaKpiValore[];
    },
    enabled: !!aziendaId,
  });

  const saveKpiValore = useMutation({
    mutationFn: async (payload: {
      azienda_id: string;
      kpi_parametro_id: string;
      valore: number;
      anno_riferimento: number;
      fonte?: string;
    }) => {
      const { data, error } = await supabase
        .from('aziende_kpi_valori' as any)
        .upsert(payload as any, { 
          onConflict: 'azienda_id,kpi_parametro_id,anno_riferimento' 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['azienda-kpi-valori'] });
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const bulkSaveKpiValori = useMutation({
    mutationFn: async (payload: {
      azienda_id: string;
      valori: Array<{
        kpi_parametro_id: string;
        valore: number;
      }>;
      anno_riferimento: number;
    }) => {
      const records = payload.valori.map(v => ({
        azienda_id: payload.azienda_id,
        kpi_parametro_id: v.kpi_parametro_id,
        valore: v.valore,
        anno_riferimento: payload.anno_riferimento,
      }));

      const { data, error } = await supabase
        .from('aziende_kpi_valori' as any)
        .upsert(records as any, { 
          onConflict: 'azienda_id,kpi_parametro_id,anno_riferimento' 
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['azienda-kpi-valori'] });
      toast.success('KPI salvati con successo');
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  return {
    kpiValori,
    loadingKpi,
    saveKpiValore,
    bulkSaveKpiValori,
  };
};