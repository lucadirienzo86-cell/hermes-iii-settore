import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Newspaper, 
  Plus, 
  ExternalLink, 
  FileText, 
  Trash2,
  Calendar
} from 'lucide-react';
import { useRassegnaStampa, ArticoloRassegna } from '@/hooks/useRassegnaStampa';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const tipoLabels: Record<string, { label: string; color: string }> = {
  articolo: { label: 'Articolo', color: 'bg-blue-100 text-blue-700' },
  comunicato: { label: 'Comunicato', color: 'bg-green-100 text-green-700' },
  determina: { label: 'Determina', color: 'bg-purple-100 text-purple-700' },
  delibera: { label: 'Delibera', color: 'bg-orange-100 text-orange-700' },
  altro: { label: 'Altro', color: 'bg-gray-100 text-gray-700' },
};

interface NuovoArticoloFormProps {
  onSubmit: (articolo: Omit<ArticoloRassegna, 'id' | 'created_at' | 'created_by'>) => void;
  onClose: () => void;
}

const NuovoArticoloForm = ({ onSubmit, onClose }: NuovoArticoloFormProps) => {
  const [formData, setFormData] = useState({
    titolo: '',
    fonte: '',
    url: '',
    data_pubblicazione: '',
    tipo: 'articolo' as const,
    contenuto: '',
    visibilita: 'interno' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      data_pubblicazione: formData.data_pubblicazione || null,
      fonte: formData.fonte || null,
      url: formData.url || null,
      contenuto: formData.contenuto || null,
      allegato_url: null,
      associazione_id: null,
      bando_id: null,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titolo">Titolo *</Label>
        <Input
          id="titolo"
          value={formData.titolo}
          onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="articolo">Articolo</SelectItem>
              <SelectItem value="comunicato">Comunicato</SelectItem>
              <SelectItem value="determina">Determina</SelectItem>
              <SelectItem value="delibera">Delibera</SelectItem>
              <SelectItem value="altro">Altro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="visibilita">Visibilità</Label>
          <Select value={formData.visibilita} onValueChange={(v: any) => setFormData({ ...formData, visibilita: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pubblico">Pubblico</SelectItem>
              <SelectItem value="interno">Interno</SelectItem>
              <SelectItem value="riservato">Riservato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fonte">Fonte</Label>
          <Input
            id="fonte"
            value={formData.fonte}
            onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
            placeholder="es. Il Sole 24 Ore"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data">Data pubblicazione</Label>
          <Input
            id="data"
            type="date"
            value={formData.data_pubblicazione}
            onChange={(e) => setFormData({ ...formData, data_pubblicazione: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contenuto">Note / Contenuto</Label>
        <Textarea
          id="contenuto"
          value={formData.contenuto}
          onChange={(e) => setFormData({ ...formData, contenuto: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button type="submit">
          Aggiungi
        </Button>
      </div>
    </form>
  );
};

export const RassegnaStampaPanel = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { articoli, isLoading, aggiungiArticolo, eliminaArticolo } = useRassegnaStampa();

  if (isLoading) {
    return (
      <Card className="ist-card">
        <CardHeader className="pb-2">
          <CardTitle className="ist-card-header">
            <Newspaper className="h-5 w-5" />
            Rassegna Stampa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ist-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="ist-card-header">
            <Newspaper className="h-5 w-5" />
            Rassegna Stampa
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Aggiungi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuovo articolo</DialogTitle>
              </DialogHeader>
              <NuovoArticoloForm 
                onSubmit={(data) => aggiungiArticolo.mutate(data)}
                onClose={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {articoli.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nessun articolo</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {articoli.slice(0, 10).map((articolo) => (
                <div 
                  key={articolo.id} 
                  className="p-3 rounded-lg border bg-white hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tipoLabels[articolo.tipo]?.color}`}>
                          {tipoLabels[articolo.tipo]?.label || articolo.tipo}
                        </Badge>
                        {articolo.data_pubblicazione && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(articolo.data_pubblicazione), 'dd/MM/yyyy', { locale: it })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{articolo.titolo}</p>
                      {articolo.fonte && (
                        <p className="text-xs text-muted-foreground">{articolo.fonte}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {articolo.url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => window.open(articolo.url!, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => eliminaArticolo.mutate(articolo.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
