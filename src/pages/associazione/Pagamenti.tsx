import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, CheckCircle, Plus, History } from 'lucide-react';

const AssociazionePagamenti = () => {
  // Mock data
  const abbonamenti = [
    {
      id: '1',
      progetto: 'Festival della Cultura Locale 2025',
      cig: 'Z123456789',
      piano: 'Professional',
      stato: 'attivo',
      prossimoPagamento: '2025-03-01',
      importoMensile: 29
    }
  ];

  const metodoPagamento = {
    tipo: 'card',
    ultimeQuattroCifre: '4242',
    scadenza: '12/26'
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/associazione/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Pagamenti e Abbonamenti</h1>
              <p className="text-sm text-muted-foreground">Gestisci i tuoi abbonamenti per CIG/CUP</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Metodo di pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Metodo di pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metodoPagamento ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• {metodoPagamento.ultimeQuattroCifre}</p>
                    <p className="text-sm text-muted-foreground">Scade: {metodoPagamento.scadenza}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Modifica
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Nessun metodo di pagamento configurato</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi carta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Abbonamenti attivi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Abbonamenti attivi</CardTitle>
            <CardDescription>
              Abbonamenti per la gestione dei tuoi progetti CIG/CUP
            </CardDescription>
          </CardHeader>
          <CardContent>
            {abbonamenti.length > 0 ? (
              <div className="space-y-4">
                {abbonamenti.map((abb) => (
                  <div 
                    key={abb.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{abb.progetto}</p>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Attivo
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        CIG: {abb.cig} • Piano: {abb.piano}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prossimo pagamento: {new Date(abb.prossimoPagamento).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">€{abb.importoMensile}</p>
                      <p className="text-sm text-muted-foreground">/mese</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nessun abbonamento attivo</h3>
                <p className="text-muted-foreground mb-4">
                  Attiva un abbonamento per gestire i tuoi progetti CIG/CUP
                </p>
                <Button asChild>
                  <Link to="/associazione/progetti">Vai ai progetti</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storico pagamenti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Storico pagamenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Lo storico dei pagamenti sarà disponibile dopo il primo addebito.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AssociazionePagamenti;
