import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, FileText, TrendingUp, GraduationCap, MapPin, Award, Network, Landmark, LayoutDashboard, Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminApprovazioniSection } from "@/components/AdminApprovazioniSection";
import { GestoreKpiDashboard } from "@/components/app/GestoreKpiDashboard";
import { GestorePraticheKpiDashboard } from "@/components/app/GestorePraticheKpiDashboard";
import { AdminBadgeSummary } from "@/components/AdminBadgeSummary";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DeMinimisOverviewDashboard } from "@/components/DeMinimisOverviewDashboard";
const Dashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    gestori: 0,
    aziende: 0,
    pratiche: 0
  });
  
  const [gestoreStats, setGestoreStats] = useState({
    aziende: 0,
    bandi: 0,
    avvisiCompatibili: 0
  });


  const [docenteStats, setDocenteStats] = useState({
    aziende: 0,
    bandi: 0,
    avvisiCompatibili: 0,
    zoneDisponibilita: 0,
    badgeFormativi: 0
  });

  const [userData, setUserData] = useState<{
    nome?: string;
    cognome?: string;
  }>({});

  // Reindirizza gli editori alla pagina bandi
  useEffect(() => {
    if (profile?.role === 'editore' && !loading) {
      navigate('/bandi', { replace: true });
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    const loadStats = async () => {
      if (profile?.role === 'admin') {
        const [gestoriRes, aziendeRes] = await Promise.all([
          supabase.from('gestori').select('id', { count: 'exact', head: true }),
          supabase.from('aziende').select('id', { count: 'exact', head: true })
        ]);
        
        setStats({
          gestori: gestoriRes.count || 0,
          aziende: aziendeRes.count || 0,
          pratiche: 0
        });

        // Carica nome e cognome dalla tabella profiles per admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nome, cognome')
          .eq('id', profile?.id)
          .maybeSingle();
        
        if (profileData) {
          setUserData({
            nome: profileData.nome || undefined,
            cognome: profileData.cognome || undefined
          });
        }
      }
      
      if (profile?.role === 'gestore') {
        await loadGestoreData();
      }

      if (profile?.role === 'docente') {
        await loadDocenteData();
      }
    };
    
    loadStats();
  }, [profile]);

  const loadGestoreData = async () => {
    try {
      const { data: gestoreData, error: gestoreError } = await supabase
        .from('gestori')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();
      
      if (gestoreError) throw gestoreError;
      
      // Query aziende solo per il gestore
      const { count: aziendeCount } = await supabase
        .from('aziende')
        .select('id', { count: 'exact', head: true })
        .eq('inserita_da_gestore_id', gestoreData.id);
      
      // Carica TUTTI i bandi attivi
      const { count: bandiCount } = await supabase
        .from('bandi')
        .select('id', { count: 'exact', head: true })
        .eq('attivo', true);

      // Conta avvisi fondi attivi
      const { count: avvisiCount } = await supabase
        .from('avvisi_fondi')
        .select('id', { count: 'exact', head: true })
        .eq('attivo', true);
      
      setGestoreStats({
        aziende: aziendeCount || 0,
        bandi: bandiCount,
        avvisiCompatibili: avvisiCount || 0
      });

      // Salva nome e cognome del gestore
      setUserData({
        nome: gestoreData.nome || undefined,
        cognome: gestoreData.cognome || undefined
      });
    } catch (error) {
      console.error('Errore caricamento dati gestore:', error);
    }
  };

  // Helper: estrae la sigla provincia da una stringa (es. "Via Roma, 00100 Roma (RM)" → "RM")
  const extractProvincia = (str: string | null): string | null => {
    if (!str) return null;
    const match = str.match(/\(([A-Z]{2})\)/);
    return match ? match[1] : null;
  };

  const calculateMatch = (azienda: any, bando: any): number => {
    // ========== CRITERI VINCOLANTI ==========
    
    // 1. ATECO - OBBLIGATORIO (se il bando lo richiede)
    if (bando.settore_ateco?.length > 0) {
      if (!azienda.codici_ateco?.length) {
        return 0; // Bando richiede ATECO ma azienda non ne ha
      }
      const hasAtecoMatch = azienda.codici_ateco.some((codiceAzienda: string) =>
        bando.settore_ateco.some((codiceBando: string) => {
          const gruppoAzienda = codiceAzienda.substring(0, 4);
          const gruppoBando = codiceBando.substring(0, 4);
          return gruppoAzienda === gruppoBando;
        })
      );
      if (!hasAtecoMatch) {
        return 0; // Nessun ATECO compatibile
      }
    }
    
    // 2. ZONA - OBBLIGATORIO (se il bando lo richiede)
    const zoneToCheck = bando.zone_applicabilita?.length > 0 
      ? bando.zone_applicabilita 
      : bando.sede_interesse;
      
    if (zoneToCheck?.length > 0 && !zoneToCheck.includes("Tutta Italia")) {
      const aziendaProvincia = extractProvincia(azienda.sede_operativa) 
                            || extractProvincia(azienda.regione);
      const aziendaRegione = azienda.regione?.split(" - ")[0]?.trim();
      
      const zonaMatch = zoneToCheck.some((zona: string) => {
        const zonaProvincia = extractProvincia(zona);
        const zonaRegione = zona.split(" - ")[0]?.trim();
        
        if (zonaProvincia && aziendaProvincia) {
          return zonaProvincia === aziendaProvincia;
        }
        return zonaRegione === aziendaRegione;
      });
      
      if (!zonaMatch) {
        return 0; // Zona non compatibile
      }
    }
    
    // 3. DIMENSIONE IMPRESA - VINCOLANTE
    if (bando.tipo_azienda?.length > 0) {
      // Mappa valori bando -> dimensione azienda
      const dimensioniMap: Record<string, string> = {
        'PMI': 'PMI',
        'Microimprese': 'Micro impresa',
        'Grandi imprese': 'Grande impresa',
        'Liberi professionisti': 'Professionista'
      };
      
      // Mappa valori bando -> qualifica azienda
      const qualificheMap: Record<string, string> = {
        'Startup': 'Startup / Impresa innovativa',
        'Rete di imprese': 'Impresa in rete / Aggregazione',
        'Ditta individuale': 'Ditta individuale'
      };
      
      const dimensioneMatch = bando.tipo_azienda.some((tipo: string) => {
        // Match per dimensione (diretto o tramite mappa)
        if (azienda.dimensione_azienda === tipo ||
            azienda.dimensione_azienda === dimensioniMap[tipo]) {
          return true;
        }
        // Match per qualifica
        if (azienda.qualifiche_azienda?.includes(tipo) ||
            azienda.qualifiche_azienda?.includes(qualificheMap[tipo])) {
          return true;
        }
        return false;
      });
      
      if (!dimensioneMatch) {
        return 0; // Dimensione non compatibile → ESCLUSIONE
      }
    }

    // 4. NUMERO DIPENDENTI - VINCOLANTE
    if (bando.numero_dipendenti?.length > 0) {
      if (!azienda.numero_dipendenti || !bando.numero_dipendenti.includes(azienda.numero_dipendenti)) {
        // Prova match con range
        const numDip = parseInt(azienda.numero_dipendenti || '0');
        const inRange = bando.numero_dipendenti.some((range: string) => {
          if (range === '0') return numDip === 0;
          if (range === '+250' || range === '250+' || range === '500+') return numDip >= 250;
          if (range.includes('/')) {
            const parts = range.split('/');
            const min = parseInt(parts[0]);
            const max = parseInt(parts[1]);
            return numDip >= min && numDip <= max;
          }
          return false;
        });
        if (!inRange) {
          return 0; // ESCLUSIONE
        }
      }
    }
    
    // 5. COSTITUZIONE SOCIETÀ - VINCOLANTE
    if (bando.costituzione_societa?.length > 0) {
      if (!azienda.costituzione_societa || !bando.costituzione_societa.includes(azienda.costituzione_societa)) {
        return 0; // ESCLUSIONE
      }
    }

    // ========== CRITERI FACOLTATIVI (PREMIANTI) ==========
    let totalOptional = 0;
    let matchedOptional = 0;

    // Investimenti
    if (bando.investimenti_finanziabili?.length > 0 && azienda.investimenti_interesse?.length > 0) {
      totalOptional++;
      const hasInvestimentiMatch = azienda.investimenti_interesse.some((inv: string) =>
        bando.investimenti_finanziabili.includes(inv)
      );
      if (hasInvestimentiMatch) matchedOptional++;
    }

    // Spese
    if (bando.spese_ammissibili?.length > 0 && azienda.spese_interesse?.length > 0) {
      totalOptional++;
      const hasSpeseMatch = azienda.spese_interesse.some((spesa: string) =>
        bando.spese_ammissibili.includes(spesa)
      );
      if (hasSpeseMatch) matchedOptional++;
    }

    // Se non ci sono criteri facoltativi, 100% (i vincolanti sono già passati)
    return totalOptional > 0 ? Math.round((matchedOptional / totalOptional) * 100) : 100;
  };

  const loadDocenteData = async () => {
    try {
      const { data: docenteData, error: docenteError } = await supabase
        .from('docenti')
        .select('*')
        .eq('profile_id', profile?.id)
        .maybeSingle();
      
      if (docenteError) throw docenteError;
      
      if (!docenteData) {
        setDocenteStats({ aziende: 0, bandi: 0, avvisiCompatibili: 0, zoneDisponibilita: 0, badgeFormativi: 0 });
        return;
      }
      
      // Conta le aziende inserite dal docente
      const { count: aziendeCount } = await supabase
        .from('aziende')
        .select('id', { count: 'exact', head: true })
        .eq('inserita_da_docente_id', docenteData.id);
      
      // Conta bandi attivi
      const { count: bandiCount } = await supabase
        .from('bandi')
        .select('id', { count: 'exact', head: true })
        .eq('attivo', true);
      
      // Conta avvisi fondi compatibili con i badge del docente
      let avvisiCompatibili = 0;
      if (docenteData.badge_formativi && docenteData.badge_formativi.length > 0) {
        const { count } = await supabase
          .from('avvisi_fondi')
          .select('id', { count: 'exact', head: true })
          .eq('attivo', true)
          .overlaps('badge_formativi', docenteData.badge_formativi);
        avvisiCompatibili = count || 0;
      }
      
      setDocenteStats({
        aziende: aziendeCount || 0,
        bandi: bandiCount || 0,
        avvisiCompatibili,
        zoneDisponibilita: docenteData.zone_disponibilita?.length || 0,
        badgeFormativi: docenteData.badge_formativi?.length || 0
      });

      setUserData({
        nome: docenteData.nome || undefined,
        cognome: docenteData.cognome || undefined
      });
    } catch (error) {
      console.error('Errore caricamento dati docente:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getDisplayName = () => {
    if (userData.nome && userData.cognome) {
      return `${userData.nome} ${userData.cognome}`;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
        <main className="flex-1 p-8 bg-background min-h-screen">
        {profile?.role === 'admin' && (
          <div>
            <PageHeader
              title="Dashboard Admin"
              description={`Benvenuto, ${getDisplayName() ? `${getDisplayName()} • ${profile?.email}` : profile?.email} • Gestisci la piattaforma Sonyc`}
              icon={<LayoutDashboard className="h-6 w-6 text-primary" />}
              breadcrumbs={[
                { label: 'Dashboard', icon: 'dashboard' }
              ]}
              counters={[
                { label: 'professionisti', count: stats.gestori, variant: 'default' },
                { label: 'aziende', count: stats.aziende, variant: 'info' },
                { label: 'pratiche', count: stats.pratiche, variant: 'success' }
              ]}
            />
            
            {/* Card Statistiche - Clickable with Add buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Professionisti Attivi */}
              <Card 
                className="bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-fade-in cursor-pointer group"
                onClick={() => navigate('/docenti')}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Professionisti Attivi
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-primary-foreground w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/docenti?action=new');
                      }}
                      title="Aggiungi Professionista"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.gestori}
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>Clicca per vedere l'elenco</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Aziende Registrate */}
              <Card 
                className="bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-fade-in cursor-pointer group" 
                style={{ animationDelay: '100ms' }}
                onClick={() => navigate('/aziende')}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Aziende Registrate
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-primary-foreground w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/aziende?action=new');
                      }}
                      title="Aggiungi Azienda"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.aziende}
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>Clicca per vedere l'elenco</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Pratiche in Corso */}
              <Card 
                className="bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-fade-in cursor-pointer group" 
                style={{ animationDelay: '200ms' }}
                onClick={() => navigate('/pratiche')}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pratiche in Corso
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-primary-foreground w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/pratiche?action=new');
                      }}
                      title="Nuova Pratica"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.pratiche}
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>Clicca per vedere l'elenco</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Riepilogo Badge Formativi */}
            <div className="mb-8">
              <AdminBadgeSummary />
            </div>
            
            {/* Dashboard De Minimis */}
            <div className="mb-8">
              <DeMinimisOverviewDashboard 
                title="Status De Minimis - Tutte le Aziende" 
                showBulkCheck={true}
              />
            </div>
            
            {/* Sezione Approvazioni */}
            <AdminApprovazioniSection />
          
          </div>
        )}
        
        {/* Professionista: può creare collaboratori, aziende e inserire bandi */}
        {profile?.role === 'gestore' && (
          <div>
            <PageHeader
              title="Dashboard Professionista"
              description={`Benvenuto, ${getDisplayName() ? `${getDisplayName()} • ${profile?.email}` : profile?.email}`}
              icon={<Briefcase className="h-6 w-6 text-primary" />}
              breadcrumbs={[
                { label: 'Dashboard', icon: 'dashboard' }
              ]}
              counters={[
                { label: 'aziende', count: gestoreStats.aziende, variant: 'info' },
                { label: 'bandi', count: gestoreStats.bandi, variant: 'warning' }
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Aziende Clienti"
                value={gestoreStats.aziende}
                subtitle="In gestione"
                icon={Building2}
                colorVariant="blue"
                href="/aziende"
                addHref="/aziende?action=new"
                animationDelay={1}
              />
              <StatCard
                title="Bandi Attivi"
                value={gestoreStats.bandi}
                subtitle="Assegnati a te"
                icon={FileText}
                colorVariant="amber"
                href="/bandi"
                animationDelay={2}
              />
              <StatCard
                title="Fondi Interprofessionali"
                value={gestoreStats.avvisiCompatibili}
                subtitle="Avvisi attivi"
                icon={Landmark}
                colorVariant="purple"
                href="/fondi"
                animationDelay={3}
              />
            </div>

            {/* Dashboard KPI */}
            <GestoreKpiDashboard />

            {/* Dashboard De Minimis */}
            <div className="mt-8">
              <DeMinimisOverviewDashboard 
                title="Status De Minimis - Le Tue Aziende" 
                showBulkCheck={true}
              />
            </div>
          </div>
        )}

        {/* Docente Dashboard */}
        {profile?.role === 'docente' && (
          <div>
            <PageHeader
              title="Dashboard Docente"
              description={`Benvenuto, ${getDisplayName() ? `${getDisplayName()} • ${profile?.email}` : profile?.email}`}
              icon={<GraduationCap className="h-6 w-6 text-primary" />}
              breadcrumbs={[
                { label: 'Dashboard', icon: 'dashboard' }
              ]}
              counters={[
                { label: 'aziende', count: docenteStats.aziende, variant: 'default' },
                { label: 'badge', count: docenteStats.badgeFormativi, variant: 'info' },
                { label: 'avvisi', count: docenteStats.avvisiCompatibili, variant: 'success' }
              ]}
            />

            {/* Statistiche Docente */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Aziende Gestite"
                value={docenteStats.aziende}
                subtitle="Inserite da te"
                icon={Building2}
                colorVariant="purple"
                href="/aziende"
                addHref="/aziende?action=new"
                animationDelay={0}
              />
              <StatCard
                title="Badge Formativi"
                value={docenteStats.badgeFormativi}
                subtitle="Nel tuo profilo"
                icon={Award}
                colorVariant="blue"
                href="/profilo-docente"
                animationDelay={1}
              />
              <StatCard
                title="Avvisi Compatibili"
                value={docenteStats.avvisiCompatibili}
                subtitle="Match con i tuoi badge"
                icon={Network}
                colorVariant="green"
                href="/fondi"
                animationDelay={2}
              />
              <StatCard
                title="Zone Disponibilità"
                value={docenteStats.zoneDisponibilita}
                subtitle="Aree geografiche"
                icon={MapPin}
                colorVariant="orange"
                href="/profilo-docente"
                animationDelay={3}
              />
            </div>

            {/* Card Navigazione Rapida */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/profilo-docente">
                <Card className="bg-card border border-border shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-purple-500" />
                      Il Mio Profilo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Gestisci competenze, badge e disponibilità</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/aziende">
                <Card className="bg-card border border-border shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-500" />
                      Le Mie Aziende
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Gestisci le aziende clienti</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/fondi">
                <Card className="bg-card border border-border shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      Avvisi Fondi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Esplora gli avvisi compatibili</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Dashboard De Minimis */}
            <div className="mt-8">
              <DeMinimisOverviewDashboard 
                title="Status De Minimis - Le Tue Aziende" 
                showBulkCheck={true}
              />
            </div>
          </div>
        )}

        {/* Gestore Pratiche Dashboard */}
        {profile?.role === 'gestore_pratiche' && (
          <div>
            <PageHeader
              title="Dashboard Gestore Pratiche"
              description={`Benvenuto, ${getDisplayName() ? `${getDisplayName()} • ${profile?.email}` : profile?.email}`}
              icon={<FileText className="h-6 w-6 text-primary" />}
              breadcrumbs={[
                { label: 'Dashboard', icon: 'dashboard' }
              ]}
            />

            {/* KPI Dashboard per Gestore Pratiche */}
            <GestorePraticheKpiDashboard />

            {/* Card Navigazione Rapida */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Link to="/pratiche">
                <Card className="bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Pratiche
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Gestisci le pratiche assegnate</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/aziende">
                <Card className="bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Aziende
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Visualizza le aziende collegate</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/profilo-gestore-pratiche">
                <Card className="bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Il Mio Profilo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Gestisci il tuo profilo e le assegnazioni</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
