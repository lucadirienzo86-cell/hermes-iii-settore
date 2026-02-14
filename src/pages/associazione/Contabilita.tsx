import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  FileText, 
  FolderOpen, 
  CreditCard,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';
import { useAssociazione } from '@/hooks/useAssociazione';
import { 
  useEserciziContabili, 
  useStatisticheCassa, 
  useProgettiContabili,
  useCreateEsercizio 
} from '@/hooks/useContabilita';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { NuovoMovimentoDialog } from '@/components/contabilita/NuovoMovimentoDialog';
import { NuovoEsercizioDialog } from '@/components/contabilita/NuovoEsercizioDialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

export default function ContabilitaAssociazione() {
  const { data: associazione } = useAssociazione();
  const { data: esercizi, isLoading: loadingEsercizi } = useEserciziContabili(associazione?.id);
  const { data: progetti } = useProgettiContabili(associazione?.id);
  
  const [esercizioSelezionato, setEsercizioSelezionato] = useState<string | null>(null);
  const [showNuovoMovimento, setShowNuovoMovimento] = useState(false);
  const [showNuovoEsercizio, setShowNuovoEsercizio] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<'entrata' | 'uscita'>('entrata');

  // Seleziona automaticamente l'esercizio aperto più recente
  const esercizioAttivo = esercizioSelezionato || esercizi?.find(e => e.stato === 'aperto')?.id;
  const { data: statistiche } = useStatisticheCassa(esercizioAttivo);

  const handleNuovoMovimento = (tipo: 'entrata' | 'uscita') => {
    setTipoMovimento(tipo);
    setShowNuovoMovimento(true);
  };

  if (loadingEsercizi) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contabilità ETS</h1>
          <p className="text-muted-foreground">
            Gestione semplificata conforme al D.Lgs. 117/2017
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {esercizi && esercizi.length > 0 && (
            <select
              value={esercizioAttivo || ''}
              onChange={(e) => setEsercizioSelezionato(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              {esercizi.map((es) => (
                <option key={es.id} value={es.id}>
                  Esercizio {es.anno} {es.stato === 'aperto' ? '(attivo)' : `(${es.stato})`}
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowNuovoEsercizio(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuovo Esercizio
          </Button>
        </div>
      </div>

      {/* No Esercizio Warning */}
      {(!esercizi || esercizi.length === 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Calendar className="h-8 w-8 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Nessun esercizio contabile</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Per iniziare a registrare movimenti, crea il tuo primo esercizio contabile.
                </p>
                <Button 
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                  onClick={() => setShowNuovoEsercizio(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Esercizio {new Date().getFullYear()}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {esercizioAttivo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-200 bg-emerald-50/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleNuovoMovimento('entrata')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-700">Entrate</CardTitle>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-100">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(statistiche?.entrate || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleNuovoMovimento('uscita')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-red-700">Uscite</CardTitle>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-100">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold text-red-700">
                  {formatCurrency(statistiche?.uscite || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${(statistiche?.saldo || 0) >= 0 ? 'border-blue-200 bg-blue-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Cassa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className={`h-5 w-5 ${(statistiche?.saldo || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                <span className={`text-2xl font-bold ${(statistiche?.saldo || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(statistiche?.saldo || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {esercizioAttivo && (
        <Tabs defaultValue="operazioni" className="space-y-4">
          <TabsList className="bg-card border">
            <TabsTrigger value="operazioni" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Operazioni
            </TabsTrigger>
            <TabsTrigger value="rendiconti" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Rendiconti ETS
            </TabsTrigger>
            <TabsTrigger value="progetti" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Progetti / Bandi
            </TabsTrigger>
            <TabsTrigger value="documenti" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documenti
            </TabsTrigger>
          </TabsList>

          {/* Operazioni Tab */}
          <TabsContent value="operazioni" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-200"
                    onClick={() => handleNuovoMovimento('entrata')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>Registra Entrata</CardTitle>
                      <CardDescription>Quote, donazioni, contributi, vendite...</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer border-red-200"
                    onClick={() => handleNuovoMovimento('uscita')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <ArrowDownCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle>Registra Uscita</CardTitle>
                      <CardDescription>Acquisti, servizi, affitti, personale...</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ultimi Movimenti</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/associazione/movimenti">Vedi tutti</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nessun movimento registrato. Inizia registrando un'entrata o un'uscita.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rendiconti Tab */}
          <TabsContent value="rendiconti" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/associazione/rendiconto-cassa">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileSpreadsheet className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>Mod. D - Rendiconto per Cassa</CardTitle>
                          <Badge variant="secondary">Consigliato</Badge>
                        </div>
                        <CardDescription>
                          Per ETS con entrate {"<"} €220.000/anno (o {"<"} €300.000 target)
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/associazione/stato-patrimoniale">
                <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle>Mod. A - Stato Patrimoniale</CardTitle>
                        <CardDescription>
                          Obbligatorio per ETS con entrate {">"} €220.000/anno
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/associazione/rendiconto-gestionale">
                <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle>Mod. B - Rendiconto Gestionale</CardTitle>
                        <CardDescription>
                          Obbligatorio per ETS con entrate {">"} €220.000/anno
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/associazione/relazione-missione">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle>Mod. C - Relazione di Missione</CardTitle>
                        <CardDescription>
                          Documento narrativo sulle attività dell'anno
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>

          {/* Progetti Tab */}
          <TabsContent value="progetti" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Progetti e Bandi</h3>
                <p className="text-sm text-muted-foreground">
                  Associa movimenti a CIG/CUP per rendicontazione separata
                </p>
              </div>
              <Button asChild>
                <Link to="/associazione/progetti-contabili">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Progetto
                </Link>
              </Button>
            </div>

            {progetti && progetti.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {progetti.map((progetto) => (
                  <Card key={progetto.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{progetto.titolo}</CardTitle>
                          {progetto.ente_finanziatore && (
                            <CardDescription>{progetto.ente_finanziatore}</CardDescription>
                          )}
                        </div>
                        <Badge variant={progetto.stato === 'attivo' ? 'default' : 'secondary'}>
                          {progetto.stato}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 text-sm">
                        {progetto.cig && (
                          <div>
                            <span className="text-muted-foreground">CIG:</span>{' '}
                            <span className="font-mono">{progetto.cig}</span>
                          </div>
                        )}
                        {progetto.cup && (
                          <div>
                            <span className="text-muted-foreground">CUP:</span>{' '}
                            <span className="font-mono">{progetto.cup}</span>
                          </div>
                        )}
                      </div>
                      {progetto.importo_finanziato && (
                        <div className="mt-2">
                          <span className="text-muted-foreground text-sm">Importo:</span>{' '}
                          <span className="font-semibold">{formatCurrency(progetto.importo_finanziato)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Nessun progetto attivo. Crea un progetto per associare movimenti a bandi specifici.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documenti Tab */}
          <TabsContent value="documenti" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documenti e Giustificativi</CardTitle>
                <CardDescription>
                  Tutti i documenti allegati ai movimenti contabili
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  I documenti verranno mostrati qui quando alleghi giustificativi ai movimenti.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      {showNuovoMovimento && associazione && esercizioAttivo && (
        <NuovoMovimentoDialog
          open={showNuovoMovimento}
          onOpenChange={setShowNuovoMovimento}
          associazioneId={associazione.id}
          esercizioId={esercizioAttivo}
          tipoDefault={tipoMovimento}
        />
      )}

      {showNuovoEsercizio && associazione && (
        <NuovoEsercizioDialog
          open={showNuovoEsercizio}
          onOpenChange={setShowNuovoEsercizio}
          associazioneId={associazione.id}
        />
      )}
    </div>
  );
}
