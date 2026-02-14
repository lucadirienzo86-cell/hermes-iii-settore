import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { HersCard } from '@/components/app/HersCard';
import { HersBadge } from '@/components/app/HersBadge';
import { FondoCard } from '@/components/app/FondoCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useFondiCompatibilityApp, type AziendaData } from '@/hooks/useFondiCompatibilityApp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Filter, 
  X, 
  Sparkles, 
  Building2 
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';

const AppFondi = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [aziendaData, setAziendaData] = useState<AziendaData | null>(null);
  const { avvisi, isLoading, calculateCompatibility } = useFondiCompatibilityApp();
  
  // Filtri
  const [filtroFondo, setFiltroFondo] = useState<string>('');
  const [filtroRegione, setFiltroRegione] = useState<string>('');
  
  // Fetch fondi per filtro
  const { data: fondi = [] } = useQuery({
    queryKey: ['fondi-interprofessionali'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fondi_interprofessionali')
        .select('id, nome')
        .eq('attivo', true)
        .order('nome');
      return data || [];
    }
  });

  useEffect(() => {
    loadAziendaData();
  }, [profile]);

  const loadAziendaData = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('aziende')
      .select('*')
      .eq('profile_id', profile.id)
      .single();
    
    if (data) {
      setAziendaData(data);
    }
  };

  const isDatiIncompleti = !aziendaData || 
    !aziendaData.codici_ateco || 
    aziendaData.codici_ateco.length === 0 ||
    !aziendaData.regione;

  // Calcola compatibilità e filtra
  const avvisiCompatibili = useMemo(() => {
    if (!aziendaData) return [];
    
    let result = calculateCompatibility(aziendaData, avvisi)
      .filter(a => a.compatibile)
      .sort((a, b) => b.compatibilita_percentuale - a.compatibilita_percentuale);
    
    if (filtroFondo) {
      result = result.filter(a => a.fondo_id === filtroFondo);
    }
    
    if (filtroRegione) {
      result = result.filter(a => 
        a.regioni?.includes(filtroRegione) || 
        a.regioni?.includes('Tutta Italia')
      );
    }
    
    return result;
  }, [aziendaData, avvisi, filtroFondo, filtroRegione, calculateCompatibility]);

  const hasFiltri = filtroFondo || filtroRegione;

  const resetFiltri = () => {
    setFiltroFondo('');
    setFiltroRegione('');
  };

  // Custom header
  const customHeader = (
    <header className="bg-background sticky top-0 z-40 px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formazione Finanziata</h1>
          <p className="text-sm text-muted-foreground">
            Avvisi formativi disponibili
          </p>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="relative p-2.5 rounded-full bg-muted hover:bg-muted/70 transition-colors">
              <Filter className="w-5 h-5 text-foreground" />
              {hasFiltri && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Filtra avvisi</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fondo</label>
                <Select value={filtroFondo} onValueChange={setFiltroFondo}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Tutti i fondi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti i fondi</SelectItem>
                    {fondi.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Regione</label>
                <Select value={filtroRegione} onValueChange={setFiltroRegione}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Tutte le regioni" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte le regioni</SelectItem>
                    <SelectItem value="Tutta Italia">Tutta Italia</SelectItem>
                    {aziendaData?.regione && (
                      <SelectItem value={aziendaData.regione}>{aziendaData.regione}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {hasFiltri && (
                <button
                  onClick={resetFiltri}
                  className="w-full py-3 text-destructive font-medium hover:underline"
                >
                  Rimuovi filtri
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );

  return (
    <AppLayout customHeader={customHeader}>
      <div className="space-y-4">
        {/* Alert Dati Incompleti */}
        {isDatiIncompleti && (
          <Alert className="border-warning/30 bg-warning/5 rounded-3xl">
            <AlertCircle className="h-5 w-5 text-warning" />
            <AlertDescription className="text-warning">
              <strong>Completa il tuo profilo</strong> per vedere la compatibilità.
              <button
                onClick={() => navigate('/app/profilo')}
                className="ml-2 underline font-semibold hover:opacity-80"
              >
                Vai al profilo
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filtri attivi */}
        {hasFiltri && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtri:</span>
            {filtroFondo && (
              <HersBadge variant="mint" className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {fondi.find(f => f.id === filtroFondo)?.nome}
                <button onClick={() => setFiltroFondo('')}>
                  <X className="w-3 h-3" />
                </button>
              </HersBadge>
            )}
            {filtroRegione && (
              <HersBadge variant="yellow" className="flex items-center gap-1">
                {filtroRegione}
                <button onClick={() => setFiltroRegione('')}>
                  <X className="w-3 h-3" />
                </button>
              </HersBadge>
            )}
          </div>
        )}

        {/* Risultati count */}
        {!isLoading && !isDatiIncompleti && (
          <p className="text-sm text-muted-foreground">
            {avvisiCompatibili.length} avvisi compatibili
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        )}

        {/* Lista Avvisi */}
        {!isLoading && avvisiCompatibili.length > 0 && (
          <div className="space-y-3">
            {avvisiCompatibili.map((avviso) => (
              <FondoCard
                key={avviso.id}
                id={avviso.id}
                titolo={avviso.titolo}
                fondoNome={avviso.fondo?.nome}
                scadenza={avviso.data_chiusura}
                compatibilita={avviso.compatibilita_percentuale}
                tematiche={avviso.tematiche}
                onClick={() => navigate(`/app/fondi/${avviso.id}`)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isDatiIncompleti && avvisiCompatibili.length === 0 && (
          <HersCard className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nessun avviso trovato
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {hasFiltri 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non ci sono avvisi compatibili con il tuo profilo al momento'}
            </p>
            {hasFiltri && (
              <button
                onClick={resetFiltri}
                className="mt-4 text-primary font-medium hover:underline"
              >
                Rimuovi tutti i filtri
              </button>
            )}
          </HersCard>
        )}
      </div>
    </AppLayout>
  );
};

export default AppFondi;