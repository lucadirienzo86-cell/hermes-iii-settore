import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAssociazione, useProLocoInfo } from '@/hooks/useAssociazione';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  FileText, 
  Building2, 
  LogOut, 
  User,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  AlertTriangle,
  ClipboardList,
  Info,
  Heart,
  Calendar,
  Package,
  LayoutDashboard,
  Plus,
  Calculator
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DonazioniSection } from '@/components/associazione/DonazioniSection';
import { EventiSection } from '@/components/associazione/EventiSection';
import { ProdottiSection } from '@/components/associazione/ProdottiSection';

const AssociazioneDashboard = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { data: associazione, isLoading } = useAssociazione();
  const { data: proLoco } = useProLocoInfo(associazione?.pro_loco_id || null);
  const { toast } = useToast();
  
  const [showRichiestaDialog, setShowRichiestaDialog] = useState(false);
  const [richiestaNote, setRichiestaNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && associazione && !associazione.onboarding_completato) {
      navigate('/associazione/onboarding');
    }
  }, [associazione, isLoading, navigate]);

  const isAnagraficaCompleta = associazione?.campi_completi ?? false;
  const isIscrizioneAlbo = associazione?.iscrizione_albo_comunale ?? false;

  const getStatoRegistrazioneBadge = () => {
    const stato = associazione?.stato_registrazione;
    switch (stato) {
      case 'verificata':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Verificata
          </Badge>
        );
      case 'respinta':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" /> Respinta
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3 mr-1" /> In attesa di verifica
          </Badge>
        );
    }
  };

  const handleRichiestaIscrizione = async () => {
    if (!associazione) return;
    
    setIsSubmitting(true);
    try {
      // Create a communication record for the Albo registration request
      const { error } = await supabase
        .from('comunicazioni_istituzionali')
        .insert([{
          associazione_id: associazione.id,
          tipo: 'email' as const,
          oggetto: `Richiesta iscrizione Albo Comunale - ${associazione.denominazione}`,
          corpo: `L'associazione "${associazione.denominazione}" (CF: ${associazione.codice_fiscale || 'N/D'}) richiede l'iscrizione all'Albo Comunale delle Associazioni.\n\nNote aggiuntive:\n${richiestaNote || 'Nessuna nota aggiuntiva.'}`,
          stato: 'bozza' as const,
          template_tipo: 'richiesta_iscrizione_albo'
        }]);

      if (error) throw error;

      toast({
        title: 'Richiesta inviata',
        description: 'La tua richiesta di iscrizione all\'Albo Comunale è stata inoltrata al Comune.',
      });
      setShowRichiestaDialog(false);
      setRichiestaNote('');
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Si è verificato un errore durante l\'invio della richiesta.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{associazione?.denominazione || 'La mia Associazione'}</h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/associazione/profilo">
                <User className="h-4 w-4 mr-2" />
                Profilo
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Banner: Non iscritta all'Albo */}
        {!isIscrizioneAlbo && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Associazione non iscritta all'Albo Comunale</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-3">
                La tua associazione non risulta iscritta all'Albo Comunale delle Associazioni. 
                L'iscrizione ti permette di accedere a contributi, patrocini e convenzioni con il Comune.
              </p>
              <p className="mb-4 text-sm">
                Puoi comunque consultare i bandi disponibili e partecipare alle opportunità aperte a tutti gli enti del Terzo Settore.
              </p>
              <Button 
                onClick={() => setShowRichiestaDialog(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Richiedi iscrizione all'Albo
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Benvenuto nella tua area riservata</h2>
                <p className="text-muted-foreground">
                  Gestisci la tua associazione, raccogli donazioni e organizza eventi.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {getStatoRegistrazioneBadge()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="panoramica" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="panoramica" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Panoramica
            </TabsTrigger>
            <TabsTrigger value="donazioni" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Donazioni
            </TabsTrigger>
            <TabsTrigger value="eventi" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventi
            </TabsTrigger>
            <TabsTrigger value="prodotti" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Prodotti
            </TabsTrigger>
          </TabsList>

          {/* Panoramica Tab */}
          <TabsContent value="panoramica" className="space-y-6">
            {/* Status Cards - Clickable */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stato Anagrafica */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => navigate('/associazione/profilo')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Anagrafica</CardTitle>
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 hover:bg-emerald-700 text-white w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/associazione/profilo');
                      }}
                      title="Modifica Profilo"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAnagraficaCompleta ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-700">Completa</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold text-amber-700">Incompleta</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Clicca per gestire</p>
                </CardContent>
              </Card>

              {/* Stato Iscrizione Albo */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => !isIscrizioneAlbo && setShowRichiestaDialog(true)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Albo Comunale</CardTitle>
                </CardHeader>
                <CardContent>
                  {isIscrizioneAlbo ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-emerald-700">Iscritta</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <span className="font-semibold text-amber-700">Non iscritta</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Clicca per richiedere</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tipologia */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tipologia</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">{associazione?.tipologia || '-'}</p>
                </CardContent>
              </Card>

              {/* Stato RUNTS */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stato RUNTS</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={associazione?.stato_runts === 'verificato' ? 'default' : 'secondary'}>
                    {associazione?.stato_runts === 'verificato' ? 'Verificato' : 
                     associazione?.stato_runts === 'non_iscritto' ? 'Non iscritto' : 'Dichiarato'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Affiliazione */}
            {(proLoco || associazione?.comune) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Affiliazione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proLoco ? (
                    <div>
                      <p className="font-semibold">{proLoco.denominazione}</p>
                      <p className="text-sm text-muted-foreground">Pro Loco di riferimento</p>
                    </div>
                  ) : associazione?.comune ? (
                    <div>
                      <p className="font-semibold">{associazione.comune}</p>
                      <p className="text-sm text-muted-foreground">Comune di riferimento</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <h3 className="text-lg font-semibold">Azioni rapide</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Contabilità ETS - NEW */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/30 bg-primary/5">
                <Link to="/associazione/contabilita">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <Calculator className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Contabilità ETS
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>Gestione entrate, uscite e rendiconti ministeriali</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              {/* Trova Bandi - Link to Sonic */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to="/bandi-associazione">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <Search className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Trova Bandi
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>Esplora i bandi disponibili per la tua associazione</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              {/* Profilo */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to="/associazione/profilo">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Profilo Associazione</CardTitle>
                        <CardDescription>Gestisci i dati dell'associazione</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              {/* Richiedi Iscrizione (only if not registered) */}
              {!isIscrizioneAlbo && (
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-amber-300 bg-amber-50/50"
                  onClick={() => setShowRichiestaDialog(true)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <ClipboardList className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Richiedi Iscrizione Albo</CardTitle>
                        <CardDescription>Invia pratica al Comune per l'iscrizione</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}
            </div>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Accesso ai bandi</h4>
                    <p className="text-sm text-muted-foreground">
                      L'accesso alla consultazione dei bandi pubblici non è vincolato al pagamento di quote associative. 
                      Puoi esplorare liberamente tutte le opportunità disponibili, indipendentemente dallo stato di iscrizione all'Albo Comunale.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donazioni Tab */}
          <TabsContent value="donazioni">
            {associazione && <DonazioniSection associazioneId={associazione.id} />}
          </TabsContent>

          {/* Eventi Tab */}
          <TabsContent value="eventi">
            {associazione && <EventiSection associazioneId={associazione.id} />}
          </TabsContent>

          {/* Prodotti Tab */}
          <TabsContent value="prodotti">
            {associazione && <ProdottiSection associazioneId={associazione.id} />}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog: Richiesta Iscrizione Albo */}
      <Dialog open={showRichiestaDialog} onOpenChange={setShowRichiestaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Richiedi Iscrizione all'Albo Comunale</DialogTitle>
            <DialogDescription>
              La tua richiesta verrà inoltrata al Comune per la valutazione. 
              Assicurati che l'anagrafica dell'associazione sia completa e aggiornata.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p><strong>Associazione:</strong> {associazione?.denominazione}</p>
              <p><strong>Codice Fiscale:</strong> {associazione?.codice_fiscale || 'Non specificato'}</p>
              <p><strong>Tipologia:</strong> {associazione?.tipologia}</p>
            </div>

            {!isAnagraficaCompleta && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  L'anagrafica dell'associazione non è completa. Ti consigliamo di completarla prima di inviare la richiesta.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Note aggiuntive (opzionale)</label>
              <Textarea
                placeholder="Inserisci eventuali note o informazioni aggiuntive per il Comune..."
                value={richiestaNote}
                onChange={(e) => setRichiestaNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRichiestaDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleRichiestaIscrizione} disabled={isSubmitting}>
              {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssociazioneDashboard;