import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  Info, 
  Lock,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAssociazione } from '@/hooks/useAssociazione';
import { 
  useEserciziContabili, 
  useRendicontoModD,
  useCategorieContabili
} from '@/hooks/useContabilita';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

export default function RendicontoCassa() {
  const { data: associazione } = useAssociazione();
  const { data: esercizi } = useEserciziContabili(associazione?.id);
  const [esercizioSelezionato, setEsercizioSelezionato] = useState<string | null>(null);

  const esercizioAttivo = esercizioSelezionato || esercizi?.find(e => e.stato === 'aperto')?.id;
  const esercizioCorrente = esercizi?.find(e => e.id === esercizioAttivo);
  
  const { data: rendiconto, isLoading } = useRendicontoModD(esercizioAttivo);
  const { data: categorie } = useCategorieContabili('mod_d');

  // Raggruppa voci per sezione
  const vociEntrate = rendiconto?.voci.filter(v => v.sezione === 'ENTRATE') || [];
  const vociUscite = rendiconto?.voci.filter(v => v.sezione === 'USCITE') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/associazione/contabilita">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Mod. D - Rendiconto per Cassa
          </h1>
          <p className="text-muted-foreground">
            Conforme al DM 5 marzo 2020 - Per ETS con entrate {"<"} €220.000
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
                  Esercizio {es.anno}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Schema ministeriale obbligatorio</AlertTitle>
        <AlertDescription className="text-blue-700">
          Le voci in <strong>grassetto</strong> sono obbligatorie e non modificabili secondo il DM 5 marzo 2020.
          Le sottovoci possono essere aggregate o suddivise. Le voci con importo nullo per due esercizi consecutivi possono essere eliminate.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* ENTRATE */}
          <Card>
            <CardHeader className="bg-emerald-50 border-b">
              <CardTitle className="text-emerald-800">ENTRATE</CardTitle>
              <CardDescription className="text-emerald-700">
                Esercizio {esercizioCorrente?.anno || new Date().getFullYear()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Codice</TableHead>
                    <TableHead>Voce</TableHead>
                    <TableHead className="text-right w-40">Anno corrente</TableHead>
                    <TableHead className="text-right w-40">Anno precedente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vociEntrate.map((voce) => (
                    <TableRow 
                      key={voce.codice}
                      className={voce.voce_principale ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="font-mono text-sm">{voce.codice}</TableCell>
                      <TableCell className={voce.voce_principale ? 'font-semibold' : 'pl-8'}>
                        {voce.voce_principale ? (
                          <div className="flex items-center gap-2">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            {voce.nome}
                          </div>
                        ) : voce.nome}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {voce.importo_corrente > 0 ? formatCurrency(voce.importo_corrente) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {voce.importo_precedente > 0 ? formatCurrency(voce.importo_precedente) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-emerald-100 font-bold">
                    <TableCell></TableCell>
                    <TableCell>TOTALE ENTRATE</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(rendiconto?.totaleEntrate || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* USCITE */}
          <Card>
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="text-red-800">USCITE</CardTitle>
              <CardDescription className="text-red-700">
                Esercizio {esercizioCorrente?.anno || new Date().getFullYear()}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Codice</TableHead>
                    <TableHead>Voce</TableHead>
                    <TableHead className="text-right w-40">Anno corrente</TableHead>
                    <TableHead className="text-right w-40">Anno precedente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vociUscite.map((voce) => (
                    <TableRow 
                      key={voce.codice}
                      className={voce.voce_principale ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="font-mono text-sm">{voce.codice}</TableCell>
                      <TableCell className={voce.voce_principale ? 'font-semibold' : 'pl-8'}>
                        {voce.voce_principale ? (
                          <div className="flex items-center gap-2">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            {voce.nome}
                          </div>
                        ) : voce.nome}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {voce.importo_corrente > 0 ? formatCurrency(voce.importo_corrente) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {voce.importo_precedente > 0 ? formatCurrency(voce.importo_precedente) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-red-100 font-bold">
                    <TableCell></TableCell>
                    <TableCell>TOTALE USCITE</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(rendiconto?.totaleUscite || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* RIEPILOGO */}
          <Card className="border-2">
            <CardHeader className="bg-primary/5">
              <CardTitle>AVANZO / DISAVANZO DI CASSA</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Differenza tra entrate e uscite dell'esercizio</p>
                </div>
                <div className={`text-3xl font-bold ${(rendiconto?.avanzoDisavanzo || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(rendiconto?.avanzoDisavanzo || 0)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Esporta Rendiconto</CardTitle>
              <CardDescription>
                Scarica il rendiconto nel formato richiesto per il deposito o la consegna al commercialista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Esporta Excel
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Esporta PDF
                </Button>
                <Button className="ml-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Genera Rendiconto Definitivo
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
