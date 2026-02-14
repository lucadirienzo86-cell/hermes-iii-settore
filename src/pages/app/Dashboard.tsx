import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { HersCard } from '@/components/app/HersCard';
import { HersBadge } from '@/components/app/HersBadge';
import { HersButton } from '@/components/app/HersButton';
import { ProgressSteps } from '@/components/app/ProgressSteps';
import { FondoCard } from '@/components/app/FondoCard';
import { BandiPreviewCard } from '@/components/app/BandiPreviewCard';
import { PullToRefresh } from '@/components/app/PullToRefresh';
import { PWAInstallBanner } from '@/components/app/PWAInstallBanner';
import { 
  Wallet, 
  ClipboardList, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  Award,
  FileText,
  MapPin,
  Users,
  Phone,
  Building,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useFondiCompatibilityApp, type AziendaData } from '@/hooks/useFondiCompatibilityApp';
import { useBandiCompatibility } from '@/hooks/useBandiCompatibility';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AppDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [aziendaData, setAziendaData] = useState<AziendaData | null>(null);
  const [aziendaFondi, setAziendaFondi] = useState<any[]>([]);
  const [pratiche, setPratiche] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const { avvisi, isLoading, calculateCompatibility, refetch } = useFondiCompatibilityApp();
  const { bandi, isLoading: isLoadingBandi, calculateCompatibility: calculateBandiCompatibility, refetch: refetchBandi } = useBandiCompatibility();

  useEffect(() => {
    if (profile?.id) {
      loadAziendaData();
      loadPratiche();
      loadProfileData();
    }
  }, [profile]);

  const loadProfileData = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single();
    if (data) setProfileData(data);
  };

  const loadAziendaData = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('aziende')
      .select('*')
      .eq('profile_id', profile.id)
      .single();
    
    if (data) {
      setAziendaData(data);
      // Load fondi iscritti
      const { data: fondiData } = await supabase
        .from('aziende_fondi')
        .select(`
          *,
          fondo:fondi_interprofessionali(id, nome, codice)
        `)
        .eq('azienda_id', data.id);
      
      setAziendaFondi(fondiData || []);
    }
  };

  const loadPratiche = async () => {
    if (!profile?.id) return;
    
    const { data: azienda } = await supabase
      .from('aziende')
      .select('id')
      .eq('profile_id', profile.id)
      .single();
    
    if (azienda) {
      const { data } = await supabase
        .from('pratiche')
        .select('*')
        .eq('azienda_id', azienda.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      setPratiche(data || []);
    }
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      loadAziendaData(),
      loadPratiche(),
      loadProfileData(),
      refetch(),
      refetchBandi()
    ]);
    toast.success('Dati aggiornati');
  }, [refetch, refetchBandi]);

  // Avvisi compatibili
  const avvisiCompatibili = aziendaData 
    ? calculateCompatibility(aziendaData, avvisi)
        .filter(a => a.compatibile)
        .sort((a, b) => b.compatibilita_percentuale - a.compatibilita_percentuale)
    : [];
  const topAvvisi = avvisiCompatibili.slice(0, 3);

  // Bandi compatibili
  const bandiCompatibili = aziendaData 
    ? calculateBandiCompatibility(aziendaData as any, bandi)
        .filter(b => b.compatibile)
        .sort((a, b) => b.compatibilita_percentuale - a.compatibilita_percentuale)
    : [];
  const topBandi = bandiCompatibili.slice(0, 3);

  const isDatiIncompleti = !aziendaData || 
    !aziendaData.codici_ateco || 
    aziendaData.codici_ateco.length === 0 ||
    !aziendaData.regione;

  // Progress steps for pratica
  const praticaRecente = pratiche[0];
  const getProgressSteps = () => {
    const stato = praticaRecente?.stato || '';
    return [
      { label: 'Richiesta', completed: true, active: stato === 'bozza' || stato === 'in_valutazione' },
      { label: 'Revisione', completed: ['approvata', 'in_lavorazione', 'completata'].includes(stato), active: stato === 'in_lavorazione' },
      { label: 'Approvata', completed: ['completata'].includes(stato), active: stato === 'approvata' },
      { label: 'Erogata', completed: stato === 'completata', active: stato === 'completata' },
    ];
  };

  const getUserDisplayName = () => {
    if (profileData?.nome) return profileData.nome;
    return '';
  };

  // Cast aziendaData per accedere a campi extra
  const aziendaExtended = aziendaData as any;

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6">
          {/* PWA Install Banner */}
          <PWAInstallBanner />
          
          {/* Welcome Header - Enhanced with personal data */}
          <div className="bg-gradient-to-br from-primary/10 via-accent to-primary/5 rounded-3xl p-6 -mx-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">
                  Dashboard
                </p>
                <h1 className="text-2xl font-bold text-foreground">
                  Bentornato{getUserDisplayName() ? `, ${getUserDisplayName()}` : ''}
                </h1>
                {aziendaData?.ragione_sociale && (
                  <p className="text-lg font-medium text-foreground/80 mt-1">
                    {aziendaData.ragione_sociale}
                  </p>
                )}
              </div>
              <button 
                onClick={() => navigate('/app/profilo')}
                className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Building className="w-6 h-6 text-primary" />
              </button>
            </div>
            
            {/* Dati rapidi azienda */}
            {aziendaData && (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
                {aziendaExtended?.partita_iva && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">P.IVA:</span>
                    <span className="font-medium text-foreground truncate">{aziendaExtended.partita_iva}</span>
                  </div>
                )}
                {aziendaData.regione && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground truncate">{aziendaData.regione}</span>
                  </div>
                )}
                {aziendaData.numero_dipendenti && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{aziendaData.numero_dipendenti} dipendenti</span>
                  </div>
                )}
                {aziendaExtended?.telefono && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground truncate">{aziendaExtended.telefono}</span>
                  </div>
                )}
                {aziendaData.dimensione_azienda && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{aziendaData.dimensione_azienda}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alert Dati Incompleti */}
          {isDatiIncompleti && (
            <Alert className="border-2 border-warning/40 bg-warning/10 rounded-2xl shadow-sm">
              <AlertCircle className="h-5 w-5 text-warning" />
              <AlertDescription className="text-foreground">
                <strong className="text-warning">Completa il tuo profilo</strong> per vedere i fondi e bandi compatibili.
                <button
                  onClick={() => navigate('/app/profilo')}
                  className="ml-2 text-primary underline font-semibold hover:opacity-80"
                >
                  Vai al profilo
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Bandi Compatibili - NUOVA SEZIONE */}
          {!isDatiIncompleti && !isLoadingBandi && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  Bandi per te
                  {bandiCompatibili.length > 0 && (
                    <span className="ml-2 px-2.5 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded-full">
                      {bandiCompatibili.length}
                    </span>
                  )}
                </h2>
                <button 
                  onClick={() => navigate('/app/bandi')}
                  className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
                >
                  Vedi tutti
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {topBandi.length > 0 ? (
                <div className="space-y-3">
                  {topBandi.map((bando) => (
                    <BandiPreviewCard
                      key={bando.id}
                      titolo={bando.titolo}
                      ente={bando.ente}
                      compatibilitaPercentuale={bando.compatibilita_percentuale}
                      criteriSoddisfatti={bando.criteri_soddisfatti}
                      criteriTotali={bando.criteri_totali}
                      dataChiusura={bando.data_chiusura}
                      importoMassimo={bando.importo_massimo}
                      investimentiMatch={bando.investimenti_match}
                      speseMatch={bando.spese_match}
                      dettaglioCriteri={bando.dettaglio_criteri}
                      onClick={() => navigate(`/app/bandi/${bando.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-sm">
                  <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-foreground font-medium">Nessun bando compatibile</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Controlla più tardi per nuove opportunità
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Avvisi Compatibili */}
          {!isDatiIncompleti && !isLoading && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-success rounded-full" />
                  Avvisi per te
                  {avvisiCompatibili.length > 0 && (
                    <span className="ml-2 px-2.5 py-0.5 bg-success/20 text-success text-xs font-bold rounded-full">
                      {avvisiCompatibili.length}
                    </span>
                  )}
                </h2>
                <button 
                  onClick={() => navigate('/app/fondi')}
                  className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
                >
                  Vedi tutti
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {topAvvisi.length > 0 ? (
                <div className="space-y-3">
                  {topAvvisi.map((avviso) => (
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
              ) : (
                <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-foreground font-medium">
                    Nessun avviso compatibile
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ti avviseremo quando ci saranno nuovi avvisi per te
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Pratica Status Card */}
          {praticaRecente && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-secondary rounded-full" />
                  Pratica in corso
                </h2>
              </div>
              <div 
                className="bg-gradient-to-br from-card via-card to-accent/20 rounded-3xl p-6 border border-border/50 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
                onClick={() => navigate(`/app/pratiche/${praticaRecente.id}/chat`)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{praticaRecente.titolo}</h3>
                    <HersBadge variant={praticaRecente.stato === 'approvata' ? 'success' : 'mint'}>
                      {praticaRecente.stato === 'bozza' ? 'In attesa' : 
                       praticaRecente.stato === 'in_valutazione' ? 'In revisione' :
                       praticaRecente.stato === 'approvata' ? 'Approvata' : 
                       praticaRecente.stato}
                    </HersBadge>
                  </div>
                  <div className="h-px bg-border/60" />
                  <ProgressSteps steps={getProgressSteps()} />
                </div>
              </div>
            </section>
          )}

          {/* I tuoi Fondi Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-1.5 h-6 bg-warning rounded-full" />
                I tuoi fondi
              </h2>
              {aziendaFondi.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {aziendaFondi.length} iscrizioni
                </span>
              )}
            </div>
            
            {aziendaFondi.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5 scrollbar-hide">
                {aziendaFondi.map((af) => (
                  <div 
                    key={af.id}
                    className="shrink-0 w-44 p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                      <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-bold text-foreground text-sm line-clamp-2">
                      {af.fondo?.nome || 'Fondo'}
                    </p>
                    {af.fondo?.codice && (
                      <p className="text-xs text-primary font-medium mt-1.5">
                        {af.fondo.codice}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/50 rounded-2xl p-6 text-center border-2 border-dashed border-border">
                <Wallet className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">
                  Nessun fondo iscritto
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  I fondi vengono gestiti dal tuo consulente
                </p>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-1.5 h-6 bg-muted-foreground rounded-full" />
                Azioni rapide
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => navigate('/app/bandi')}
                className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl p-5 cursor-pointer border border-primary/20 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                  <Award className="w-7 h-7 text-primary" />
                </div>
                <p className="font-bold text-foreground">Sfoglia Bandi</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Opportunità regionali
                </p>
              </div>
              
              <div 
                onClick={() => navigate('/app/fondi')}
                className="bg-gradient-to-br from-success/15 to-success/5 rounded-2xl p-5 cursor-pointer border border-success/20 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center mb-4">
                  <Wallet className="w-7 h-7 text-success" />
                </div>
                <p className="font-bold text-foreground">Sfoglia Avvisi</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fondi interprofessionali
                </p>
              </div>
              
              <div 
                onClick={() => navigate('/app/pratiche')}
                className="bg-gradient-to-br from-secondary/15 to-secondary/5 rounded-2xl p-5 cursor-pointer border border-secondary/20 hover:shadow-lg transition-all duration-300 active:scale-[0.98] col-span-2"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-7 h-7 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Le tue pratiche</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monitora lo stato delle tue richieste
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </PullToRefresh>
    </AppLayout>
  );
};

export default AppDashboard;
