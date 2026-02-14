import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  Plus, 
  Euro,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Users
} from 'lucide-react';
import { 
  useQuoteByProLoco, 
  useQuoteStats, 
  useCreateQuota,
  useBulkCreateQuote,
  useUpdateQuotaStatus 
} from '@/hooks/useQuoteAssociative';
import { formatCurrency } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface QuoteGestioneProps {
  proLocoId: string;
  quotaAnnuale: number;
}

export const QuoteGestione = ({ proLocoId, quotaAnnuale }: QuoteGestioneProps) => {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedAssociazione, setSelectedAssociazione] = useState('');
  const [importo, setImporto] = useState(quotaAnnuale.toString());
  const [anno, setAnno] = useState(new Date().getFullYear().toString());

  const { data: quote, isLoading } = useQuoteByProLoco(proLocoId);
  const { data: stats } = useQuoteStats(proLocoId);
  const createQuota = useCreateQuota();
  const bulkCreateQuote = useBulkCreateQuote();
  const updateQuotaStatus = useUpdateQuotaStatus();

  // Fetch associations affiliated with this Pro Loco
  const { data: associazioni } = useQuery({
    queryKey: ['pro-loco-associazioni', proLocoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .select('id, denominazione, email')
        .eq('pro_loco_id', proLocoId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!proLocoId,
  });

  const handleCreate = () => {
    if (!selectedAssociazione) return;
    
    createQuota.mutate({
      pro_loco_id: proLocoId,
      associazione_id: selectedAssociazione,
      anno: parseInt(anno),
      importo: parseFloat(importo),
    }, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setSelectedAssociazione('');
        setImporto(quotaAnnuale.toString());
      },
    });
  };

  const handleBulkCreate = () => {
    if (!associazioni || associazioni.length === 0) return;
    
    const annoInt = parseInt(anno);
    const importoFloat = parseFloat(importo);
    
    // Create quotes for all associations that don't have one for this year
    const existingAssociazioniIds = quote
      ?.filter(q => q.anno === annoInt)
      .map(q => q.associazione_id) || [];
    
    const newQuotes = associazioni
      .filter(a => !existingAssociazioniIds.includes(a.id))
      .map(a => ({
        pro_loco_id: proLocoId,
        associazione_id: a.id,
        anno: annoInt,
        importo: importoFloat,
      }));
    
    if (newQuotes.length === 0) {
      toast({
        title: 'Nessuna nuova quota',
        description: 'Tutte le associazioni hanno già una quota per questo anno.',
      });
      return;
    }
    
    bulkCreateQuote.mutate(newQuotes, {
      onSuccess: () => {
        setShowBulkDialog(false);
      },
    });
  };

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case 'success':
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pagata
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/10 text-destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Fallita
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3 mr-1" />
            In attesa
          </Badge>
        );
    }
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quote {stats?.anno}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats?.totale || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600">{stats?.pagate || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Attesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">{stats?.attese || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incassato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats?.incassato || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Quota
        </Button>
        <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
          <Send className="h-4 w-4 mr-2" />
          Genera Quote {currentYear}
        </Button>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Quote Associative
          </CardTitle>
          <CardDescription>Gestione delle quote annuali delle associazioni affiliate</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Caricamento...</div>
          ) : !quote || quote.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessuna quota registrata</p>
              <p className="text-sm">Genera le quote per le tue associazioni affiliate</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associazione</TableHead>
                  <TableHead>Anno</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{q.associazione?.denominazione}</p>
                        <p className="text-sm text-muted-foreground">{q.associazione?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{q.anno}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(q.importo)}</TableCell>
                    <TableCell>{getStatusBadge(q.stato)}</TableCell>
                    <TableCell className="text-right">
                      {q.stato === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuotaStatus.mutate({ id: q.id, stato: 'success' })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Segna Pagata
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Single Quote Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Quota Associativa</DialogTitle>
            <DialogDescription>
              Aggiungi una quota per un'associazione affiliata
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Associazione *</Label>
              <Select value={selectedAssociazione} onValueChange={setSelectedAssociazione}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un'associazione" />
                </SelectTrigger>
                <SelectContent>
                  {associazioni?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.denominazione}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anno</Label>
                <Select value={anno} onValueChange={setAnno}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Importo (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
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
              disabled={!selectedAssociazione || createQuota.isPending}
            >
              {createQuota.isPending ? 'Creazione...' : 'Crea Quota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Genera Quote {currentYear}</DialogTitle>
            <DialogDescription>
              Crea automaticamente le quote per tutte le associazioni affiliate che non hanno ancora una quota per l'anno selezionato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Associazioni affiliate:</strong> {associazioni?.length || 0}
              </p>
              <p className="text-sm">
                <strong>Quote già create per {anno}:</strong>{' '}
                {quote?.filter(q => q.anno === parseInt(anno)).length || 0}
              </p>
              <p className="text-sm font-semibold mt-2">
                Nuove quote da creare:{' '}
                {(associazioni?.length || 0) - (quote?.filter(q => q.anno === parseInt(anno)).length || 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anno</Label>
                <Select value={anno} onValueChange={setAnno}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Importo per quota (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleBulkCreate}
              disabled={bulkCreateQuote.isPending}
            >
              {bulkCreateQuote.isPending ? 'Generazione...' : 'Genera Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
