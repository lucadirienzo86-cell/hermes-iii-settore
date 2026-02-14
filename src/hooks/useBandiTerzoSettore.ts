import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BandoTerzoSettore {
  id: string;
  titolo: string;
  descrizione: string | null;
  ambito: string | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  stato: 'bozza' | 'attivo' | 'in_chiusura' | 'concluso';
  plafond_totale: number;
  plafond_impegnato: number;
  requisiti_tipologia: string[] | null;
  requisiti_runts: string[] | null;
  documenti_richiesti: string[] | null;
  link_documentazione: string | null;
  created_at: string;
  numero_partecipanti?: number;
}

export const useBandiTerzoSettore = () => {
  return useQuery({
    queryKey: ['bandi-terzo-settore'],
    queryFn: async (): Promise<BandoTerzoSettore[]> => {
      const { data: bandi, error } = await supabase
        .from('bandi_terzo_settore')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch partecipanti count per ogni bando
      const bandiWithCounts = await Promise.all(
        (bandi || []).map(async (bando) => {
          const { count } = await supabase
            .from('progetti_terzo_settore')
            .select('*', { count: 'exact', head: true })
            .eq('bando_id', bando.id);
          
          return {
            ...bando,
            stato: bando.stato as BandoTerzoSettore['stato'],
            plafond_totale: Number(bando.plafond_totale) || 0,
            plafond_impegnato: Number(bando.plafond_impegnato) || 0,
            numero_partecipanti: count || 0,
          };
        })
      );
      
      return bandiWithCounts;
    },
  });
};

export const useCreateBandoTS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Partial<BandoTerzoSettore>) => {
      const insertData: any = {
        titolo: data.titolo!,
        descrizione: data.descrizione,
        ambito: data.ambito,
        data_apertura: data.data_apertura,
        data_chiusura: data.data_chiusura,
        stato: data.stato || 'bozza',
        plafond_totale: data.plafond_totale || 0,
        requisiti_tipologia: data.requisiti_tipologia,
        requisiti_runts: data.requisiti_runts,
        documenti_richiesti: data.documenti_richiesti,
        link_documentazione: data.link_documentazione,
      };
      
      const { data: result, error } = await supabase
        .from('bandi_terzo_settore')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandi-terzo-settore'] });
      queryClient.invalidateQueries({ queryKey: ['terzo-settore-stats'] });
      toast({ title: 'Bando creato con successo' });
    },
    onError: (error) => {
      toast({ 
        title: 'Errore', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useUpdateBandoTS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<BandoTerzoSettore> & { id: string }) => {
      const updateData: any = {
        titolo: data.titolo,
        descrizione: data.descrizione,
        ambito: data.ambito,
        data_apertura: data.data_apertura,
        data_chiusura: data.data_chiusura,
        stato: data.stato,
        plafond_totale: data.plafond_totale,
        plafond_impegnato: data.plafond_impegnato,
        requisiti_tipologia: data.requisiti_tipologia,
        requisiti_runts: data.requisiti_runts,
        documenti_richiesti: data.documenti_richiesti,
        link_documentazione: data.link_documentazione,
      };
      
      const { data: result, error } = await supabase
        .from('bandi_terzo_settore')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bandi-terzo-settore'] });
      queryClient.invalidateQueries({ queryKey: ['terzo-settore-stats'] });
      toast({ title: 'Bando aggiornato' });
    },
    onError: (error) => {
      toast({ 
        title: 'Errore', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};
