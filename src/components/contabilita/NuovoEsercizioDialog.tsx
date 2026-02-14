import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';
import { useCreateEsercizio } from '@/hooks/useContabilita';

interface NuovoEsercizioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associazioneId: string;
}

export function NuovoEsercizioDialog({
  open,
  onOpenChange,
  associazioneId,
}: NuovoEsercizioDialogProps) {
  const createEsercizio = useCreateEsercizio();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    anno: currentYear,
    data_inizio: `${currentYear}-01-01`,
    data_fine: `${currentYear}-12-31`,
    note: '',
  });

  const handleYearChange = (anno: number) => {
    setFormData({
      ...formData,
      anno,
      data_inizio: `${anno}-01-01`,
      data_fine: `${anno}-12-31`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createEsercizio.mutateAsync({
      associazione_id: associazioneId,
      anno: formData.anno,
      data_inizio: formData.data_inizio,
      data_fine: formData.data_fine,
      note: formData.note || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Nuovo Esercizio Contabile
          </DialogTitle>
          <DialogDescription>
            Crea un nuovo esercizio per registrare entrate e uscite dell'anno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anno">Anno *</Label>
            <Input
              id="anno"
              type="number"
              min="2020"
              max="2030"
              value={formData.anno}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inizio">Data inizio *</Label>
              <Input
                id="data_inizio"
                type="date"
                value={formData.data_inizio}
                onChange={(e) => setFormData({ ...formData, data_inizio: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fine">Data fine *</Label>
              <Input
                id="data_fine"
                type="date"
                value={formData.data_fine}
                onChange={(e) => setFormData({ ...formData, data_fine: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (opzionale)</Label>
            <Textarea
              id="note"
              placeholder="Eventuali note sull'esercizio..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createEsercizio.isPending}>
              {createEsercizio.isPending ? 'Creazione...' : 'Crea Esercizio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
