import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CategoriaAssociazione {
  id: string;
  nome: string;
  descrizione: string | null;
  colore: string;
  icona: string;
  ordine: number;
  attiva: boolean;
}

export const useCategorieAssociazioni = () => {
  const { data: categorie, isLoading, error } = useQuery({
    queryKey: ['categorie-associazioni'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorie_associazioni')
        .select('*')
        .eq('attiva', true)
        .order('ordine', { ascending: true });

      if (error) throw error;
      return data as CategoriaAssociazione[];
    },
  });

  return {
    categorie: categorie || [],
    isLoading,
    error,
  };
};
