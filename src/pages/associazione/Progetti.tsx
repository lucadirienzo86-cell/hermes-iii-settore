import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FolderKanban, FileSpreadsheet, ChevronRight } from 'lucide-react';

const AssociazioneProgetti = () => {
  // Mock data - will be replaced with real data
  const progetti = [
    {
      id: '1',
      titolo: 'Festival della Cultura Locale 2025',
      cig: 'Z123456789',
      cup: 'J12B25000010001',
      stato: 'attivo',
      bando: 'Bando Cultura 2025',
      importoFinanziato: 25000,
      importoSpeso: 8500,
      percentualeAvanzamento: 34
    },
    {
      id: '2',
      titolo: 'Corso di Formazione Volontari',
      cig: 'Z987654321',
      cup: null,
      stato: 'rendicontazione',
      bando: 'Contributi Formazione',
      importoFinanziato: 15000,
      importoSpeso: 14200,
      percentualeAvanzamento: 95
    }
  ];

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case 'attivo':
        return <Badge className="bg-emerald-100 text-emerald-800">Attivo</Badge>;
      case 'rendicontazione':
        return <Badge className="bg-amber-100 text-amber-800">In rendicontazione</Badge>;
      case 'chiuso':
        return <Badge variant="secondary">Chiuso</Badge>;
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
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
              <h1 className="text-xl font-bold">Progetti / CIG / CUP</h1>
              <p className="text-sm text-muted-foreground">Gestisci i tuoi progetti finanziati</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4">
          {progetti.map((progetto) => (
            <Card key={progetto.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{progetto.titolo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{progetto.bando}</p>
                    </div>
                  </div>
                  {getStatoBadge(progetto.stato)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">CIG</p>
                    <p className="font-mono font-medium">{progetto.cig}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CUP</p>
                    <p className="font-mono font-medium">{progetto.cup || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Finanziato</p>
                    <p className="font-medium">€ {progetto.importoFinanziato.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Speso</p>
                    <p className="font-medium">€ {progetto.importoSpeso.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Avanzamento</span>
                    <span className="font-medium">{progetto.percentualeAvanzamento}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progetto.percentualeAvanzamento}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <Link to={`/associazione/progetti/${progetto.id}/rendiconto`}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Rendiconto
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/associazione/progetti/${progetto.id}`}>
                      Dettagli
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {progetti.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun progetto attivo</h3>
              <p className="text-muted-foreground mb-4">
                Inizia candidandoti a un bando per creare il tuo primo progetto.
              </p>
              <Button asChild>
                <Link to="/associazione/bandi">Esplora i bandi</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AssociazioneProgetti;
