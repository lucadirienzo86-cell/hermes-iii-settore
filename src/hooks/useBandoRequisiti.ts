import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BandoRequisito {
  id: string;
  bando_id: string;
  requisito_id: string;
  obbligatorio: boolean;
  note: string | null;
}

export function useBandoRequisiti(bandoId: string | null) {
  const queryClient = useQueryClient();

  const { data: requisiti = [], isLoading } = useQuery({
    queryKey: ["bando-requisiti", bandoId],
    queryFn: async () => {
      if (!bandoId) return [];
      const { data, error } = await supabase
        .from("bandi_requisiti")
        .select("*")
        .eq("bando_id", bandoId);
      
      if (error) throw error;
      return data as BandoRequisito[];
    },
    enabled: !!bandoId,
  });

  const { data: allRequisiti = [] } = useQuery({
    queryKey: ["requisiti-bando-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requisiti_bando")
        .select("*")
        .eq("attivo", true)
        .order("ordine");
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (requisitiData: { requisito_id: string; obbligatorio: boolean }[]) => {
      if (!bandoId) throw new Error("Bando ID mancante");
      
      // Delete existing
      await supabase
        .from("bandi_requisiti")
        .delete()
        .eq("bando_id", bandoId);
      
      // Insert new
      if (requisitiData.length > 0) {
        const toInsert = requisitiData.map(r => ({
          bando_id: bandoId,
          requisito_id: r.requisito_id,
          obbligatorio: r.obbligatorio
        }));
        
        const { error } = await supabase
          .from("bandi_requisiti")
          .insert(toInsert);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bando-requisiti", bandoId] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  return {
    requisiti,
    allRequisiti,
    isLoading,
    saveRequisiti: (data: { requisito_id: string; obbligatorio: boolean }[]) => saveMutation.mutate(data),
    isSaving: saveMutation.isPending,
  };
}
