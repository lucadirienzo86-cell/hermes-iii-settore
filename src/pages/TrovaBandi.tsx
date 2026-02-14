import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { LIVELLO_LABELS, FONTE_LABELS } from '@/lib/api/bandiApi';

type StatoBando = 'tutti' | 'aperto' | 'in_scadenza' | 'chiuso';
type LivelloFilter = 'tutti' | 'UE' | 'NAZ' | 'REG' | 'COM';

const TrovaBandi = () => {
  const { profile } = useAuth();
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [livelloFilter, setLivelloFilter] = useState<LivelloFilter>('tutti');
  const [statoFilter, setStatoFilter] = useState<StatoBando>('tutti');
  const [settoreFilter, setSettoreFilter] = useState('tutti');

  // Fetch bandi
  const { data: bandi, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['trova-bandi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bandi')
        .select('*')
        .order('data_chiusura', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Get unique settori for filter
  const settori = useMemo(() => {
    const allSettori = new Set<string>();
    bandi?.forEach(b => {
      b.settore_ateco?.forEach((s: string) => {
        if (s) allSettori.add(s.split('.')[0]); // First level ATECO
      });
    });
    return Array.from(allSettori).sort();
  }, [bandi]);

  // Filter bandi
  const filteredBandi = useMemo(() => {
    if (!bandi) return [];

    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return bandi.filter(bando => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = bando.titolo?.toLowerCase().includes(query);
        const matchesEnte = bando.ente?.toLowerCase().includes(query);
        const matchesDesc = bando.descrizione?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesEnte && !matchesDesc) return false;
      }

      // Livello filter
      if (livelloFilter !== 'tutti' && bando.livello !== livelloFilter) return false;

      // Stato filter
      if (statoFilter !== 'tutti') {
        const deadline = bando.data_chiusura ? new Date(bando.data_chiusura) : null;
        if (statoFilter === 'aperto' && (!bando.attivo || (deadline && isPast(deadline)))) return false;
        if (statoFilter === 'chiuso' && (!deadline || !isPast(deadline))) return false;
        if (statoFilter === 'in_scadenza') {
          if (!deadline || isPast(deadline)) return false;
          if (differenceInDays(deadline, today) > 7) return false;
        }
      }

      // Settore filter
      if (settoreFilter !== 'tutti') {
        const hasSettore = bando.settore_ateco?.some((s: string) => 
          s.startsWith(settoreFilter)
        );
        if (!hasSettore) return false;
      }

      return true;
    });
  }, [bandi, searchQuery, livelloFilter, statoFilter, settoreFilter]);

  const getStatusBadge = (bando: { attivo: boolean; data_chiusura: string | null }) => {
    if (!bando.data_chiusura) {
      return bando.attivo 
        ? <Badge className="bg-green-100 text-green-700">Sempre Aperto</Badge>
        : <Badge variant="secondary">Non Attivo</Badge>;
    }
    
    const deadline = new Date(bando.data_chiusura);
    const daysLeft = differenceInDays(deadline, new Date());

    if (isPast(deadline)) {
      return <Badge variant="destructive">Chiuso</Badge>;
    }
    if (daysLeft <= 7) {
      return <Badge className="bg-warning text-warning-foreground">Scade in {daysLeft}gg</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-700">In scadenza</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Aperto</Badge>;
  };

  const getLivelloBadge = (livello: string | null) => {
    const colors: Record<string, string> = {
      UE: 'bg-blue-100 text-blue-700',
      NAZ: 'bg-purple-100 text-purple-700',
      REG: 'bg-orange-100 text-orange-700',
      COM: 'bg-teal-100 text-teal-700',
    };
    return (
      <Badge className={colors[livello || ''] || 'bg-muted text-muted-foreground'}>
        {LIVELLO_LABELS[livello || ''] || livello || 'N/D'}
      </Badge>
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setLivelloFilter('tutti');
    setStatoFilter('tutti');
    setSettoreFilter('tutti');
  };

  return (
    <IstituzionaleLayout breadcrumbs={[{ label: 'Trova Bandi' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trova Bandi</h1>
            <p className="text-muted-foreground text-sm">
              Consulta i bandi pubblici disponibili sul territorio
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>

        {/* Filters */}
        <Card className="ist-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per titolo, ente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Livello */}
              <Select value={livelloFilter} onValueChange={(v) => setLivelloFilter(v as LivelloFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Livello" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti i livelli</SelectItem>
                  <SelectItem value="UE">🇪🇺 Unione Europea</SelectItem>
                  <SelectItem value="NAZ">🇮🇹 Nazionale</SelectItem>
                  <SelectItem value="REG">📍 Regionale</SelectItem>
                  <SelectItem value="COM">🏛️ Comunale</SelectItem>
                </SelectContent>
              </Select>

              {/* Stato */}
              <Select value={statoFilter} onValueChange={(v) => setStatoFilter(v as StatoBando)}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti gli stati</SelectItem>
                  <SelectItem value="aperto">✅ Aperti</SelectItem>
                  <SelectItem value="in_scadenza">⚠️ In scadenza (7gg)</SelectItem>
                  <SelectItem value="chiuso">❌ Chiusi</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset */}
              <Button variant="ghost" onClick={resetFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Reset filtri
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredBandi.length} bandi trovati
          </p>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredBandi.length > 0 ? (
          <div className="space-y-4">
            {filteredBandi.map((bando) => (
              <Card key={bando.id} className="ist-card hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {getLivelloBadge(bando.livello)}
                        {getStatusBadge(bando)}
                        {bando.tipo_agevolazione && (
                          <Badge variant="outline">{bando.tipo_agevolazione}</Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {bando.titolo}
                      </h3>

                      {/* Description */}
                      {bando.descrizione && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {bando.descrizione}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {bando.ente && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {bando.ente}
                          </span>
                        )}
                        {bando.data_chiusura && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Scadenza: {format(new Date(bando.data_chiusura), 'dd MMMM yyyy', { locale: it })}
                          </span>
                        )}
                        {(bando.importo_minimo || bando.importo_massimo) && (
                          <span className="flex items-center gap-1">
                            💰 {bando.importo_minimo?.toLocaleString('it-IT')}€ - {bando.importo_massimo?.toLocaleString('it-IT')}€
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:items-end">
                      {bando.link_bando && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(bando.link_bando, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apri Bando
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Dettaglio
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="ist-card">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">Nessun bando trovato</h3>
              <p className="text-sm text-muted-foreground">
                Prova a modificare i filtri di ricerca
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </IstituzionaleLayout>
  );
};

export default TrovaBandi;
