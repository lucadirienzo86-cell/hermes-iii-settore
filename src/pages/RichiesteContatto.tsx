import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Mail, 
  Phone, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Trash2,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRichiesteContatto, RichiestaContatto } from '@/hooks/useRichiesteContatto';

const statoColors: Record<string, string> = {
  'in_attesa': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'contattato': 'bg-blue-100 text-blue-800 border-blue-200',
  'completato': 'bg-green-100 text-green-800 border-green-200',
  'rifiutato': 'bg-red-100 text-red-800 border-red-200',
};

const statoLabels: Record<string, string> = {
  'in_attesa': 'In Attesa',
  'contattato': 'Contattato',
  'completato': 'Completato',
  'rifiutato': 'Rifiutato',
};

const ruoloLabels: Record<string, string> = {
  'docente': 'Docente',
  'gestore': 'Professionista',
};

const RichiesteContatto = () => {
  const { richieste, isLoading, updateStato, deleteRichiesta, isUpdating, isDeleting } = useRichiesteContatto();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState<string>('all');
  const [filterRuolo, setFilterRuolo] = useState<string>('all');
  const [selectedRichiesta, setSelectedRichiesta] = useState<RichiestaContatto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredRichieste = useMemo(() => {
    return richieste.filter(r => {
      const matchSearch = 
        r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.telefono.includes(searchTerm);
      
      const matchStato = filterStato === 'all' || r.stato === filterStato;
      const matchRuolo = filterRuolo === 'all' || r.ruolo_richiesto === filterRuolo;
      
      return matchSearch && matchStato && matchRuolo;
    });
  }, [richieste, searchTerm, filterStato, filterRuolo]);

  const stats = useMemo(() => ({
    totali: richieste.length,
    inAttesa: richieste.filter(r => r.stato === 'in_attesa').length,
    contattati: richieste.filter(r => r.stato === 'contattato').length,
    completati: richieste.filter(r => r.stato === 'completato').length,
  }), [richieste]);

  const handleUpdateStato = (id: string, stato: string) => {
    updateStato({ id, stato });
    setSelectedRichiesta(null);
  };

  const handleDelete = (id: string) => {
    deleteRichiesta(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Richieste di Contatto</h1>
            <p className="text-muted-foreground mt-1">
              Gestisci le richieste di registrazione da docenti, gestori e collaboratori
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Totali</p>
                    <p className="text-2xl font-bold">{stats.totali}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Attesa</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inAttesa}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contattati</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.contattati}</p>
                  </div>
                  <Phone className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completati</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completati}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per nome, email, telefono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStato} onValueChange={setFilterStato}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="in_attesa">In Attesa</SelectItem>
                    <SelectItem value="contattato">Contattato</SelectItem>
                    <SelectItem value="completato">Completato</SelectItem>
                    <SelectItem value="rifiutato">Rifiutato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRuolo} onValueChange={setFilterRuolo}>
                  <SelectTrigger className="w-[180px]">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i ruoli</SelectItem>
                    <SelectItem value="docente">Docente</SelectItem>
                    <SelectItem value="gestore">Professionista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredRichieste.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessuna richiesta trovata</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contatti</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRichieste.map((richiesta) => (
                      <TableRow key={richiesta.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{richiesta.nome} {richiesta.cognome}</div>
                          {richiesta.messaggio && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {richiesta.messaggio}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${richiesta.email}`} className="hover:underline">
                                {richiesta.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${richiesta.telefono}`} className="hover:underline">
                                {richiesta.telefono}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ruoloLabels[richiesta.ruolo_richiesto] || richiesta.ruolo_richiesto}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(richiesta.created_at), 'dd MMM yyyy', { locale: it })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(richiesta.created_at), 'HH:mm', { locale: it })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statoColors[richiesta.stato] || 'bg-gray-100'}>
                            {statoLabels[richiesta.stato] || richiesta.stato}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRichiesta(richiesta)}
                            >
                              Gestisci
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteConfirmId(richiesta.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRichiesta} onOpenChange={() => setSelectedRichiesta(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettaglio Richiesta</DialogTitle>
            <DialogDescription>
              Gestisci la richiesta di {selectedRichiesta?.nome} {selectedRichiesta?.cognome}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRichiesta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedRichiesta.nome} {selectedRichiesta.cognome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ruolo Richiesto</p>
                  <Badge variant="outline">
                    {ruoloLabels[selectedRichiesta.ruolo_richiesto] || selectedRichiesta.ruolo_richiesto}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${selectedRichiesta.email}`} className="font-medium hover:underline flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selectedRichiesta.email}
                </a>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Telefono</p>
                <a href={`tel:${selectedRichiesta.telefono}`} className="font-medium hover:underline flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {selectedRichiesta.telefono}
                </a>
              </div>
              
              {selectedRichiesta.messaggio && (
                <div>
                  <p className="text-sm text-muted-foreground">Messaggio</p>
                  <p className="bg-muted p-3 rounded-lg text-sm mt-1">{selectedRichiesta.messaggio}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Data Richiesta</p>
                <p className="font-medium">
                  {format(new Date(selectedRichiesta.created_at), 'dd MMMM yyyy, HH:mm', { locale: it })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Cambia Stato</p>
                <div className="flex flex-wrap gap-2">
                  {['in_attesa', 'contattato', 'completato', 'rifiutato'].map(stato => (
                    <Button
                      key={stato}
                      variant={selectedRichiesta.stato === stato ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdateStato(selectedRichiesta.id, stato)}
                      disabled={isUpdating}
                    >
                      {statoLabels[stato]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa richiesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La richiesta verrà eliminata permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RichiesteContatto;