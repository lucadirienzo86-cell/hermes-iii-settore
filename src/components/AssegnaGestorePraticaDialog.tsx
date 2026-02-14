import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserCheck, Loader2 } from 'lucide-react';

interface GestorePratiche {
  id: string;
  nome: string;
  cognome: string;
  categoria: string;
}

interface AssegnaGestorePraticaDialogProps {
  praticaId: string | null;
  praticaTitolo?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export const AssegnaGestorePraticaDialog = ({
  praticaId,
  praticaTitolo,
  open,
  onOpenChange,
  onAssigned
}: AssegnaGestorePraticaDialogProps) => {
  const { profile } = useAuth();
  const [gestoriPratiche, setGestoriPratiche] = useState<GestorePratiche[]>([]);
  const [selectedGestoreId, setSelectedGestoreId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carica i gestori pratiche assegnati a questo professionista
  useEffect(() => {
    const loadGestoriPratiche = async () => {
      if (!profile?.id || !open) return;

      setLoading(true);
      try {
        // Prima trova l'ID del gestore o docente corrente
        let gestoreId: string | null = null;
        let docenteId: string | null = null;

        if (profile.role === 'gestore') {
          const { data: gestore } = await supabase
            .from('gestori')
            .select('id')
            .eq('profile_id', profile.id)
            .maybeSingle();
          gestoreId = gestore?.id || null;
        } else if (profile.role === 'docente') {
          const { data: docente } = await supabase
            .from('docenti')
            .select('id')
            .eq('profile_id', profile.id)
            .maybeSingle();
          docenteId = docente?.id || null;
        }

        // Carica le assegnazioni
        let query = supabase
          .from('gestori_pratiche_assegnazioni')
          .select(`
            gestore_pratiche_id,
            gestori_pratiche(id, nome, cognome, categoria, attivo)
          `);

        if (gestoreId) {
          query = query.eq('gestore_id', gestoreId);
        } else if (docenteId) {
          query = query.eq('docente_id', docenteId);
        } else {
          setGestoriPratiche([]);
          setLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filtra solo gestori pratiche attivi
        const gestori = (data || [])
          .filter((item: any) => item.gestori_pratiche?.attivo)
          .map((item: any) => item.gestori_pratiche as GestorePratiche);

        setGestoriPratiche(gestori);
      } catch (error) {
        console.error('Errore caricamento gestori pratiche:', error);
        toast.error('Errore nel caricamento dei gestori pratiche');
      } finally {
        setLoading(false);
      }
    };

    loadGestoriPratiche();
  }, [profile?.id, profile?.role, open]);

  const handleAssign = async () => {
    if (!praticaId || !selectedGestoreId || !profile?.id) return;

    setSaving(true);
    try {
      // Aggiorna la pratica con il gestore pratiche selezionato
      const { error } = await supabase
        .from('pratiche')
        .update({
          gestore_pratiche_id: selectedGestoreId,
          updated_at: new Date().toISOString()
        })
        .eq('id', praticaId);

      if (error) throw error;

      // Registra nel log
      await supabase.from('pratiche_log').insert({
        pratica_id: praticaId,
        user_id: profile.id,
        user_type: profile.role || 'unknown',
        azione: 'assegnazione_gestore',
        dettagli: { gestore_pratiche_id: selectedGestoreId }
      });

      toast.success('Gestore pratiche assegnato con successo');
      onAssigned();
      onOpenChange(false);
      setSelectedGestoreId('');
    } catch (error: any) {
      console.error('Errore assegnazione gestore pratiche:', error);
      toast.error('Errore nell\'assegnazione del gestore pratiche');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assegna Gestore Pratiche
          </DialogTitle>
        </DialogHeader>

        {praticaTitolo && (
          <p className="text-sm text-muted-foreground">
            Seleziona il gestore pratiche per: <strong>{praticaTitolo}</strong>
          </p>
        )}

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : gestoriPratiche.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nessun gestore pratiche disponibile.</p>
              <p className="text-xs mt-2">
                Contatta l'amministratore per assegnarti dei gestori pratiche.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="gestore-select">Gestore Pratiche</Label>
              <Select value={selectedGestoreId} onValueChange={setSelectedGestoreId}>
                <SelectTrigger id="gestore-select">
                  <SelectValue placeholder="Seleziona un gestore pratiche" />
                </SelectTrigger>
                <SelectContent>
                  {gestoriPratiche.map((gp) => (
                    <SelectItem key={gp.id} value={gp.id}>
                      <div className="flex flex-col">
                        <span>{gp.nome} {gp.cognome}</span>
                        <span className="text-xs text-muted-foreground">{gp.categoria}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annulla
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedGestoreId || saving || gestoriPratiche.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assegnazione...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Assegna
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
