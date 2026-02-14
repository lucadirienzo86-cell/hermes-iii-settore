import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, Plus, Download, Mail, CheckCircle, 
  Clock, AlertCircle, MoreVertical,
  Phone, MapPin, FileText, Eye, XCircle, FileQuestion
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAssociazioniTerzoSettore, useCreateAssociazioneTS } from '@/hooks/useAssociazioniTerzoSettore';
import { useToast } from '@/hooks/use-toast';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';
import { GestioneAlboDialog } from '@/components/comune/GestioneAlboDialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const statoAlboConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  precaricata: { label: 'Precaricata', color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-3 h-3" /> },
  attiva: { label: 'Iscritta all\'Albo', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  non_iscritta: { label: 'Non Iscritta', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle className="w-3 h-3" /> },
  invitata: { label: 'Invitata', color: 'bg-blue-100 text-blue-700', icon: <Mail className="w-3 h-3" /> },
  in_revisione: { label: 'In Revisione', color: 'bg-purple-100 text-purple-700', icon: <FileText className="w-3 h-3" /> },
};

const tipologiaConfig: Record<string, string> = {
  APS: 'Associazione di Promozione Sociale',
  ETS: 'Ente del Terzo Settore',
  ODV: 'Organizzazione di Volontariato',
  Cooperativa: 'Cooperativa Sociale',
  Altro: 'Altro',
};

interface AssociazioneForAction {
  id: string;
  denominazione: string;
  email: string | null;
  stato_albo?: string;
}

const AnagrafeAssociazioni = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: associazioni, isLoading } = useAssociazioniTerzoSettore();
  const createAssociazione = useCreateAssociazioneTS();

  const initialFilter = searchParams.get('filter') || 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState<string>(initialFilter);
  const [filterTipologia, setFilterTipologia] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  
  // State for action dialogs
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAssociazione, setSelectedAssociazione] = useState<AssociazioneForAction | null>(null);
  const [selectedAction, setSelectedAction] = useState<'approva' | 'rifiuta' | 'integrazioni' | null>(null);
  
  const [newAssociazione, setNewAssociazione] = useState({
    denominazione: '',
    codice_fiscale: '',
    tipologia: 'Altro' as const,
    email: '',
    telefono: '',
    indirizzo: '',
    descrizione: '',
  });

  const filteredAssociazioni = associazioni?.filter((a) => {
    const matchesSearch = 
      a.denominazione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.codice_fiscale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Handle special filter for incomplete
    if (filterStato === 'incomplete') {
      return matchesSearch && (a as any).campi_completi === false;
    }
    
    const matchesStato = filterStato === 'all' || (a as any).stato_albo === filterStato;
    const matchesTipologia = filterTipologia === 'all' || a.tipologia === filterTipologia;
    
    return matchesSearch && matchesStato && matchesTipologia;
  }) || [];

  const stats = {
    totale: associazioni?.length || 0,
    attive: associazioni?.filter((a) => (a as any).stato_albo === 'attiva').length || 0,
    precaricate: associazioni?.filter((a) => (a as any).stato_albo === 'precaricata').length || 0,
    nonIscritte: associazioni?.filter((a) => (a as any).stato_albo === 'non_iscritta').length || 0,
    incomplete: associazioni?.filter((a) => (a as any).campi_completi === false).length || 0,
    invitate: associazioni?.filter((a) => (a as any).stato_albo === 'invitata').length || 0,
    inRevisione: associazioni?.filter((a) => (a as any).stato_albo === 'in_revisione').length || 0,
  };

  const handleCreateAssociazione = async () => {
    if (!newAssociazione.denominazione || !newAssociazione.codice_fiscale) {
      toast({
        title: 'Errore',
        description: 'Denominazione e Codice Fiscale sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    await createAssociazione.mutateAsync({
      ...newAssociazione,
      stato_runts: 'dichiarato',
    } as any);

    setShowNewDialog(false);
    setNewAssociazione({
      denominazione: '',
      codice_fiscale: '',
      tipologia: 'Altro',
      email: '',
      telefono: '',
      indirizzo: '',
      descrizione: '',
    });
  };

  const handleAction = (associazione: AssociazioneForAction, action: 'approva' | 'rifiuta' | 'integrazioni') => {
    setSelectedAssociazione(associazione);
    setSelectedAction(action);
    setActionDialogOpen(true);
  };

  const handleInviaInvito = async (associazioneId: string) => {
    // TODO: Implementare invio email
    toast({
      title: 'Invito inviato',
      description: 'L\'email di invito è stata inviata con successo',
    });
  };

  const getStatoInfo = (statoAlbo: string | undefined) => {
    return statoAlboConfig[statoAlbo || 'precaricata'] || statoAlboConfig.precaricata;
  };
  
  const formatDataRichiesta = (data: string | null | undefined) => {
    if (!data) return '-';
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: it });
    } catch {
      return '-';
    }
  };

  return (
    <IstituzionaleLayout breadcrumbs={[{ label: 'Anagrafe Associazioni' }]}>

      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatsCard 
            label="Totale" 
            value={stats.totale} 
            onClick={() => setFilterStato('all')}
            active={filterStato === 'all'}
          />
          <StatsCard 
            label="Iscritte Albo" 
            value={stats.attive} 
            color="success"
            onClick={() => setFilterStato('attiva')}
            active={filterStato === 'attiva'}
          />
          <StatsCard 
            label="In Revisione" 
            value={stats.inRevisione} 
            color="info"
            onClick={() => setFilterStato('in_revisione')}
            active={filterStato === 'in_revisione'}
          />
          <StatsCard 
            label="Precaricate" 
            value={stats.precaricate} 
            onClick={() => setFilterStato('precaricata')}
            active={filterStato === 'precaricata'}
          />
          <StatsCard 
            label="Non Iscritte" 
            value={stats.nonIscritte} 
            color="warning"
            onClick={() => setFilterStato('non_iscritta')}
            active={filterStato === 'non_iscritta'}
          />
          <StatsCard 
            label="Incomplete" 
            value={stats.incomplete} 
            color="danger"
            onClick={() => setFilterStato('incomplete')}
            active={filterStato === 'incomplete'}
          />
          <StatsCard 
            label="Invitate" 
            value={stats.invitate} 
            onClick={() => setFilterStato('invitata')}
            active={filterStato === 'invitata'}
          />
        </div>

        {/* Title + Filters + Actions */}
        <Card className="ist-card">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold">Anagrafe Associazioni</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per denominazione, CF, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStato} onValueChange={setFilterStato}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtra per Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="incomplete">Solo Incompleti</SelectItem>
                    {Object.entries(statoAlboConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterTipologia} onValueChange={setFilterTipologia}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filtra per Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    {Object.keys(tipologiaConfig).map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Esporta
                </Button>
                <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuova Associazione
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nuova Associazione</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Denominazione *</Label>
                        <Input
                          value={newAssociazione.denominazione}
                          onChange={(e) => setNewAssociazione(prev => ({ ...prev, denominazione: e.target.value }))}
                          placeholder="Nome dell'associazione"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Codice Fiscale *</Label>
                          <Input
                            value={newAssociazione.codice_fiscale}
                            onChange={(e) => setNewAssociazione(prev => ({ ...prev, codice_fiscale: e.target.value }))}
                            placeholder="00000000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipologia</Label>
                          <Select 
                            value={newAssociazione.tipologia}
                            onValueChange={(v) => setNewAssociazione(prev => ({ ...prev, tipologia: v as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(tipologiaConfig).map((key) => (
                                <SelectItem key={key} value={key}>{key}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newAssociazione.email}
                            onChange={(e) => setNewAssociazione(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="email@esempio.it"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefono</Label>
                          <Input
                            value={newAssociazione.telefono}
                            onChange={(e) => setNewAssociazione(prev => ({ ...prev, telefono: e.target.value }))}
                            placeholder="+39 000 0000000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Indirizzo</Label>
                        <Input
                          value={newAssociazione.indirizzo}
                          onChange={(e) => setNewAssociazione(prev => ({ ...prev, indirizzo: e.target.value }))}
                          placeholder="Via, numero civico, CAP, Città"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrizione attività</Label>
                        <Textarea
                          value={newAssociazione.descrizione}
                          onChange={(e) => setNewAssociazione(prev => ({ ...prev, descrizione: e.target.value }))}
                          placeholder="Breve descrizione delle attività dell'associazione..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                        Annulla
                      </Button>
                      <Button onClick={handleCreateAssociazione} disabled={createAssociazione.isPending}>
                        {createAssociazione.isPending ? 'Creazione...' : 'Crea Associazione'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="ist-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Caricamento...</div>
            ) : filteredAssociazioni.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nessuna associazione trovata
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Denominazione</TableHead>
                    <TableHead>Stato Anagrafica</TableHead>
                    <TableHead>Stato Iscrizione Albo</TableHead>
                    <TableHead>Data Richiesta</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssociazioni.map((associazione) => {
                    const statoInfo = getStatoInfo((associazione as any).stato_albo);
                    const campiCompleti = (associazione as any).campi_completi;
                    const dataRichiesta = (associazione as any).data_invito || (associazione as any).created_at;
                    const statoAlbo = (associazione as any).stato_albo || 'precaricata';
                    const canApprove = statoAlbo === 'precaricata' || statoAlbo === 'in_revisione' || statoAlbo === 'invitata';
                    const canReject = statoAlbo !== 'attiva' && statoAlbo !== 'non_iscritta';
                    const canRequestDocs = statoAlbo !== 'attiva';
                    
                    return (
                      <TableRow key={associazione.id}>
                        <TableCell>
                          <div className="font-medium">{associazione.denominazione}</div>
                          {associazione.email && (
                            <div className="text-sm text-muted-foreground">{associazione.email}</div>
                          )}
                          {associazione.comune && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {associazione.comune}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {campiCompleti ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completa
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Incompleta
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${statoInfo.color} border-0`}
                          >
                            {statoInfo.icon}
                            <span className="ml-1">{statoInfo.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDataRichiesta(dataRichiesta)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => navigate(`/associazione/${associazione.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizza Dettaglio
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/associazione/${associazione.id}`)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Documenti
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {canApprove && (
                                <DropdownMenuItem 
                                  onClick={() => handleAction({
                                    id: associazione.id,
                                    denominazione: associazione.denominazione,
                                    email: associazione.email,
                                    stato_albo: statoAlbo
                                  }, 'approva')}
                                  className="text-emerald-600 focus:text-emerald-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approva Iscrizione
                                </DropdownMenuItem>
                              )}
                              
                              {canRequestDocs && (
                                <DropdownMenuItem 
                                  onClick={() => handleAction({
                                    id: associazione.id,
                                    denominazione: associazione.denominazione,
                                    email: associazione.email,
                                    stato_albo: statoAlbo
                                  }, 'integrazioni')}
                                  className="text-amber-600 focus:text-amber-600"
                                >
                                  <FileQuestion className="w-4 h-4 mr-2" />
                                  Richiedi Integrazioni
                                </DropdownMenuItem>
                              )}
                              
                              {canReject && (
                                <DropdownMenuItem 
                                  onClick={() => handleAction({
                                    id: associazione.id,
                                    denominazione: associazione.denominazione,
                                    email: associazione.email,
                                    stato_albo: statoAlbo
                                  }, 'rifiuta')}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rifiuta Iscrizione
                                </DropdownMenuItem>
                              )}
                              
                              {!campiCompleti && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleInviaInvito(associazione.id)}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Invia Sollecito
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Action Dialog */}
      <GestioneAlboDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        associazione={selectedAssociazione}
        action={selectedAction}
      />
    </IstituzionaleLayout>
  );
};

// Stats Card Component
interface StatsCardProps {
  label: string;
  value: number;
  color?: 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  active?: boolean;
}

const StatsCard = ({ label, value, color, onClick, active }: StatsCardProps) => {
  const colorClasses = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
    info: 'text-info',
  };

  return (
    <Card 
      className={`ist-card cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color ? colorClasses[color] : 'text-ist-primary'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
};

export default AnagrafeAssociazioni;
