import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AvvisoRequisito {
  id: string;
  avviso_id: string;
  requisito_id: string;
  obbligatorio: boolean;
  note: string | null;
}

export function useAvvisoRequisiti(avvisoId: string | null) {
  const queryClient = useQueryClient();

  const { data: requisiti = [], isLoading } = useQuery({
    queryKey: ["avviso-requisiti", avvisoId],
    queryFn: async () => {
      if (!avvisoId) return [];
      const { data, error } = await supabase
        .from("avvisi_requisiti")
        .select("*")
        .eq("avviso_id", avvisoId);
      
      if (error) throw error;
      return data as AvvisoRequisito[];
    },
    enabled: !!avvisoId,
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
      if (!avvisoId) throw new Error("Avviso ID mancante");
      
      // Delete existing
      await supabase
        .from("avvisi_requisiti")
        .delete()
        .eq("avviso_id", avvisoId);
      
      // Insert new
      if (requisitiData.length > 0) {
        const toInsert = requisitiData.map(r => ({
          avviso_id: avvisoId,
          requisito_id: r.requisito_id,
          obbligatorio: r.obbligatorio
        }));
        
        const { error } = await supabase
          .from("avvisi_requisiti")
          .insert(toInsert);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avviso-requisiti", avvisoId] });
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
