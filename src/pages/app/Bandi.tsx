import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { BandiHeader } from '@/components/app/BandiHeader';
import { BandiIntroCard } from '@/components/app/BandiIntroCard';
import { BandoSimpleCard } from '@/components/app/BandoSimpleCard';
import { HersCard } from '@/components/app/HersCard';
import { HersButton } from '@/components/app/HersButton';
import { Progress } from '@/components/ui/progress';
import { SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppButton } from '@/components/app/AppButton';
import { useBandiCompatibility, type AziendaData, type BandoCompatibility } from '@/hooks/useBandiCompatibility';
import { useInvestimentiOptions } from '@/hooks/useInvestimentiOptions';
import { useSpeseOptions } from '@/hooks/useSpeseOptions';
import { AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

const AppBandi = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [aziendaData, setAziendaData] = useState<AziendaData | null>(null);
  const { bandi, isLoading, calculateCompatibility } = useBandiCompatibility();
  const { options: investimentiOptions } = useInvestimentiOptions();
  const { options: speseOptions } = useSpeseOptions();
  
  // Filtri
  const [filtroInvestimenti, setFiltroInvestimenti] = useState<string>('tutti');
  const [filtroSpese, setFiltroSpese] = useState<string>('tutti');
  const [filtroImportoMin, setFiltroImportoMin] = useState<number | null>(null);
  const [filtroImportoMax, setFiltroImportoMax] = useState<number | null>(null);

  useEffect(() => {
    loadAziendaData();
  }, [profile]);

  const loadAziendaData = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('aziende')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    if (!error && data) {
      setAziendaData(data);
    }
  };

  // Calcola completezza profilo per matching
  const profiloCompleteness = useMemo(() => {
    if (!aziendaData) return { percentage: 0, missing: ['Profilo azienda'], isComplete: false };
    
    const checks = [
      { name: 'Codici ATECO', ok: (aziendaData.codici_ateco && aziendaData.codici_ateco.length > 0) || !!aziendaData.codice_ateco },
      { name: 'Regione', ok: !!aziendaData.regione },
      { name: 'Dimensione azienda', ok: !!aziendaData.dimensione_azienda },
      { name: 'Numero dipendenti', ok: !!aziendaData.numero_dipendenti },
      { name: 'Costituzione', ok: !!aziendaData.costituzione_societa },
      { name: 'Investimenti interesse', ok: aziendaData.investimenti_interesse && aziendaData.investimenti_interesse.length > 0 },
      { name: 'Spese interesse', ok: aziendaData.spese_interesse && aziendaData.spese_interesse.length > 0 }
    ];
    
    const completed = checks.filter(c => c.ok).length;
    const missing = checks.filter(c => !c.ok).map(c => c.name);
    
    // Criteri vincolanti: ATECO e Regione
    const vincolantiOk = checks[0].ok && checks[1].ok;
    
    return {
      percentage: Math.round((completed / checks.length) * 100),
      missing,
      isComplete: missing.length === 0,
      vincolantiOk
    };
  }, [aziendaData]);

  const isDatiIncompleti = !profiloCompleteness.vincolantiOk;

  let bandiCompatibili: BandoCompatibility[] = [];
  
  if (aziendaData && profiloCompleteness.vincolantiOk) {
    bandiCompatibili = calculateCompatibility(aziendaData, bandi)
      .filter(b => b.compatibile)
      .sort((a, b) => b.compatibilita_percentuale - a.compatibilita_percentuale);

    // Applica filtri
    if (filtroInvestimenti !== 'tutti') {
      bandiCompatibili = bandiCompatibili.filter(b => 
        b.investimenti_finanziabili?.includes(filtroInvestimenti)
      );
    }

    if (filtroSpese !== 'tutti') {
      bandiCompatibili = bandiCompatibili.filter(b => 
        b.spese_ammissibili?.includes(filtroSpese)
      );
    }

    if (filtroImportoMin !== null) {
      bandiCompatibili = bandiCompatibili.filter(b => 
        !b.importo_minimo || b.importo_minimo >= filtroImportoMin
      );
    }

    if (filtroImportoMax !== null) {
      bandiCompatibili = bandiCompatibili.filter(b => 
        !b.importo_massimo || b.importo_massimo <= filtroImportoMax
      );
    }
  }

  const resetFiltri = () => {
    setFiltroInvestimenti('tutti');
    setFiltroSpese('tutti');
    setFiltroImportoMin(null);
    setFiltroImportoMax(null);
  };

  return (
    <AppLayout customHeader={<BandiHeader />}>
      {/* Sfondo grigio chiaro */}
      <div className="bg-gray-50 min-h-screen pb-20 -mx-6 -my-8">
        
        {/* Card introduttiva */}
        <BandiIntroCard 
          count={bandiCompatibili.length}
          filterContent={
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtri</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <Label className="font-semibold mb-3 block">Investimenti</Label>
                  <Select value={filtroInvestimenti} onValueChange={setFiltroInvestimenti}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutti">Tutti</SelectItem>
                      {investimentiOptions.map((inv) => (
                        <SelectItem key={inv} value={inv}>{inv}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold mb-3 block">Spese</Label>
                  <Select value={filtroSpese} onValueChange={setFiltroSpese}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutti">Tutte</SelectItem>
                      {speseOptions.map((spesa) => (
                        <SelectItem key={spesa} value={spesa}>{spesa}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold mb-3 block">Contributo Minimo (€)</Label>
                  <Select 
                    value={filtroImportoMin?.toString() || 'nessuno'} 
                    onValueChange={(v) => setFiltroImportoMin(v === 'nessuno' ? null : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nessuno">Nessun filtro</SelectItem>
                      <SelectItem value="1000">€ 1.000+</SelectItem>
                      <SelectItem value="5000">€ 5.000+</SelectItem>
                      <SelectItem value="10000">€ 10.000+</SelectItem>
                      <SelectItem value="50000">€ 50.000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold mb-3 block">Contributo Massimo (€)</Label>
                  <Select 
                    value={filtroImportoMax?.toString() || 'nessuno'} 
                    onValueChange={(v) => setFiltroImportoMax(v === 'nessuno' ? null : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nessuno">Nessun filtro</SelectItem>
                      <SelectItem value="10000">Fino a € 10.000</SelectItem>
                      <SelectItem value="50000">Fino a € 50.000</SelectItem>
                      <SelectItem value="100000">Fino a € 100.000</SelectItem>
                      <SelectItem value="500000">Fino a € 500.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AppButton 
                  onClick={resetFiltri}
                  variant="secondary"
                  className="w-full"
                >
                  Resetta Filtri
                </AppButton>
              </div>
            </SheetContent>
          }
        />

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Lista bandi */}
        {!isLoading && !isDatiIncompleti && bandiCompatibili.length > 0 && (
          <div className="px-4 mt-6 space-y-3 pb-6">
            {bandiCompatibili.map((bando) => (
              <BandoSimpleCard
                key={bando.id}
                title={bando.titolo}
                description={bando.descrizione?.substring(0, 100)}
                compatibilita={bando.compatibilita_percentuale}
                investimentiMatch={bando.investimenti_match}
                speseMatch={bando.spese_match}
                onClick={() => navigate(`/app/bandi/${bando.id}`)}
              />
            ))}
          </div>
        )}

        {/* Empty state - dati incompleti */}
        {!isLoading && isDatiIncompleti && (
          <div className="px-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <HersCard className="!p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Completa il profilo aziendale</h3>
                    <p className="text-sm text-muted-foreground">
                      Per vedere i bandi compatibili devi inserire i dati fondamentali della tua azienda.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completezza profilo</span>
                    <span className="font-medium text-warning">{profiloCompleteness.percentage}%</span>
                  </div>
                  <Progress value={profiloCompleteness.percentage} className="h-2" />
                </div>
                
                {profiloCompleteness.missing.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Mancano: <span className="text-foreground font-medium">{profiloCompleteness.missing.slice(0, 3).join(', ')}</span>
                      {profiloCompleteness.missing.length > 3 && ` e altri ${profiloCompleteness.missing.length - 3}`}
                    </span>
                  </div>
                )}
                
                <HersButton 
                  onClick={() => navigate('/app/profilo')}
                  fullWidth
                >
                  Completa il profilo
                </HersButton>
              </HersCard>
            </motion.div>
          </div>
        )}

        {/* Profilo incompleto warning (sopra la lista bandi) */}
        {!isLoading && !isDatiIncompleti && !profiloCompleteness.isComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 mt-4"
          >
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Profilo {profiloCompleteness.percentage}% completo. 
                  <button 
                    onClick={() => navigate('/app/profilo')}
                    className="text-primary font-medium ml-1 underline"
                  >
                    Completa per matching più precisi
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state - nessun bando */}
        {!isLoading && !isDatiIncompleti && bandiCompatibili.length === 0 && (
          <div className="px-4 mt-12 text-center">
            <p className="text-gray-500">
              Nessun bando compatibile trovato con i filtri selezionati
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AppBandi;
