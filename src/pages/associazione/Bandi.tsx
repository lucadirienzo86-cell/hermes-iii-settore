import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ExternalLink, Calendar, Euro, Loader2 } from 'lucide-react';
import { useBandiTerzoSettore } from '@/hooks/useBandiTerzoSettore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const statoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  attivo:      { label: 'Aperto',      variant: 'default' },
  in_chiusura: { label: 'In chiusura', variant: 'secondary' },
  bozza:       { label: 'Bozza',       variant: 'outline' },
  concluso:    { label: 'Concluso',    variant: 'outline' },
};

const AssociazioneBandi = () => {
  const { data: bandi, isLoading, error } = useBandiTerzoSettore();

  const bandiVisibili = bandi?.filter(b => b.stato === 'attivo' || b.stato === 'in_chiusura') ?? [];

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
              <p className="text-sm text-muted-foreground">
                Opportunità di finanziamento per la tua associazione
                {!isLoading && ` — ${bandiVisibili.length} disponibili`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-destructive">
            <p>Errore nel caricamento dei bandi. Riprova.</p>
          </div>
        )}

        {!isLoading && bandiVisibili.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nessun bando attivo al momento</p>
            <p className="text-sm mt-1">Torna presto per nuove opportunità di finanziamento.</p>
          </div>
        )}

        <div className="grid gap-4">
          {bandiVisibili.map((bando) => {
            const cfg = statoConfig[bando.stato] ?? statoConfig.bozza;
            return (
              <Card key={bando.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{bando.titolo}</CardTitle>
                        {bando.ambito && (
                          <p className="text-sm text-muted-foreground">{bando.ambito}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-6 text-sm mb-4">
                    {bando.data_chiusura && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Scadenza:{' '}
                          {format(new Date(bando.data_chiusura), 'dd/MM/yyyy', { locale: it })}
                        </span>
                      </div>
                    )}
                    {bando.plafond_totale > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="h-4 w-4" />
                        <span>
                          Plafond: {bando.plafond_totale.toLocaleString('it-IT')} €
                          {bando.plafond_impegnato > 0 && (
                            <span className="ml-1 text-xs text-amber-600">
                              ({bando.plafond_impegnato.toLocaleString('it-IT')} € impegnati)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {(bando.numero_partecipanti ?? 0) > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {bando.numero_partecipanti} partecipanti
                      </span>
                    )}
                  </div>

                  {bando.descrizione && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {bando.descrizione}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <Link to={`/associazione/progetti?bando=${bando.id}`}>
                        Partecipa
                      </Link>
                    </Button>
                    {bando.link_documentazione && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={bando.link_documentazione} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Documentazione
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AssociazioneBandi;
