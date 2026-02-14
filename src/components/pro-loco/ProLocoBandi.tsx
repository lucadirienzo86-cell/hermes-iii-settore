import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Bando {
  id: string;
  titolo: string;
  descrizione: string;
  ente: string;
  livello: string;
  data_apertura: string;
  data_chiusura: string;
  link_bando: string;
}

const ProLocoBandi = () => {
  const [bandi, setBandi] = useState<Bando[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBandi();
  }, []);

  const loadBandi = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bandi')
        .select('id, titolo, descrizione, ente, livello, data_apertura, data_chiusura, link_bando')
        .eq('attivo', true)
        .or(`data_chiusura.gte.${today},data_chiusura.is.null`)
        .order('data_chiusura', { ascending: true })
        .limit(10);

      if (error) throw error;
      setBandi(data || []);
    } catch (error) {
      console.error('Errore caricamento bandi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatoBando = (dataChiusura: string | null) => {
    if (!dataChiusura) return { label: 'Sempre Aperto', variant: 'default' as const };
    
    const oggi = new Date();
    const chiusura = new Date(dataChiusura);
    const giorniRimanenti = differenceInDays(chiusura, oggi);

    if (giorniRimanenti < 0) return { label: 'Chiuso', variant: 'secondary' as const };
    if (giorniRimanenti <= 7) return { label: `Scade in ${giorniRimanenti}g`, variant: 'destructive' as const };
    if (giorniRimanenti <= 30) return { label: `${giorniRimanenti} giorni`, variant: 'outline' as const };
    return { label: 'Aperto', variant: 'default' as const };
  };

  const getLivelloBadge = (livello: string) => {
    const colors: Record<string, string> = {
      'UE': 'bg-blue-500',
      'NAZIONALE': 'bg-green-500',
      'REGIONALE': 'bg-amber-500',
      'COMUNALE': 'bg-purple-500',
      'CAMERALE': 'bg-cyan-500',
    };
    return colors[livello?.toUpperCase()] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bandi Disponibili
          </CardTitle>
          <CardDescription>
            Bandi pubblici attivi per il territorio
          </CardDescription>
        </div>
        <Button variant="outline" onClick={() => navigate('/trova-bandi')}>
          Vedi Tutti
        </Button>
      </CardHeader>
      <CardContent>
        {bandi.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun bando disponibile</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bandi.map((bando) => {
              const stato = getStatoBando(bando.data_chiusura);
              return (
                <div
                  key={bando.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getLivelloBadge(bando.livello)}>
                          {bando.livello}
                        </Badge>
                        <Badge variant={stato.variant}>{stato.label}</Badge>
                      </div>
                      <h3 className="font-semibold">{bando.titolo}</h3>
                      {bando.ente && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {bando.ente}
                        </p>
                      )}
                      {bando.descrizione && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {bando.descrizione}
                        </p>
                      )}
                      {bando.data_chiusura && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                          <Calendar className="h-3 w-3" />
                          Scadenza: {format(new Date(bando.data_chiusura), 'dd MMMM yyyy', { locale: it })}
                        </p>
                      )}
                    </div>
                    {bando.link_bando && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={bando.link_bando} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Dettagli
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProLocoBandi;
