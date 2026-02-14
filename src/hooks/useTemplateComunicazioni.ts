import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateComunicazione {
  id: string;
  codice: string;
  nome: string;
  oggetto: string;
  corpo: string;
  tipo: string;
  attivo: boolean;
  created_at: string;
  updated_at: string;
}

export const useTemplateComunicazioni = () => {
  return useQuery({
    queryKey: ['template-comunicazioni'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_comunicazioni')
        .select('*')
        .eq('attivo', true)
        .order('nome');

      if (error) throw error;
      return data as TemplateComunicazione[];
    },
  });
};

export const useTemplateByCodice = (codice: string) => {
  return useQuery({
    queryKey: ['template-comunicazione', codice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_comunicazioni')
        .select('*')
        .eq('codice', codice)
        .eq('attivo', true)
        .single();

      if (error) throw error;
      return data as TemplateComunicazione;
    },
    enabled: !!codice,
  });
};
