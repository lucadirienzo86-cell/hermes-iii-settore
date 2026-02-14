import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ExternalLink, Calendar, Euro } from 'lucide-react';

const AssociazioneBandi = () => {
  // Mock data - will be replaced with real data
  const bandi = [
    {
      id: '1',
      titolo: 'Bando Cultura 2025',
      ente: 'Regione Lazio',
      scadenza: '2025-03-15',
      importo: '10.000 - 50.000',
      stato: 'aperto'
    },
    {
      id: '2',
      titolo: 'Contributi Sport Dilettantistico',
      ente: 'Comune di Cassino',
      scadenza: '2025-02-28',
      importo: '5.000 - 20.000',
      stato: 'aperto'
    },
    {
      id: '3',
      titolo: 'Fondo Sociale Europeo - Inclusione',
      ente: 'Ministero del Lavoro',
      scadenza: '2025-04-30',
      importo: '25.000 - 100.000',
      stato: 'in_apertura'
    }
  ];

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
              <h1 className="text-xl font-bold">Bandi Attivi</h1>
              <p className="text-sm text-muted-foreground">Opportunità di finanziamento per la tua associazione</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4">
          {bandi.map((bando) => (
            <Card key={bando.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bando.titolo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{bando.ente}</p>
                    </div>
                  </div>
                  <Badge variant={bando.stato === 'aperto' ? 'default' : 'secondary'}>
                    {bando.stato === 'aperto' ? 'Aperto' : 'In apertura'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Scadenza: {new Date(bando.scadenza).toLocaleDateString('it-IT')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Euro className="h-4 w-4" />
                    <span>€ {bando.importo}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">
                    Candidati
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Dettagli
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AssociazioneBandi;
