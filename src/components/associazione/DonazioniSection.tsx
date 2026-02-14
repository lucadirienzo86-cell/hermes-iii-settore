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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Heart, 
  Plus, 
  Copy, 
  ExternalLink, 
  Euro,
  TrendingUp,
  Users
} from 'lucide-react';
import { 
  usePaymentLinks, 
  useDonationStats, 
  useCreatePaymentLink, 
  useTogglePaymentLink,
  generateManuPayLink,
  formatCurrency 
} from '@/hooks/usePayments';
import { useDonazioni } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

interface DonazioniSectionProps {
  associazioneId: string;
}

export const DonazioniSection = ({ associazioneId }: DonazioniSectionProps) => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    importo_fisso: '',
    importo_minimo: '5',
    importo_massimo: '',
  });
  const [isFixedAmount, setIsFixedAmount] = useState(false);

  const { data: paymentLinks, isLoading: linksLoading } = usePaymentLinks(associazioneId);
  const { data: donationStats } = useDonationStats(associazioneId);
  const { data: donazioni } = useDonazioni(associazioneId);
  const createPaymentLink = useCreatePaymentLink();
  const togglePaymentLink = useTogglePaymentLink();

  const donationLinks = paymentLinks?.filter(l => l.tipo === 'donazione') || [];

  const handleCreate = () => {
    createPaymentLink.mutate({
      associazione_id: associazioneId,
      tipo: 'donazione',
      titolo: formData.titolo,
      descrizione: formData.descrizione || undefined,
      importo_fisso: isFixedAmount && formData.importo_fisso ? parseFloat(formData.importo_fisso) : undefined,
      importo_minimo: !isFixedAmount && formData.importo_minimo ? parseFloat(formData.importo_minimo) : undefined,
      importo_massimo: !isFixedAmount && formData.importo_massimo ? parseFloat(formData.importo_massimo) : undefined,
    }, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setFormData({ titolo: '', descrizione: '', importo_fisso: '', importo_minimo: '5', importo_massimo: '' });
      },
    });
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copiato',
      description: 'Il link è stato copiato negli appunti.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Raccolto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-700">
                {formatCurrency(donationStats?.totale || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Donazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <span className="text-2xl font-bold">{donationStats?.count || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Link Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {donationLinks.filter(l => l.attivo).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Link Donazioni
            </CardTitle>
            <CardDescription>
              Crea link pubblici per raccogliere donazioni
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Link
          </Button>
        </CardHeader>
        <CardContent>
          {linksLoading ? (
            <div className="text-center py-4 text-muted-foreground">Caricamento...</div>
          ) : donationLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun link donazione creato</p>
              <p className="text-sm">Crea il tuo primo link per iniziare a raccogliere donazioni</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donationLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{link.titolo}</p>
                        {link.descrizione && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {link.descrizione}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {link.importo_fisso ? (
                        <Badge variant="outline">{formatCurrency(link.importo_fisso)}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Libero (min. {formatCurrency(link.importo_minimo || 1)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={link.attivo}
                        onCheckedChange={(checked) => 
                          togglePaymentLink.mutate({ id: link.id, attivo: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyLink(generateManuPayLink(link))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(generateManuPayLink(link), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Donations */}
      {donazioni && donazioni.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ultime Donazioni</CardTitle>
            <CardDescription>Le donazioni più recenti (dati aggregati)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Donatore</TableHead>
                  <TableHead>Importo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donazioni.slice(0, 10).map((donazione) => (
                  <TableRow key={donazione.id}>
                    <TableCell className="text-sm">
                      {new Date(donazione.created_at).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      {donazione.anonima ? (
                        <span className="text-muted-foreground italic">Anonimo</span>
                      ) : (
                        donazione.nome_donatore || donazione.email_donatore || '-'
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {formatCurrency(donazione.importo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Link Donazione</DialogTitle>
            <DialogDescription>
              Configura un nuovo link per raccogliere donazioni
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Titolo campagna *</Label>
              <Input
                placeholder="es. Sostieni le nostre attività"
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
              />
            </div>

            <div>
              <Label>Descrizione</Label>
              <Textarea
                placeholder="Descrivi lo scopo della donazione..."
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={isFixedAmount}
                onCheckedChange={setIsFixedAmount}
              />
              <Label>Importo fisso</Label>
            </div>

            {isFixedAmount ? (
              <div>
                <Label>Importo (€) *</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="10.00"
                  value={formData.importo_fisso}
                  onChange={(e) => setFormData({ ...formData, importo_fisso: e.target.value })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimo (€)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="5.00"
                    value={formData.importo_minimo}
                    onChange={(e) => setFormData({ ...formData, importo_minimo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Massimo (€)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Nessun limite"
                    value={formData.importo_massimo}
                    onChange={(e) => setFormData({ ...formData, importo_massimo: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!formData.titolo || createPaymentLink.isPending}
            >
              {createPaymentLink.isPending ? 'Creazione...' : 'Crea Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
