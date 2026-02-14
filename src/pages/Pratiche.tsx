import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { usePratiche, STATI_PRATICHE } from '@/hooks/usePratiche';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatoPraticaBadge, getStatoLabel } from '@/components/StatoPraticaBadge';
import { ModificaStatoPraticaDialog } from '@/components/ModificaStatoPraticaDialog';
import { NuovaPraticaDialog } from '@/components/NuovaPraticaDialog';
import { AssegnaGestorePraticaDialog } from '@/components/AssegnaGestorePraticaDialog';
import { DocumentiPraticaDialog } from '@/components/DocumentiPraticaDialog';
import { Search, Plus, FileText, Building2, User, Calendar, MessageSquare, AlertCircle, CheckCircle2, UserX, UserCheck, UserPlus, FileUp } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Pratica } from '@/hooks/usePratiche';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Pratiche = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { pratiche, loading, aggiornaStato, loadPratiche, prendiInCarico } = usePratiche();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStato, setFiltroStato] = useState<string>('tutti');
  const [filtroAccount, setFiltroAccount] = useState<string>('tutti');
  const [filtroMiePratiche, setFiltroMiePratiche] = useState<boolean>(false);
  const [selectedPratica, setSelectedPratica] = useState<Pratica | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nuovaPraticaOpen, setNuovaPraticaOpen] = useState(false);
  const [assegnaDialogOpen, setAssegnaDialogOpen] = useState(false);
  const [praticaToAssign, setPraticaToAssign] = useState<Pratica | null>(null);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [praticaForDocs, setPraticaForDocs] = useState<Pratica | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [gestorePraticheId, setGestorePraticheId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';
  const isGestorePratiche = profile?.role === 'gestore_pratiche';
  const isGestore = profile?.role === 'gestore';
  const isDocente = profile?.role === 'docente';
  const isAzienda = profile?.role === 'azienda';

  // Solo admin e gestore_pratiche possono modificare lo stato
  const canModifyStato = isAdmin || isGestorePratiche;
  // Admin, gestore, docente possono creare pratiche
  const canCreatePratica = isAdmin || isGestore || isDocente;

  // Carica ID del gestore pratiche corrente
  useEffect(() => {
    const loadGestorePraticheId = async () => {
      if (!profile?.id || !isGestorePratiche) return;
      
      const { data } = await supabase
        .from('gestori_pratiche')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      
      if (data) {
        setGestorePraticheId(data.id);
      }
    };

    loadGestorePraticheId();
  }, [profile?.id, isGestorePratiche]);

  // Carica conteggio messaggi non letti
  useEffect(() => {
    if (pratiche.length === 0) return;

    const loadUnreadCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const pratica of pratiche) {
        const { count } = await supabase
          .from('pratiche_messaggi')
          .select('*', { count: 'exact', head: true })
          .eq('pratica_id', pratica.id)
          .eq('sender_type', 'azienda')
          .eq('letto', false);
        
        if (count) {
          counts[pratica.id] = count;
        }
      }
      
      setUnreadCounts(counts);
    };

    loadUnreadCounts();

    const channel = supabase
      .channel('pratiche-messaggi-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pratiche_messaggi'
        },
        () => {
          loadUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pratiche]);

  // Filtra pratiche
  let praticheFiltered = pratiche.filter(p => {
    const matchSearch = !searchTerm || 
      p.aziende?.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bandi?.titolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.gestori_pratiche && `${p.gestori_pratiche.nome} ${p.gestori_pratiche.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStato = filtroStato === 'tutti' || p.stato === filtroStato;
    const matchAccount = filtroAccount === 'tutti' || 
                        (filtroAccount === 'con_account' && p.aziende?.profile_id) ||
                        (filtroAccount === 'senza_account' && !p.aziende?.profile_id);
    
    // Filtro "mie pratiche" per gestore_pratiche
    const matchMiePratiche = !filtroMiePratiche || 
                            (isGestorePratiche && gestorePraticheId && p.gestore_pratiche_id === gestorePraticheId);

    return matchSearch && matchStato && matchAccount && matchMiePratiche;
  });

  const handleRowClick = (pratica: Pratica) => {
    navigate(`/pratiche/${pratica.id}`);
  };

  const handleSave = async (praticaId: string, nuovoStato: string, note?: string) => {
    return await aggiornaStato(praticaId, nuovoStato, note);
  };

  const handlePrendiInCarico = async (praticaId: string) => {
    if (!gestorePraticheId) {
      toast.error('Errore: ID gestore pratiche non trovato');
      return;
    }
    await prendiInCarico(praticaId, gestorePraticheId);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Conteggi per le stat cards
  const praticheRichiesta = pratiche.filter(p => p.stato === 'richiesta').length;
  const praticheInCorso = pratiche.filter(p => 
    ['presa_in_carico', 'documenti_mancanti', 'in_corso', 'in_erogazione'].includes(p.stato || '')
  ).length;
  const pratichePositive = pratiche.filter(p => 
    ['accettata', 'erogata'].includes(p.stato || '')
  ).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <PageHeader
          title="Pratiche"
          description="Gestione delle richieste di partecipazione ai bandi"
          icon={<FileText className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { label: 'Pratiche', icon: 'pratiche' }
          ]}
          actions={
            canCreatePratica && (
              <Button onClick={() => setNuovaPraticaOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuova Pratica
              </Button>
            )
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Pratiche Totali"
            value={pratiche.length}
            subtitle={`${praticheRichiesta} da assegnare`}
            icon={FileText}
            colorVariant="primary"
            animationDelay={0}
          />
          <StatCard
            title="In Corso"
            value={praticheInCorso}
            subtitle="In lavorazione"
            icon={AlertCircle}
            colorVariant="primary"
            animationDelay={1}
          />
          <StatCard
            title="Completate"
            value={pratichePositive}
            subtitle="Con esito positivo"
            icon={CheckCircle2}
            colorVariant="green"
            animationDelay={2}
          />
          <StatCard
            title="Messaggi Non Letti"
            value={Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
            subtitle="Da gestire"
            icon={MessageSquare}
            colorVariant="blue"
            animationDelay={3}
          />
        </div>

        {/* Filtri */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per azienda, bando o gestore..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroStato} onValueChange={setFiltroStato}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti gli stati</SelectItem>
                  {STATI_PRATICHE.map((stato) => (
                    <SelectItem key={stato} value={stato}>
                      {getStatoLabel(stato)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroAccount} onValueChange={setFiltroAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutte le aziende</SelectItem>
                  <SelectItem value="con_account">Con account</SelectItem>
                  <SelectItem value="senza_account">Senza account</SelectItem>
                </SelectContent>
              </Select>
              {isGestorePratiche && (
                <Button
                  variant={filtroMiePratiche ? "default" : "outline"}
                  onClick={() => setFiltroMiePratiche(!filtroMiePratiche)}
                  className="w-full"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {filtroMiePratiche ? 'Le mie pratiche' : 'Tutte le pratiche'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabella Pratiche */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pratiche Trovate ({praticheFiltered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {praticheFiltered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filtroStato !== 'tutti' 
                  ? 'Nessuna pratica trovata con i criteri selezionati' 
                  : 'Nessuna pratica disponibile'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Azienda</TableHead>
                      <TableHead>Stato Pratica</TableHead>
                      <TableHead>Nome Bando</TableHead>
                      <TableHead>Gestore Pratiche</TableHead>
                      <TableHead>Data Ultimo Aggiornamento</TableHead>
                      <TableHead className="text-center">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {praticheFiltered.map((pratica) => (
                      <TableRow 
                        key={pratica.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell 
                          onClick={() => handleRowClick(pratica)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        {pratica.aziende?.profile_id ? (
                                          <CheckCircle2 className="w-4 h-4 text-success" />
                                        ) : (
                                          <UserX className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {pratica.aziende?.profile_id 
                                        ? "Azienda con account attivo" 
                                        : "Azienda senza account - i messaggi non saranno visibili"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <span className="font-medium">{pratica.aziende?.ragione_sociale}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pratica.aziende?.partita_iva}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatoPraticaBadge 
                            stato={pratica.stato} 
                            clickable={canModifyStato}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canModifyStato) {
                                console.log('[Pratiche] Opening dialog with:', {
                                  gestorePraticheId,
                                  praticaGestoreId: pratica.gestore_pratiche_id,
                                  isGestorePratiche
                                });
                                setSelectedPratica(pratica);
                                setDialogOpen(true);
                              } else {
                                handleRowClick(pratica);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell 
                          onClick={() => handleRowClick(pratica)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>{pratica.bandi?.titolo || 'Nessun bando'}</div>
                          </div>
                        </TableCell>
                        <TableCell 
                          onClick={() => handleRowClick(pratica)}
                          className="cursor-pointer"
                        >
                          {pratica.gestori_pratiche ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {pratica.gestori_pratiche.nome} {pratica.gestori_pratiche.cognome}
                                </div>
                                <div className="text-xs text-muted-foreground">Gestore Pratiche</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non assegnato</span>
                          )}
                        </TableCell>
                        <TableCell 
                          onClick={() => handleRowClick(pratica)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(pratica.updated_at), 'd MMM yyyy, HH:mm', { locale: it })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            {/* Pulsante "Prendi in carico" per gestore_pratiche su pratiche richiesta */}
                            {isGestorePratiche && pratica.stato === 'richiesta' && !pratica.gestore_pratiche_id && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrendiInCarico(pratica.id);
                                }}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Prendi in carico
                              </Button>
                            )}
                            {/* Pulsante "Assegna" per gestori/docenti su pratiche non assegnate */}
                            {(isGestore || isDocente) && !pratica.gestore_pratiche_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPraticaToAssign(pratica);
                                  setAssegnaDialogOpen(true);
                                }}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Assegna
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPraticaForDocs(pratica);
                                setDocsDialogOpen(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <FileUp className="w-4 h-4" />
                              Doc
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/pratiche/${pratica.id}/chat`);
                              }}
                              className="relative flex items-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Chat
                              {unreadCounts[pratica.id] > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                >
                                  {unreadCounts[pratica.id]}
                                </Badge>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog Modifica Stato - solo per admin e gestore_pratiche */}
      <ModificaStatoPraticaDialog
        pratica={selectedPratica}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        canModifyStato={canModifyStato}
        isGestorePratiche={isGestorePratiche}
        gestorePraticheId={gestorePraticheId}
      />

      {/* Dialog Nuova Pratica */}
      {canCreatePratica && (
        <NuovaPraticaDialog
          open={nuovaPraticaOpen}
          onOpenChange={setNuovaPraticaOpen}
          onSuccess={loadPratiche}
        />
      )}

      {/* Dialog Assegna Gestore Pratiche - per gestori e docenti */}
      {(isGestore || isDocente) && (
        <AssegnaGestorePraticaDialog
          praticaId={praticaToAssign?.id || null}
          praticaTitolo={praticaToAssign?.aziende?.ragione_sociale}
          open={assegnaDialogOpen}
          onOpenChange={(open) => {
            setAssegnaDialogOpen(open);
            if (!open) setPraticaToAssign(null);
          }}
          onAssigned={loadPratiche}
        />
      )}

      {/* Dialog Documenti Pratica */}
      <DocumentiPraticaDialog
        praticaId={praticaForDocs?.id || null}
        praticaTitolo={praticaForDocs?.aziende?.ragione_sociale}
        open={docsDialogOpen}
        onOpenChange={(open) => {
          setDocsDialogOpen(open);
          if (!open) setPraticaForDocs(null);
        }}
      />
    </div>
  );
};

export default Pratiche;
