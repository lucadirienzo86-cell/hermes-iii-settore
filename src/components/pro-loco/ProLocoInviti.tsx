import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Plus, Mail, Trash2, RefreshCw, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ProLocoInvitiProps {
  proLocoId: string;
  onUpdate: () => void;
}

interface Invito {
  id: string;
  email_destinatario: string;
  denominazione_associazione: string | null;
  token: string;
  stato: string;
  data_invio: string;
  data_risposta: string | null;
}

const ProLocoInviti = ({ proLocoId, onUpdate }: ProLocoInvitiProps) => {
  const [inviti, setInviti] = useState<Invito[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    denominazione: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadInviti();
  }, [proLocoId]);

  const loadInviti = async () => {
    try {
      const { data, error } = await supabase
        .from('pro_loco_inviti')
        .select('*')
        .eq('pro_loco_id', proLocoId)
        .order('data_invio', { ascending: false });

      if (error) throw error;
      setInviti(data || []);
    } catch (error) {
      console.error('Errore caricamento inviti:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvito = async () => {
    if (!formData.email) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Inserisci un indirizzo email valido.",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('pro_loco_inviti')
        .insert({
          pro_loco_id: proLocoId,
          email_destinatario: formData.email,
          denominazione_associazione: formData.denominazione || null,
        });

      if (error) throw error;

      toast({
        title: "Invito inviato",
        description: `L'invito è stato inviato a ${formData.email}.`,
      });

      setFormData({ email: '', denominazione: '' });
      setDialogOpen(false);
      loadInviti();
      onUpdate();
    } catch (error) {
      console.error('Errore invio invito:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile inviare l'invito.",
      });
    } finally {
      setSending(false);
    }
  };

  const resendInvito = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pro_loco_inviti')
        .update({ 
          stato: 'inviato',
          data_invio: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Invito reinviato",
        description: "L'invito è stato reinviato con successo.",
      });

      loadInviti();
    } catch (error) {
      console.error('Errore reinvio invito:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile reinviare l'invito.",
      });
    }
  };

  const deleteInvito = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pro_loco_inviti')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Invito eliminato",
        description: "L'invito è stato eliminato.",
      });

      loadInviti();
      onUpdate();
    } catch (error) {
      console.error('Errore eliminazione invito:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile eliminare l'invito.",
      });
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/registrazione-associazione?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiato",
      description: "Il link di invito è stato copiato negli appunti.",
    });
  };

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case 'inviato':
        return <Badge variant="outline">In Attesa</Badge>;
      case 'accettato':
        return <Badge variant="default">Accettato</Badge>;
      case 'rifiutato':
        return <Badge variant="destructive">Rifiutato</Badge>;
      case 'scaduto':
        return <Badge variant="secondary">Scaduto</Badge>;
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Inviti Associazioni
          </CardTitle>
          <CardDescription>
            Invita associazioni a collegarsi alla tua Pro Loco
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Invito
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invita un'Associazione</DialogTitle>
              <DialogDescription>
                Invia un invito a un'associazione per collegarla alla tua Pro Loco.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Associazione *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@associazione.it"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="denominazione">Denominazione (opzionale)</Label>
                <Input
                  id="denominazione"
                  placeholder="Nome associazione"
                  value={formData.denominazione}
                  onChange={(e) => setFormData({ ...formData, denominazione: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={sendInvito} disabled={sending}>
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Invio...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Invia Invito
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {inviti.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun invito inviato</p>
            <p className="text-sm">Clicca "Nuovo Invito" per iniziare</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Denominazione</TableHead>
                <TableHead>Data Invio</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-[120px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviti.map((invito) => (
                <TableRow key={invito.id}>
                  <TableCell className="font-medium">{invito.email_destinatario}</TableCell>
                  <TableCell>{invito.denominazione_associazione || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(invito.data_invio), 'dd MMM yyyy HH:mm', { locale: it })}
                  </TableCell>
                  <TableCell>{getStatoBadge(invito.stato)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(invito.token)}
                        title="Copia link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {invito.stato === 'inviato' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => resendInvito(invito.id)}
                          title="Reinvia"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInvito(invito.id)}
                        title="Elimina"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
  );
};

export default ProLocoInviti;
