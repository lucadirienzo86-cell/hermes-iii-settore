import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Calendar, 
  Plus, 
  MapPin, 
  Ticket,
  Users,
  Euro,
  Pencil,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  useEventi, 
  useCreateEvento, 
  useUpdateEvento,
  useDeleteEvento 
} from '@/hooks/useEventi';
import { usePaymentLinks, useCreatePaymentLink, generateManuPayLink, formatCurrency } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

interface EventiSectionProps {
  associazioneId: string;
}

export const EventiSection = ({ associazioneId }: EventiSectionProps) => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    luogo: '',
    data_inizio: '',
    data_fine: '',
    prezzo_biglietto: '',
    posti_disponibili: '',
  });

  const { data: eventi, isLoading } = useEventi(associazioneId);
  const { data: paymentLinks } = usePaymentLinks(associazioneId);
  const createEvento = useCreateEvento();
  const updateEvento = useUpdateEvento();
  const deleteEvento = useDeleteEvento();
  const createPaymentLink = useCreatePaymentLink();

  const handleCreate = async () => {
    // Create the event
    createEvento.mutate({
      associazione_id: associazioneId,
      titolo: formData.titolo,
      descrizione: formData.descrizione || undefined,
      luogo: formData.luogo || undefined,
      data_inizio: new Date(formData.data_inizio).toISOString(),
      data_fine: formData.data_fine ? new Date(formData.data_fine).toISOString() : undefined,
      prezzo_biglietto: formData.prezzo_biglietto ? parseFloat(formData.prezzo_biglietto) : undefined,
      posti_disponibili: formData.posti_disponibili ? parseInt(formData.posti_disponibili) : undefined,
    }, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setFormData({
          titolo: '',
          descrizione: '',
          luogo: '',
          data_inizio: '',
          data_fine: '',
          prezzo_biglietto: '',
          posti_disponibili: '',
        });
      },
    });
  };

  const copyPaymentLink = (evento: any) => {
    const eventLink = paymentLinks?.find(l => l.id === evento.payment_link_id);
    if (eventLink) {
      navigator.clipboard.writeText(generateManuPayLink(eventLink));
      toast({
        title: 'Link copiato',
        description: 'Il link di pagamento è stato copiato.',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const upcomingEvents = eventi?.filter(e => new Date(e.data_inizio) >= new Date()) || [];
  const pastEvents = eventi?.filter(e => new Date(e.data_inizio) < new Date()) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Eventi e Biglietti</h3>
          <p className="text-sm text-muted-foreground">
            Gestisci i tuoi eventi e la vendita dei biglietti
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Evento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eventi Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{upcomingEvents.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Biglietti Venduti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">
                {eventi?.reduce((sum, e) => sum + (e.posti_venduti || 0), 0) || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incasso Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">
                {formatCurrency(
                  eventi?.reduce((sum, e) => sum + ((e.posti_venduti || 0) * (e.prezzo_biglietto || 0)), 0) || 0
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Prossimi Eventi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Caricamento...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun evento programmato</p>
              <p className="text-sm">Crea il tuo primo evento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((evento) => (
                <div 
                  key={evento.id} 
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold">{evento.titolo}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(evento.data_inizio)}
                      </span>
                      {evento.luogo && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {evento.luogo}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {evento.prezzo_biglietto !== null && (
                        <Badge variant="outline">
                          {evento.prezzo_biglietto > 0 
                            ? formatCurrency(evento.prezzo_biglietto)
                            : 'Gratuito'
                          }
                        </Badge>
                      )}
                      {evento.posti_disponibili && (
                        <span className="text-sm">
                          {evento.posti_venduti}/{evento.posti_disponibili} posti
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleEvento(evento)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteEvento.mutate(evento.id)}
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

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventi Passati</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Biglietti</TableHead>
                  <TableHead>Incasso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastEvents.slice(0, 10).map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="font-medium">{evento.titolo}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(evento.data_inizio).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>{evento.posti_venduti || 0}</TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {formatCurrency((evento.posti_venduti || 0) * (evento.prezzo_biglietto || 0))}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crea Nuovo Evento</DialogTitle>
            <DialogDescription>
              Configura un nuovo evento con vendita biglietti
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Titolo evento *</Label>
              <Input
                placeholder="es. Festa della Primavera"
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
              />
            </div>

            <div>
              <Label>Descrizione</Label>
              <Textarea
                placeholder="Descrivi l'evento..."
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Luogo</Label>
              <Input
                placeholder="es. Piazza del Comune"
                value={formData.luogo}
                onChange={(e) => setFormData({ ...formData, luogo: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data e ora inizio *</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_inizio}
                  onChange={(e) => setFormData({ ...formData, data_inizio: e.target.value })}
                />
              </div>
              <div>
                <Label>Data e ora fine</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_fine}
                  onChange={(e) => setFormData({ ...formData, data_fine: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prezzo biglietto (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0 = gratuito"
                  value={formData.prezzo_biglietto}
                  onChange={(e) => setFormData({ ...formData, prezzo_biglietto: e.target.value })}
                />
              </div>
              <div>
                <Label>Posti disponibili</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Illimitati"
                  value={formData.posti_disponibili}
                  onChange={(e) => setFormData({ ...formData, posti_disponibili: e.target.value })}
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
              disabled={!formData.titolo || !formData.data_inizio || createEvento.isPending}
            >
              {createEvento.isPending ? 'Creazione...' : 'Crea Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Placeholder function - would open edit dialog
const toggleEvento = (evento: any) => {
  console.log('Edit evento:', evento);
};
