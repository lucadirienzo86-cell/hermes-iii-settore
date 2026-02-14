import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BadgeCategoria {
  id: string;
  nome: string;
  descrizione: string | null;
  icona: string | null;
  colore: string | null;
  ordine: number | null;
  attivo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useBadgeCategorieAdmin = () => {
  const queryClient = useQueryClient();

  const { data: categorie = [], isLoading } = useQuery({
    queryKey: ["badge-categorie-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_categorie")
        .select("*")
        .order("ordine", { ascending: true });

      if (error) throw error;
      return data as BadgeCategoria[];
    },
  });

  const addCategoria = useMutation({
    mutationFn: async ({ nome, descrizione, icona, colore }: { 
      nome: string; 
      descrizione?: string; 
      icona?: string; 
      colore?: string;
    }) => {
      const maxOrdine = categorie.length > 0 
        ? Math.max(...categorie.map(c => c.ordine || 0)) 
        : 0;

      const { data, error } = await supabase
        .from("badge_categorie")
        .insert({ 
          nome, 
          descrizione: descrizione || null,
          icona: icona || null,
          colore: colore || "#3B82F6",
          ordine: maxOrdine + 1, 
          attivo: true 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-categorie-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_categorie"] });
      toast.success("Categoria aggiunta con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiunta della categoria");
    },
  });

  const updateCategoria = useMutation({
    mutationFn: async ({ id, nome, descrizione, icona, colore }: { 
      id: string; 
      nome?: string;
      descrizione?: string;
      icona?: string;
      colore?: string;
    }) => {
      const updateData: Record<string, any> = {};
      if (nome !== undefined) updateData.nome = nome;
      if (descrizione !== undefined) updateData.descrizione = descrizione;
      if (icona !== undefined) updateData.icona = icona;
      if (colore !== undefined) updateData.colore = colore;

      const { error } = await supabase
        .from("badge_categorie")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-categorie-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_categorie"] });
      toast.success("Categoria modificata con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante la modifica della categoria");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, attivo }: { id: string; attivo: boolean }) => {
      const { error } = await supabase
        .from("badge_categorie")
        .update({ attivo })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-categorie-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_categorie"] });
      toast.success("Stato categoria aggiornato");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiornamento dello stato");
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ordine }: { id: string; ordine: number }) => {
      const { error } = await supabase
        .from("badge_categorie")
        .update({ ordine })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-categorie-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_categorie"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'aggiornamento dell'ordine");
    },
  });

  const deleteCategoria = useMutation({
    mutationFn: async (id: string) => {
      // First, unassign all badges from this category
      const { error: updateError } = await supabase
        .from("badge_tipi")
        .update({ categoria_id: null })
        .eq("categoria_id", id);

      if (updateError) throw updateError;

      // Then delete the category
      const { error } = await supabase
        .from("badge_categorie")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-categorie-admin"] });
      queryClient.invalidateQueries({ queryKey: ["badge_categorie"] });
      queryClient.invalidateQueries({ queryKey: ["badge-tipi-admin"] });
      toast.success("Categoria eliminata con successo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Errore durante l'eliminazione della categoria");
    },
  });

  const swapOrder = async (index1: number, index2: number) => {
    const item1 = categorie[index1];
    const item2 = categorie[index2];
    
    if (!item1 || !item2) return;

    await Promise.all([
      updateOrder.mutateAsync({ id: item1.id, ordine: item2.ordine || index2 }),
      updateOrder.mutateAsync({ id: item2.id, ordine: item1.ordine || index1 }),
    ]);
    
    toast.success("Ordine aggiornato");
  };

  return {
    categorie,
    isLoading,
    addCategoria: addCategoria.mutate,
    isAdding: addCategoria.isPending,
    updateCategoria: updateCategoria.mutate,
    isUpdating: updateCategoria.isPending,
    toggleActive: toggleActive.mutate,
    isToggling: toggleActive.isPending,
    deleteCategoria: deleteCategoria.mutate,
    isDeleting: deleteCategoria.isPending,
    swapOrder,
    isSwapping: updateOrder.isPending,
  };
};
