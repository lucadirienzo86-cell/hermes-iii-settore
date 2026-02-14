import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RequisitoOption {
  id: string;
  nome: string;
  descrizione: string | null;
  icona: string | null;
  obbligatorio_default: boolean;
  attivo: boolean;
  ordine: number;
}

export function useRequisitiAdmin() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["requisiti-bando-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requisiti_bando")
        .select("*")
        .order("ordine", { ascending: true });
      
      if (error) throw error;
      return data as RequisitoOption[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (requisito: { nome: string; descrizione?: string; icona?: string; obbligatorio_default?: boolean }) => {
      const maxOrdine = options.length > 0 ? Math.max(...options.map(o => o.ordine)) + 1 : 1;
      const { error } = await supabase
        .from("requisiti_bando")
        .insert([{ 
          ...requisito, 
          ordine: maxOrdine,
          attivo: true 
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisiti-bando-admin"] });
      toast({ title: "Requisito aggiunto" });
      setIsAdding(false);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
      setIsAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (requisito: Partial<RequisitoOption> & { id: string }) => {
      const { id, ...data } = requisito;
      const { error } = await supabase
        .from("requisiti_bando")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisiti-bando-admin"] });
      toast({ title: "Requisito aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, attivo }: { id: string; attivo: boolean }) => {
      const { error } = await supabase
        .from("requisiti_bando")
        .update({ attivo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisiti-bando-admin"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("requisiti_bando")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisiti-bando-admin"] });
      toast({ title: "Requisito eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const swapOrder = async (oldIndex: number, newIndex: number) => {
    const reordered = [...options];
    const [movedItem] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedItem);
    
    // Update ordine for each item
    const updates = reordered.map((item, index) => ({
      id: item.id,
      ordine: index + 1
    }));
    
    for (const update of updates) {
      await supabase
        .from("requisiti_bando")
        .update({ ordine: update.ordine })
        .eq("id", update.id);
    }
    
    queryClient.invalidateQueries({ queryKey: ["requisiti-bando-admin"] });
  };

  const addOption = (requisito: { nome: string; descrizione?: string; icona?: string; obbligatorio_default?: boolean }) => {
    setIsAdding(true);
    addMutation.mutate(requisito);
  };

  return {
    options,
    isLoading,
    isAdding,
    addOption,
    updateOption: (data: Partial<RequisitoOption> & { id: string }) => updateMutation.mutate(data),
    toggleActive: (data: { id: string; attivo: boolean }) => toggleActiveMutation.mutate(data),
    deleteOption: (id: string) => deleteMutation.mutate(id),
    swapOrder,
  };
}
