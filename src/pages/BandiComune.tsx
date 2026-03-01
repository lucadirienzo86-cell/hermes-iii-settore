import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IstituzionaleLayout } from '@/layouts/IstituzionaleLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Filter, Calendar, Building2, ExternalLink,
  FileText, RefreshCw, Globe, Flag, MapPin, Landmark
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

type LivelloFilter = 'tutti' | 'UE' | 'NAZ' | 'REG' | 'PROV';

const LIVELLO_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  UE:   { label: 'Europeo',     icon: <Globe className="w-3 h-3" />,    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  NAZ:  { label: 'Nazionale',   icon: <Flag className="w-3 h-3" />,     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  REG:  { label: 'Regionale',   icon: <MapPin className="w-3 h-3" />,   color: 'bg-orange-100 text-orange-700 border-orange-200' },
  PROV: { label: 'Provinciale', icon: <Landmark className="w-3 h-3" />, color: 'bg-teal-100 text-teal-700 border-teal-200' },
  COM:  { label: 'Comunale',    icon: <Building2 className="w-3 h-3" />,color: 'bg-green-100 text-green-700 border-green-200' },
};

const BandiComune = () => {
  const [searchQuery, setSearchQuery]     = useState('');
  const [livelloFilter, setLivelloFilter] = useState<LivelloFilter>('tutti');
  const [statoFilter, setStatoFilter]     = useState<'tutti' | 'aperto' | 'chiuso'>('aperto');

  const { data: bandi, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bandi-comune'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bandi')
        .select('id, nome_bando, testo_bando, data_inizio, data_fine, livello, fonte, beneficiari, contributo_minimo, contributo_massimo, attivo, aree_interesse')
        .contains('beneficiari', ['comune'])
        .order('data_fine', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredBandi = useMemo(() => {
    if (!bandi) return [];
    const today = new Date();

    return bandi.filter(b => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!b.nome_bando?.toLowerCase().includes(q) &&
            !b.testo_bando?.toLowerCase().includes(q) &&
            !b.fonte?.toLowerCase().includes(q)) return false;
      }
      if (livelloFilter !== 'tutti' && b.livello !== livelloFilter) return false;
      if (statoFilter === 'aperto') {
        if (!b.attivo) return false;
        if (b.data_fine && isPast(new Date(b.data_fine))) return false;
      }
      if (statoFilter === 'chiuso') {
        if (b.attivo && (!b.data_fine || !isPast(new Date(b.data_fine)))) return false;
      }
      return true;
    });
  }, [bandi, searchQuery, livelloFilter, statoFilter]);

  // Conteggi per livello
  const countPerLivello = useMemo(() => {
    const counts: Record<string, number> = { UE: 0, NAZ: 0, REG: 0, PROV: 0 };
    (bandi || []).forEach(b => {
      if (b.livello && counts[b.livello] !== undefined) counts[b.livello]++;
    });
    return counts;
  }, [bandi]);

  const getLivelloBadge = (livello: string | null) => {
    const cfg = LIVELLO_CONFIG[livello || ''];
    if (!cfg) return <Badge variant="outline">{livello || 'N/D'}</Badge>;
    return (
      <Badge className={`flex items-center gap-1 ${cfg.color}`}>
        {cfg.icon} {cfg.label}
      </Badge>
    );
  };

  const getScadenzaBadge = (dataFine: string | null, attivo: boolean) => {
    if (!attivo) return <Badge variant="secondary">Non attivo</Badge>;
    if (!dataFine) return <Badge className="bg-green-100 text-green-700">Sempre aperto</Badge>;
    const deadline = new Date(dataFine);
    const daysLeft = differenceInDays(deadline, new Date());
    if (isPast(deadline)) return <Badge variant="destructive">Scaduto</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-yellow-100 text-yellow-700">Scade in {daysLeft}gg</Badge>;
    return <Badge className="bg-green-100 text-green-700">Aperto</Badge>;
  };

  return (
    <IstituzionaleLayout breadcrumbs={[{ label: 'Bandi per il Comune' }]}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Bandi per il Comune</h1>
            <p className="text-muted-foreground text-sm">
              Opportunità di finanziamento europee, nazionali, regionali e provinciali per enti pubblici
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>

        {/* Counter cards per livello */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['UE','NAZ','REG','PROV'] as const).map(liv => {
            const cfg = LIVELLO_CONFIG[liv];
            return (
              <button
                key={liv}
                onClick={() => setLivelloFilter(livelloFilter === liv ? 'tutti' : liv)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  livelloFilter === liv
                    ? 'border-[#003399] bg-[#003399]/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-[#003399]/30 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{countPerLivello[liv]}</p>
                <p className="text-xs text-gray-400">bandi disponibili</p>
              </button>
            );
          })}
        </div>

        {/* Filtri */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per titolo, ente erogatore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={livelloFilter} onValueChange={(v) => setLivelloFilter(v as LivelloFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Livello" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti i livelli</SelectItem>
                  <SelectItem value="UE">🇪🇺 Europeo</SelectItem>
                  <SelectItem value="NAZ">🇮🇹 Nazionale</SelectItem>
                  <SelectItem value="REG">📍 Regionale</SelectItem>
                  <SelectItem value="PROV">🏛️ Provinciale</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statoFilter} onValueChange={(v) => setStatoFilter(v as 'tutti' | 'aperto' | 'chiuso')}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aperto">✅ Aperti</SelectItem>
                  <SelectItem value="tutti">Tutti</SelectItem>
                  <SelectItem value="chiuso">❌ Scaduti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Risultati */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-[#1a1a2e]">{filteredBandi.length}</span> bandi trovati
          </p>
          {(livelloFilter !== 'tutti' || statoFilter !== 'aperto' || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={() => {
              setSearchQuery(''); setLivelloFilter('tutti'); setStatoFilter('aperto');
            }}>
              <Filter className="w-3 h-3 mr-1" /> Reset
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        ) : filteredBandi.length > 0 ? (
          <div className="space-y-3">
            {filteredBandi.map((bando) => (
              <Card key={bando.id} className="border border-gray-200 hover:border-[#003399]/30 hover:shadow-md transition-all bg-white">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {getLivelloBadge(bando.livello)}
                        {getScadenzaBadge(bando.data_fine, bando.attivo)}
                      </div>

                      <h3 className="font-semibold text-base text-[#1a1a2e] mb-1 line-clamp-2">
                        {bando.nome_bando}
                      </h3>

                      {bando.testo_bando && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {bando.testo_bando}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {bando.fonte && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {bando.fonte}
                          </span>
                        )}
                        {bando.data_fine && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Scadenza: {format(new Date(bando.data_fine), 'dd MMMM yyyy', { locale: it })}
                          </span>
                        )}
                        {(bando.contributo_minimo || bando.contributo_massimo) && (
                          <span className="flex items-center gap-1 font-medium text-[#003399]">
                            💰{' '}
                            {bando.contributo_minimo
                              ? `${Number(bando.contributo_minimo).toLocaleString('it-IT')}€`
                              : ''}
                            {bando.contributo_minimo && bando.contributo_massimo ? ' – ' : ''}
                            {bando.contributo_massimo
                              ? `${Number(bando.contributo_massimo).toLocaleString('it-IT')}€`
                              : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2 lg:items-end shrink-0">
                      <Button
                        size="sm"
                        className="bg-[#003399] hover:bg-[#002266] text-white"
                        onClick={() => {}}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Dettaglio
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-gray-200">
            <CardContent className="py-16 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="font-semibold text-[#1a1a2e] mb-1">Nessun bando trovato</h3>
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

export default BandiComune;
