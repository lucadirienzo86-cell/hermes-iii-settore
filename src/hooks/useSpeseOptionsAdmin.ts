import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SpeseOption {
  id: string;
  nome: string;
  ordine: number | null;
  attivo: boolean | null;
  created_at: string | null;
}

export const useSpeseOptionsAdmin = () => {
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["spese-ammissibili-options-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spese_ammissibili_options")
        .select("*")
        .order("ordine", { ascending: true });

      if (error) throw error;
      return data as SpeseOption[];
    },
  });

  const addOption = useMutation({
    mutationFn: async (nome: string) => {
      const maxOrdine = options.length > 0 
        ? Math.max(...options.map(o => o.ordine || 0)) 
        : 0;

      const { data, error } = await supabase
        .from("spese_ammissibili_options")
        .insert({ nome, ordine: maxOrdine + 1, attivo: true })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options-admin"] });
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options"] });
      toast.success("Opzione aggiunta con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiunta dell'opzione");
    },
  });

  const updateOption = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("spese_ammissibili_options")
        .update({ nome })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options-admin"] });
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options"] });
      toast.success("Opzione modificata con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante la modifica dell'opzione");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, attivo }: { id: string; attivo: boolean }) => {
      const { error } = await supabase
        .from("spese_ammissibili_options")
        .update({ attivo })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options-admin"] });
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options"] });
      toast.success("Stato opzione aggiornato");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiornamento dello stato");
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ordine }: { id: string; ordine: number }) => {
      const { error } = await supabase
        .from("spese_ammissibili_options")
        .update({ ordine })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options-admin"] });
      queryClient.invalidateQueries({ queryKey: ["spese-ammissibili-options"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiornamento dell'ordine");
    },
  });

  const swapOrder = async (index1: number, index2: number) => {
    const item1 = options[index1];
    const item2 = options[index2];
    
    if (!item1 || !item2) return;

    await Promise.all([
      updateOrder.mutateAsync({ id: item1.id, ordine: item2.ordine || index2 }),
      updateOrder.mutateAsync({ id: item2.id, ordine: item1.ordine || index1 }),
    ]);
    
    toast.success("Ordine aggiornato");
  };

  return {
    options,
    isLoading,
    addOption: addOption.mutate,
    isAdding: addOption.isPending,
    updateOption: updateOption.mutate,
    isUpdating: updateOption.isPending,
    toggleActive: toggleActive.mutate,
    isToggling: toggleActive.isPending,
    swapOrder,
    isSwapping: updateOrder.isPending,
  };
};
