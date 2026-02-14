import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface BadgeTipo {
  id: string;
  nome: string;
  descrizione: string | null;
  icona: string | null;
  colore: string | null;
  attivo: boolean | null;
  categoria_id: string | null;
}

export interface BadgeCategoria {
  id: string;
  nome: string;
  descrizione: string | null;
  colore: string | null;
  icona: string | null;
  ordine: number | null;
}

export interface BadgeByCategoria {
  categoria: BadgeCategoria | null;
  badges: BadgeTipo[];
}

export function useBadgeFormativi() {
  // Fetch badge tipi
  const { data: badgeFormativi = [], isLoading: isLoadingBadge } = useQuery({
    queryKey: ["badge_tipi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_tipi")
        .select("*")
        .eq("attivo", true)
        .order("nome");
      if (error) throw error;
      return data as BadgeTipo[];
    }
  });

  // Fetch categorie
  const { data: badgeCategorie = [], isLoading: isLoadingCategorie } = useQuery({
    queryKey: ["badge_categorie"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_categorie")
        .select("*")
        .eq("attivo", true)
        .order("ordine", { ascending: true });
      if (error) throw error;
      return data as BadgeCategoria[];
    }
  });

  // Lista dei nomi dei badge per uso in MultiSelect
  const badgeOptions = badgeFormativi.map(b => b.nome);

  // Badge raggruppati per categoria
  const badgeByCategoria = useMemo((): BadgeByCategoria[] => {
    const result: BadgeByCategoria[] = [];
    
    // Prima le categorie ordinate
    badgeCategorie.forEach(categoria => {
      const badgesInCategoria = badgeFormativi.filter(b => b.categoria_id === categoria.id);
      if (badgesInCategoria.length > 0) {
        result.push({
          categoria,
          badges: badgesInCategoria
        });
      }
    });
    
    // Poi i badge senza categoria
    const badgesSenzaCategoria = badgeFormativi.filter(b => !b.categoria_id);
    if (badgesSenzaCategoria.length > 0) {
      result.push({
        categoria: null,
        badges: badgesSenzaCategoria
      });
    }
    
    return result;
  }, [badgeFormativi, badgeCategorie]);

  const isLoading = isLoadingBadge || isLoadingCategorie;

  return { 
    badgeFormativi, 
    badgeOptions, 
    badgeCategorie,
    badgeByCategoria,
    isLoading 
  };
}
