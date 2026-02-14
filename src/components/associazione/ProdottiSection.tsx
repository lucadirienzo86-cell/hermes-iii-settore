import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Copy, 
  ExternalLink, 
  Euro,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  useProdotti, 
  useCreateProdotto, 
  useUpdateProdotto,
  useDeleteProdotto 
} from '@/hooks/useProdotti';
import { usePaymentLinks, useCreatePaymentLink, generateManuPayLink, formatCurrency } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

interface ProdottiSectionProps {
  associazioneId: string;
}

export const ProdottiSection = ({ associazioneId }: ProdottiSectionProps) => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    prezzo: '',
    quantita_disponibile: '',
  });

  const { data: prodotti, isLoading } = useProdotti(associazioneId);
  const { data: paymentLinks } = usePaymentLinks(associazioneId);
  const createProdotto = useCreateProdotto();
  const updateProdotto = useUpdateProdotto();
  const deleteProdotto = useDeleteProdotto();
  const createPaymentLink = useCreatePaymentLink();

  const handleCreate = () => {
    createProdotto.mutate({
      associazione_id: associazioneId,
      nome: formData.nome,
      descrizione: formData.descrizione || undefined,
      prezzo: parseFloat(formData.prezzo),
      quantita_disponibile: formData.quantita_disponibile ? parseInt(formData.quantita_disponibile) : undefined,
    }, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setFormData({ nome: '', descrizione: '', prezzo: '', quantita_disponibile: '' });
      },
    });
  };

  const copyPaymentLink = (prodotto: any) => {
    const productLink = paymentLinks?.find(l => l.id === prodotto.payment_link_id);
    if (productLink) {
      navigator.clipboard.writeText(generateManuPayLink(productLink));
      toast({
        title: 'Link copiato',
        description: 'Il link di pagamento è stato copiato.',
      });
    }
  };

  const activeProdotti = prodotti?.filter(p => p.attivo) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prodotti e Quote</h3>
          <p className="text-sm text-muted-foreground">
            Gestisci la vendita di prodotti, gadget e quote associative
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prodotti Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{activeProdotti.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valore Catalogo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">
                {formatCurrency(
                  activeProdotti.reduce((sum, p) => sum + Number(p.prezzo), 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Catalogo Prodotti</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Caricamento...</div>
          ) : prodotti?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun prodotto creato</p>
              <p className="text-sm">Aggiungi prodotti per iniziare le vendite</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prodotti?.map((prodotto) => (
                <div 
                  key={prodotto.id} 
                  className={`p-4 border rounded-lg ${!prodotto.attivo ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{prodotto.nome}</h4>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateProdotto.mutate({ 
                          id: prodotto.id, 
                          attivo: !prodotto.attivo 
                        })}
                      >
                        <Switch checked={prodotto.attivo} />
                      </Button>
                    </div>
                  </div>
                  
                  {prodotto.descrizione && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {prodotto.descrizione}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(prodotto.prezzo)}
                    </span>
                    {prodotto.quantita_disponibile !== null && (
                      <Badge variant="outline">
                        {prodotto.quantita_disponibile} disponibili
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => copyPaymentLink(prodotto)}
                      disabled={!prodotto.payment_link_id}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copia Link
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteProdotto.mutate(prodotto.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Prodotto</DialogTitle>
            <DialogDescription>
              Configura un nuovo prodotto o quota da vendere
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome prodotto *</Label>
              <Input
                placeholder="es. Maglietta associazione"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <Label>Descrizione</Label>
              <Textarea
                placeholder="Descrivi il prodotto..."
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prezzo (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="15.00"
                  value={formData.prezzo}
                  onChange={(e) => setFormData({ ...formData, prezzo: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantità disponibile</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Illimitata"
                  value={formData.quantita_disponibile}
                  onChange={(e) => setFormData({ ...formData, quantita_disponibile: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!formData.nome || !formData.prezzo || createProdotto.isPending}
            >
              {createProdotto.isPending ? 'Creazione...' : 'Aggiungi Prodotto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
