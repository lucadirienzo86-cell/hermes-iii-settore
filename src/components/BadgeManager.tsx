import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Award, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface BadgeCategoria {
  id: string;
  nome: string;
  descrizione: string | null;
  colore: string | null;
  attivo: boolean;
}

interface BadgeTipo {
  id: string;
  nome: string;
  descrizione: string | null;
  icona: string | null;
  colore: string | null;
  attivo: boolean;
  categoria_id: string | null;
}

interface BadgeAssegnazione {
  id: string;
  badge_tipo_id: string;
  docente_id: string | null;
  collaboratore_id: string | null;
  azienda_id: string | null;
  note: string | null;
  data_scadenza: string | null;
  created_at: string | null;
  badge_tipi?: BadgeTipo;
}

interface BadgeManagerProps {
  entityType: "docente" | "collaboratore" | "azienda";
  entityId: string;
  canEdit?: boolean;
  compact?: boolean;
}

const BadgeManager = ({ entityType, entityId, canEdit = false, compact = false }: BadgeManagerProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [dataScadenza, setDataScadenza] = useState("");

  // Get field name based on entity type
  const getEntityField = () => {
    switch (entityType) {
      case "docente": return "docente_id";
      case "collaboratore": return "collaboratore_id";
      case "azienda": return "azienda_id";
    }
  };

  // Fetch badge categories
  const { data: categorie } = useQuery({
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

  // Fetch badge types
  const { data: badgeTipi } = useQuery({
    queryKey: ["badge_tipi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_tipi")
        .select("*")
        .eq("attivo", true)
        .order("ordine", { ascending: true });
      if (error) throw error;
      return data as BadgeTipo[];
    }
  });

  // Fetch assigned badges for this entity
  const { data: assignedBadges, isLoading } = useQuery({
    queryKey: ["badge_assegnazioni", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badge_assegnazioni")
        .select("*, badge_tipi(*)")
        .eq(getEntityField(), entityId);
      if (error) throw error;
      return data as BadgeAssegnazione[];
    }
  });

  // Log badge change
  const logBadgeChange = async (badgeTipoId: string, azione: 'assegnato' | 'rimosso', assegnazioneId?: string) => {
    try {
      await supabase.from("badge_log").insert({
        badge_assegnazione_id: assegnazioneId || null,
        badge_tipo_id: badgeTipoId,
        entity_type: entityType,
        entity_id: entityId,
        azione,
        eseguito_da: profile?.id,
        note: azione === 'assegnato' ? note || null : null
      });
    } catch (error) {
      console.error('Errore logging badge:', error);
    }
  };

  // Assign badge mutation
  const assignMutation = useMutation({
    mutationFn: async (badgeIds: string[]) => {
      const assignments = badgeIds.map(badgeId => ({
        badge_tipo_id: badgeId,
        [getEntityField()]: entityId,
        assegnato_da: profile?.id,
        note: note || null,
        data_scadenza: dataScadenza || null
      }));
      
      const { data, error } = await supabase.from("badge_assegnazioni").insert(assignments).select();
      if (error) throw error;
      
      // Log each assignment
      for (const assignment of data || []) {
        await logBadgeChange(assignment.badge_tipo_id, 'assegnato', assignment.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge_assegnazioni", entityType, entityId] });
      toast({ title: "Badge assegnati con successo" });
      setDialogOpen(false);
      setSelectedBadges(new Set());
      setNote("");
      setDataScadenza("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  // Remove badge mutation
  const removeMutation = useMutation({
    mutationFn: async ({ assegnazioneId, badgeTipoId }: { assegnazioneId: string; badgeTipoId: string }) => {
      const { error } = await supabase.from("badge_assegnazioni").delete().eq("id", assegnazioneId);
      if (error) throw error;
      
      // Log removal
      await logBadgeChange(badgeTipoId, 'rimosso', assegnazioneId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge_assegnazioni", entityType, entityId] });
      toast({ title: "Badge rimosso" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const handleToggleBadge = (badgeId: string) => {
    const newSet = new Set(selectedBadges);
    if (newSet.has(badgeId)) {
      newSet.delete(badgeId);
    } else {
      newSet.add(badgeId);
    }
    setSelectedBadges(newSet);
  };

  const handleAssign = () => {
    if (selectedBadges.size === 0) {
      toast({ title: "Seleziona almeno un badge", variant: "destructive" });
      return;
    }
    assignMutation.mutate(Array.from(selectedBadges));
  };

  const getAvailableBadges = () => {
    const assignedIds = new Set(assignedBadges?.map(a => a.badge_tipo_id) || []);
    return badgeTipi?.filter(b => !assignedIds.has(b.id)) || [];
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Caricamento badge...</div>;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {assignedBadges && assignedBadges.length > 0 ? (
          assignedBadges.slice(0, 3).map((assegnazione) => (
            <Badge
              key={assegnazione.id}
              style={{ backgroundColor: assegnazione.badge_tipi?.colore || "#3B82F6" }}
              className="text-white text-xs"
            >
              {assegnazione.badge_tipi?.nome}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
        {assignedBadges && assignedBadges.length > 3 && (
          <Badge variant="outline" className="text-xs">+{assignedBadges.length - 3}</Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Badge Formativi</span>
        </div>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Aggiungi
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {assignedBadges && assignedBadges.length > 0 ? (
          assignedBadges.map((assegnazione) => (
            <div key={assegnazione.id} className="group relative">
              <Badge
                style={{ backgroundColor: assegnazione.badge_tipi?.colore || "#3B82F6" }}
                className="text-white pr-6"
              >
                {assegnazione.badge_tipi?.nome}
                {canEdit && (
                  <button
                    onClick={() => removeMutation.mutate({ assegnazioneId: assegnazione.id, badgeTipoId: assegnazione.badge_tipo_id })}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Nessun badge formativo assegnato</span>
        )}
      </div>

      {/* Dialog per assegnare badge */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assegna Badge Formativi</DialogTitle>
            <DialogDescription>
              Seleziona i badge formativi da assegnare
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto">
            {categorie?.map((cat) => {
              const catBadges = getAvailableBadges().filter(b => b.categoria_id === cat.id);
              if (catBadges.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.colore || "#3B82F6" }}
                    />
                    <span className="text-sm font-medium text-muted-foreground">{cat.nome}</span>
                  </div>
                  {catBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer ml-2"
                      onClick={() => handleToggleBadge(badge.id)}
                    >
                      <Checkbox
                        checked={selectedBadges.has(badge.id)}
                        onCheckedChange={() => handleToggleBadge(badge.id)}
                      />
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: badge.colore || "#3B82F6" }}
                      >
                        {badge.icona?.charAt(0) || "🎓"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{badge.nome}</p>
                        {badge.descrizione && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{badge.descrizione}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            
            {/* Badge senza categoria */}
            {getAvailableBadges().filter(b => !b.categoria_id).length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Altro</span>
                {getAvailableBadges().filter(b => !b.categoria_id).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleToggleBadge(badge.id)}
                  >
                    <Checkbox
                      checked={selectedBadges.has(badge.id)}
                      onCheckedChange={() => handleToggleBadge(badge.id)}
                    />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: badge.colore || "#3B82F6" }}
                    >
                      {badge.icona?.charAt(0) || "🎓"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{badge.nome}</p>
                      {badge.descrizione && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{badge.descrizione}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {getAvailableBadges().length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tutti i badge sono già stati assegnati
              </p>
            )}

            <div>
              <Label htmlFor="note">Note (opzionale)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Motivo dell'assegnazione..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="data_scadenza">Data Scadenza (opzionale)</Label>
              <Input
                id="data_scadenza"
                type="date"
                value={dataScadenza}
                onChange={(e) => setDataScadenza(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleAssign} disabled={selectedBadges.size === 0}>
              Assegna ({selectedBadges.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BadgeManager;
