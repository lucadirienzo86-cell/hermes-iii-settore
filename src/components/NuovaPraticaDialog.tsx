import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface NuovaPraticaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const NuovaPraticaDialog = ({ open, onOpenChange, onSuccess }: NuovaPraticaDialogProps) => {
  const [aziende, setAziende] = useState<any[]>([]);
  const [bandi, setBandi] = useState<any[]>([]);
  const [searchAzienda, setSearchAzienda] = useState('');
  const [searchBando, setSearchBando] = useState('');
  const [selectedAzienda, setSelectedAzienda] = useState('');
  const [selectedBando, setSelectedBando] = useState('');
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadAziende();
      loadBandi();
    }
  }, [open]);

  const loadAziende = async () => {
    const { data } = await supabase
      .from('aziende')
      .select('id, ragione_sociale, partita_iva, inserita_da_gestore_id')
      .order('ragione_sociale');
    
    if (data) setAziende(data);
  };

  const loadBandi = async () => {
    const { data } = await supabase
      .from('bandi')
      .select('id, titolo')
      .eq('attivo', true)
      .order('titolo');
    
    if (data) setBandi(data);
  };

  const handleCreate = async () => {
    if (!selectedAzienda || !selectedBando) {
      toast.error('Seleziona azienda e bando');
      return;
    }

    setCreating(true);

    try {
      // Verifica se esiste già
      const { data: existing } = await supabase
        .from('pratiche')
        .select('id')
        .eq('azienda_id', selectedAzienda)
        .eq('bando_id', selectedBando)
        .maybeSingle();

      if (existing) {
        toast.error('Pratica già esistente per questa combinazione');
        setCreating(false);
        return;
      }

      // Recupera bando per titolo
      const bando = bandi.find(b => b.id === selectedBando);
      
      const { error } = await supabase
        .from('pratiche')
        .insert({
          azienda_id: selectedAzienda,
          bando_id: selectedBando,
          titolo: bando?.titolo || 'Nuova Pratica',
          stato: 'bozza',
          descrizione: note || null,
        });

      if (error) throw error;

      toast.success('Pratica creata con successo');
      setSelectedAzienda('');
      setSelectedBando('');
      setNote('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Errore creazione pratica:', error);
      toast.error('Errore nella creazione della pratica');
    } finally {
      setCreating(false);
    }
  };

  const filteredAziende = aziende.filter(a => 
    a.ragione_sociale.toLowerCase().includes(searchAzienda.toLowerCase()) ||
    a.partita_iva.includes(searchAzienda)
  );

  const filteredBandi = bandi.filter(b => 
    b.titolo?.toLowerCase().includes(searchBando.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuova Pratica</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="azienda">Azienda</Label>
            <Input
              placeholder="Cerca per ragione sociale o P.IVA..."
              value={searchAzienda}
              onChange={(e) => setSearchAzienda(e.target.value)}
              className="mb-2"
            />
            <Select value={selectedAzienda} onValueChange={setSelectedAzienda}>
              <SelectTrigger id="azienda">
                <SelectValue placeholder="Seleziona azienda" />
              </SelectTrigger>
              <SelectContent>
                {filteredAziende.map((azienda) => (
                  <SelectItem key={azienda.id} value={azienda.id}>
                    {azienda.ragione_sociale} - {azienda.partita_iva}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bando">Bando</Label>
            <Input
              placeholder="Cerca bando..."
              value={searchBando}
              onChange={(e) => setSearchBando(e.target.value)}
              className="mb-2"
            />
            <Select value={selectedBando} onValueChange={setSelectedBando}>
              <SelectTrigger id="bando">
                <SelectValue placeholder="Seleziona bando" />
              </SelectTrigger>
              <SelectContent>
                {filteredBandi.map((bando) => (
                  <SelectItem key={bando.id} value={bando.id}>
                    {bando.titolo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-nuova">Note (opzionale)</Label>
            <Textarea
              id="note-nuova"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Aggiungi note sulla pratica..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Annulla
          </Button>
          <Button onClick={handleCreate} disabled={creating || !selectedAzienda || !selectedBando}>
            {creating ? 'Creazione...' : 'Crea Pratica'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
