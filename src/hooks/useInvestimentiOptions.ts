import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useInvestimentiOptions = () => {
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["investimenti-finanziabili-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investimenti_finanziabili_options")
        .select("*")
        .eq("attivo", true)
        .order("ordine", { ascending: true });

      if (error) throw error;
      return data.map(opt => opt.nome);
    },
  });

  const addOption = useMutation({
    mutationFn: async (nome: string) => {
      const { data: maxData } = await supabase
        .from("investimenti_finanziabili_options")
        .select("ordine")
        .order("ordine", { ascending: false })
        .limit(1);

      const maxOrdine = maxData?.[0]?.ordine || 0;

      const { data, error } = await supabase
        .from("investimenti_finanziabili_options")
        .insert({ nome, ordine: maxOrdine + 1 })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investimenti-finanziabili-options"] });
      toast.success("Opzione aggiunta con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiunta dell'opzione");
    },
  });

  const deleteOption = useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase
        .from("investimenti_finanziabili_options")
        .update({ attivo: false })
        .eq("nome", nome);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investimenti-finanziabili-options"] });
      toast.success("Opzione eliminata con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'eliminazione dell'opzione");
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
