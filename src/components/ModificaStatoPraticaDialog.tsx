import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StatoPraticaBadge, getStatoLabel } from '@/components/StatoPraticaBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PraticaDocumenti } from '@/components/PraticaDocumenti';
import { STATI_PRATICHE } from '@/hooks/usePratiche';
import type { Pratica } from '@/hooks/usePratiche';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ModificaStatoPraticaDialogProps {
  pratica: Pratica | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (praticaId: string, nuovoStato: string, note?: string) => Promise<boolean>;
  canModifyStato?: boolean;
  isGestorePratiche?: boolean;
  gestorePraticheId?: string | null;
}

export const ModificaStatoPraticaDialog = ({ 
  pratica, 
  open, 
  onOpenChange, 
  onSave,
  canModifyStato = false,
  isGestorePratiche = false,
  gestorePraticheId = null,
}: ModificaStatoPraticaDialogProps) => {
  const [nuovoStato, setNuovoStato] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Verifica se stiamo ancora caricando i dati del gestore pratiche
  const isLoading = isGestorePratiche && gestorePraticheId === null;

  // Il gestore pratiche può modificare solo le pratiche che ha preso in carico
  const canModifyThisPratica = canModifyStato && 
    (!isGestorePratiche || pratica?.gestore_pratiche_id === gestorePraticheId);

  // Debug logging
  useEffect(() => {
    if (open && pratica) {
      console.log('[ModificaStatoPraticaDialog] Dialog opened:', {
        canModifyStato,
        isGestorePratiche,
        gestorePraticheId,
        praticaGestoreId: pratica.gestore_pratiche_id,
        canModifyThisPratica,
        isLoading
      });
    }
  }, [open, pratica, canModifyStato, isGestorePratiche, gestorePraticheId, canModifyThisPratica, isLoading]);

  const handleSave = async () => {
    if (!pratica || !nuovoStato) return;

    setSaving(true);
    const success = await onSave(pratica.id, nuovoStato, note || undefined);
    setSaving(false);

    if (success) {
      setNuovoStato('');
      setNote('');
      onOpenChange(false);
    }
  };

  if (!pratica) return null;

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Caricamento...</DialogTitle>
            <DialogDescription>Caricamento dati in corso</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestione Pratica</DialogTitle>
          <DialogDescription>
            {pratica?.aziende?.ragione_sociale} - {pratica?.bandi?.titolo || 'Nessun bando'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={canModifyThisPratica ? "stato" : "documenti"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stato">Stato e Note</TabsTrigger>
            <TabsTrigger value="documenti">Documenti</TabsTrigger>
          </TabsList>

          <TabsContent value="stato" className="space-y-6 mt-4">
            {/* Informazioni pratica */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Azienda</Label>
                <p className="font-medium">{pratica.aziende?.ragione_sociale}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bando</Label>
                <p className="font-medium">{pratica.bandi?.titolo || 'Nessun bando associato'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stato Attuale</Label>
                <div className="mt-1">
                  <StatoPraticaBadge stato={pratica.stato} />
                </div>
              </div>
              {pratica.gestori_pratiche && (
                <div>
                  <Label className="text-xs text-muted-foreground">Gestore Pratiche Assegnato</Label>
                  <p className="font-medium">{pratica.gestori_pratiche.nome} {pratica.gestori_pratiche.cognome}</p>
                </div>
              )}
            </div>

            {/* Avviso se non può modificare lo stato */}
            {!canModifyThisPratica && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {isGestorePratiche && pratica.gestore_pratiche_id !== gestorePraticheId
                    ? 'Puoi modificare lo stato solo delle pratiche che hai preso in carico.'
                    : 'Non hai i permessi per modificare lo stato di questa pratica. Puoi solo caricare documenti.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Nuovo stato - solo se autorizzato */}
            {canModifyThisPratica && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nuovo-stato">Nuovo Stato</Label>
                  <Select value={nuovoStato} onValueChange={setNuovoStato}>
                    <SelectTrigger id="nuovo-stato">
                      <SelectValue placeholder="Seleziona nuovo stato" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATI_PRATICHE.map((stato) => (
                        <SelectItem key={stato} value={stato}>
                          <div className="flex items-center gap-2">
                            <StatoPraticaBadge stato={stato} />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note (opzionale)</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Aggiungi note sulla modifica dello stato..."
                    rows={4}
                  />
                </div>
              </>
            )}


            {canModifyThisPratica && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Annulla
                </Button>
                <Button onClick={handleSave} disabled={!nuovoStato || saving}>
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documenti" className="mt-4">
            <PraticaDocumenti praticaId={pratica.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
