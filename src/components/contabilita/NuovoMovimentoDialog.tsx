import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, Upload, X, FileText } from 'lucide-react';
import { useCategorieContabili, useProgettiContabili, useCreateMovimento } from '@/hooks/useContabilita';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface NuovoMovimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associazioneId: string;
  esercizioId: string;
  tipoDefault: 'entrata' | 'uscita';
}

const metodiPagamento = [
  { value: 'contanti', label: 'Contanti' },
  { value: 'bonifico', label: 'Bonifico bancario' },
  { value: 'carta', label: 'Carta di credito/debito' },
  { value: 'assegno', label: 'Assegno' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'altro', label: 'Altro' },
];

export function NuovoMovimentoDialog({
  open,
  onOpenChange,
  associazioneId,
  esercizioId,
  tipoDefault,
}: NuovoMovimentoDialogProps) {
  const { data: categorie } = useCategorieContabili('mod_d');
  const { data: progetti } = useProgettiContabili(associazioneId);
  const createMovimento = useCreateMovimento();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipo, setTipo] = useState<'entrata' | 'uscita'>(tipoDefault);
  const [allegato, setAllegato] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    data_movimento: format(new Date(), 'yyyy-MM-dd'),
    importo: '',
    descrizione: '',
    categoria_id: '',
    progetto_id: '',
    beneficiario_pagatore: '',
    metodo_pagamento: '',
    riferimento_documento: '',
    note: '',
  });

  // Filtra categorie in base al tipo
  const categorieFiltered = categorie?.filter(cat => {
    if (tipo === 'entrata') return cat.sezione === 'ENTRATE' && cat.codice.includes('.');
    return cat.sezione === 'USCITE' && cat.codice.includes('.');
  }) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      toast({ title: 'File troppo grande', description: 'Massimo 10 MB', variant: 'destructive' });
      return;
    }
    setAllegato(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const movimento = await createMovimento.mutateAsync({
      associazione_id: associazioneId,
      esercizio_id: esercizioId,
      tipo,
      data_movimento: formData.data_movimento,
      importo: parseFloat(formData.importo),
      descrizione: formData.descrizione,
      categoria_id: formData.categoria_id,
      progetto_id: formData.progetto_id || null,
      beneficiario_pagatore: formData.beneficiario_pagatore || null,
      metodo_pagamento: formData.metodo_pagamento || null,
      riferimento_documento: formData.riferimento_documento || null,
      note: formData.note || null,
    });

    // Upload allegato se presente
    if (allegato && movimento?.id) {
      setUploadingFile(true);
      try {
        const ext = allegato.name.split('.').pop();
        const path = `${associazioneId}/${movimento.id}/${Date.now()}.${ext}`;
        const { error: storageError } = await supabase.storage
          .from('contabilita-documenti')
          .upload(path, allegato, { contentType: allegato.type, upsert: false });

        if (storageError) throw storageError;

        await supabase.from('documenti_contabili').insert({
          movimento_id: movimento.id,
          nome_file: allegato.name,
          file_path: path,
          mime_type: allegato.type,
          dimensione: allegato.size,
        });
      } catch (err) {
        toast({ title: 'Movimento salvato', description: 'Allegato non caricato: riprova dalla scheda del movimento.', variant: 'destructive' });
      } finally {
        setUploadingFile(false);
      }
    }

    onOpenChange(false);
    setAllegato(null);
    setFormData({
      data_movimento: format(new Date(), 'yyyy-MM-dd'),
      importo: '',
      descrizione: '',
      categoria_id: '',
      progetto_id: '',
      beneficiario_pagatore: '',
      metodo_pagamento: '',
      riferimento_documento: '',
      note: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tipo === 'entrata' ? (
              <>
                <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                Nuova Entrata
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                Nuova Uscita
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Registra un movimento contabile. I campi con * sono obbligatori.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipo === 'entrata' ? 'default' : 'outline'}
              className={tipo === 'entrata' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={() => setTipo('entrata')}
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Entrata
            </Button>
            <Button
              type="button"
              variant={tipo === 'uscita' ? 'default' : 'outline'}
              className={tipo === 'uscita' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => setTipo('uscita')}
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Uscita
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_movimento}
                onChange={(e) => setFormData({ ...formData, data_movimento: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importo">Importo (€) *</Label>
              <Input
                id="importo"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={formData.importo}
                onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione *</Label>
            <Input
              id="descrizione"
              placeholder="Es: Quota associativa 2024, Affitto sede..."
              value={formData.descrizione}
              onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria ministeriale *</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categorieFiltered.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="font-mono text-xs mr-2">{cat.codice}</span>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiario">
                {tipo === 'entrata' ? 'Da chi' : 'A chi'}
              </Label>
              <Input
                id="beneficiario"
                placeholder={tipo === 'entrata' ? 'Nome pagatore' : 'Nome beneficiario'}
                value={formData.beneficiario_pagatore}
                onChange={(e) => setFormData({ ...formData, beneficiario_pagatore: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metodo">Metodo pagamento</Label>
              <Select
                value={formData.metodo_pagamento}
                onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {metodiPagamento.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riferimento">Riferimento documento</Label>
            <Input
              id="riferimento"
              placeholder="Es: Fattura n. 123, Ricevuta n. 456..."
              value={formData.riferimento_documento}
              onChange={(e) => setFormData({ ...formData, riferimento_documento: e.target.value })}
            />
          </div>

          {progetti && progetti.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="progetto">Progetto / Bando (opzionale)</Label>
              <Select
                value={formData.progetto_id}
                onValueChange={(value) => setFormData({ ...formData, progetto_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Associa a un progetto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun progetto</SelectItem>
                  {progetti.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.titolo} {p.cig && `(CIG: ${p.cig})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note aggiuntive</Label>
            <Textarea
              id="note"
              placeholder="Eventuali note..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
            />
          </div>

          {/* Upload allegato */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
          {allegato ? (
            <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/40">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{allegato.name}</p>
                <p className="text-xs text-muted-foreground">{(allegato.size / 1024).toFixed(0)} KB</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setAllegato(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Allega giustificativo (opzionale)</p>
              <p className="text-xs">PDF, immagine, Word, Excel — max 10 MB</p>
            </button>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createMovimento.isPending || uploadingFile || !formData.categoria_id || !formData.importo}
              className={tipo === 'entrata' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {uploadingFile ? 'Caricamento allegato...' : createMovimento.isPending ? 'Salvataggio...' : 'Registra Movimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
