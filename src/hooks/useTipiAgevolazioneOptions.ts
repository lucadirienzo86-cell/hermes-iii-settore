import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTipiAgevolazioneOptions = () => {
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["tipi-agevolazione-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipi_agevolazione_options" as any)
        .select("*")
        .eq("attivo", true)
        .order("ordine", { ascending: true });

      if (error) throw error;
      return (data as any[]).map(opt => opt.nome);
    },
  });

  const addOption = useMutation({
    mutationFn: async (nome: string) => {
      const { data: maxData } = await supabase
        .from("tipi_agevolazione_options" as any)
        .select("ordine")
        .order("ordine", { ascending: false })
        .limit(1);

      const maxOrdine = (maxData as any[])?.[0]?.ordine || 0;

      const { data, error } = await supabase
        .from("tipi_agevolazione_options" as any)
        .insert({ nome, ordine: maxOrdine + 1 })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipi-agevolazione-options"] });
      toast.success("Tipo agevolazione aggiunto con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiunta del tipo");
    },
  });

  const deleteOption = useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase
        .from("tipi_agevolazione_options" as any)
        .update({ attivo: false })
        .eq("nome", nome);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipi-agevolazione-options"] });
      toast.success("Tipo agevolazione eliminato con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'eliminazione del tipo");
    },
  });

  return {
    options,
    isLoading,
    addOption: addOption.mutate,
    isAdding: addOption.isPending,
    deleteOption: deleteOption.mutate,
    isDeleting: deleteOption.isPending,
  };
};
