import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BadgeTipoAdmin {
  id: string;
  nome: string;
  descrizione: string | null;
  icona: string | null;
  colore: string | null;
  ordine: number | null;
  attivo: boolean | null;
  categoria_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useBadgeFormativiAdmin = () => {
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["badge-tipi-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_tipi")
        .select("*")
        .order("ordine", { ascending: true });

      if (error) throw error;
      return data as BadgeTipoAdmin[];
    },
  });

  const addOption = useMutation({
    mutationFn: async ({ nome, descrizione, icona, colore, categoria_id }: { 
      nome: string; 
      descrizione?: string; 
      icona?: string; 
      colore?: string;
      categoria_id?: string;
    }) => {
      const maxOrdine = options.length > 0 
        ? Math.max(...options.map(o => o.ordine || 0)) 
        : 0;

      const { data, error } = await supabase
        .from("badge_tipi")
        .insert({ 
          nome, 
          descrizione: descrizione || null,
          icona: icona || null,
          colore: colore || "#3B82F6",
          categoria_id: categoria_id || null,
          ordine: maxOrdine + 1, 
          attivo: true 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-tipi-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_tipi"] });
      toast.success("Badge aggiunto con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiunta del badge");
    },
  });

  const updateOption = useMutation({
    mutationFn: async ({ id, nome, descrizione, icona, colore, categoria_id }: { 
      id: string; 
      nome?: string;
      descrizione?: string;
      icona?: string;
      colore?: string;
      categoria_id?: string | null;
    }) => {
      const updateData: Record<string, any> = {};
      if (nome !== undefined) updateData.nome = nome;
      if (descrizione !== undefined) updateData.descrizione = descrizione;
      if (icona !== undefined) updateData.icona = icona;
      if (colore !== undefined) updateData.colore = colore;
      if (categoria_id !== undefined) updateData.categoria_id = categoria_id;

      const { error } = await supabase
        .from("badge_tipi")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-tipi-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_tipi"] });
      toast.success("Badge modificato con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante la modifica del badge");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, attivo }: { id: string; attivo: boolean }) => {
      const { error } = await supabase
        .from("badge_tipi")
        .update({ attivo })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-tipi-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_tipi"] });
      toast.success("Stato badge aggiornato");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiornamento dello stato");
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ordine }: { id: string; ordine: number }) => {
      const { error } = await supabase
        .from("badge_tipi")
        .update({ ordine })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-tipi-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_tipi"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiornamento dell'ordine");
    },
  });

  const deleteBadge = useMutation({
    mutationFn: async (id: string) => {
      // First, delete all assignments
      const { error: assignError } = await supabase
        .from("badge_assegnazioni")
        .delete()
        .eq("badge_tipo_id", id);

      if (assignError) throw assignError;

      // Then delete the badge
      const { error } = await supabase
        .from("badge_tipi")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-tipi-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_tipi"] });
      toast.success("Badge eliminato con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'eliminazione del badge");
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

  const reorderBadges = async (badgeIds: string[]) => {
    const updates = badgeIds.map((id, index) => 
      supabase.from("badge_tipi").update({ ordine: index }).eq("id", id)
    );
    
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ["badge-tipi-admin"] });
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
    deleteBadge: deleteBadge.mutate,
    isDeleting: deleteBadge.isPending,
    swapOrder,
    reorderBadges,
    isSwapping: updateOrder.isPending,
  };
};
