import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { BandiHeader } from '@/components/app/BandiHeader';
import { BandoDettaglioCard } from '@/components/app/BandoDettaglioCard';
import { MatchingCriteriaCard, buildCriteriVisivi } from '@/components/app/MatchingCriteriaCard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useBandiCompatibility, type AziendaData } from '@/hooks/useBandiCompatibility';

interface Bando {
  id: string;
  titolo: string;
  descrizione?: string | null;
  ente?: string | null;
  data_apertura?: string | null;
  data_chiusura?: string | null;
  tipo_agevolazione?: string | null;
  importo_minimo?: number | null;
  importo_massimo?: number | null;
  tipo_azienda?: string[] | null;
  numero_dipendenti?: string[] | null;
  costituzione_societa?: string[] | null;
  zone_applicabilita?: string[] | null;
  sede_interesse?: string[] | null;
  settore_ateco?: string[] | null;
  investimenti_finanziabili?: string[] | null;
  spese_ammissibili?: string[] | null;
  note?: string | null;
  link_bando?: string | null;
  pdf_url?: string | null;
  pdf_urls?: string[] | null;
}

interface AziendaProfilo extends AziendaData {
  codice_ateco?: string | null;
}

const AppBandoDettaglio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [bando, setBando] = useState<Bando | null>(null);
  const [azienda, setAzienda] = useState<AziendaProfilo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [praticaEsiste, setPraticaEsiste] = useState(false);
  
  const { calculateCompatibility } = useBandiCompatibility();

  useEffect(() => {
    loadBando();
    loadAziendaData();
    checkPraticaEsistente();
  }, [id, profile]);

  const loadAziendaData = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('aziende')
      .select('id, ragione_sociale, codici_ateco, codice_ateco, regione, dimensione_azienda, numero_dipendenti, costituzione_societa, investimenti_interesse, spese_interesse, sede_operativa')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (data) {
      setAzienda(data);
    }
  };

  const checkPraticaEsistente = async () => {
    if (!profile?.id || !id) return;

    // Prima ottieni l'azienda ID
    const { data: aziendaData } = await supabase
      .from('aziende')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!aziendaData) return;

    // Poi cerca la pratica
    const { data } = await supabase
      .from('pratiche')
      .select('id')
      .eq('azienda_id', aziendaData.id)
      .eq('bando_id', id)
      .maybeSingle();

    setPraticaEsiste(!!data);
  };

  const loadBando = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('bandi')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setBando(data);
    }
    
    setLoading(false);
  };

  // Calcola compatibilità
  const compatibility = useMemo(() => {
    if (!bando || !azienda) return null;
    
    const bandoForCalc = {
      id: bando.id,
      titolo: bando.titolo,
      descrizione: bando.descrizione || null,
      ente: bando.ente || null,
      tipo_agevolazione: bando.tipo_agevolazione || null,
      data_apertura: bando.data_apertura || null,
      data_chiusura: bando.data_chiusura || null,
      attivo: true,
      settore_ateco: bando.settore_ateco || null,
      sede_interesse: bando.sede_interesse || null,
      zone_applicabilita: bando.zone_applicabilita || null,
      tipo_azienda: bando.tipo_azienda || null,
      numero_dipendenti: bando.numero_dipendenti || null,
      costituzione_societa: bando.costituzione_societa || null,
      investimenti_finanziabili: bando.investimenti_finanziabili || null,
      spese_ammissibili: bando.spese_ammissibili || null,
      importo_minimo: bando.importo_minimo || null,
      importo_massimo: bando.importo_massimo || null,
      link_bando: bando.link_bando || null,
      note: bando.note || null,
      created_at: '',
    };
    
    const results = calculateCompatibility(azienda, [bandoForCalc]);
    return results[0] || null;
  }, [bando, azienda, calculateCompatibility]);

  // Verifica se ci sono dati azienda sufficienti
  const datiMancanti = !azienda || (
    (!azienda.codici_ateco || azienda.codici_ateco.length === 0) && 
    !azienda.codice_ateco &&
    !azienda.regione
  );

  // Costruisci criteri visivi
  const criteriVisivi = useMemo(() => {
    if (!bando || !compatibility) return [];
    
    return buildCriteriVisivi(
      bando,
      azienda,
      compatibility.dettaglio_criteri,
      compatibility.investimenti_match,
      compatibility.spese_match
    );
  }, [bando, azienda, compatibility]);

  const handleRichiestaValutazione = async () => {
    if (!profile?.id || !id) return;

    setSubmitting(true);

    // Ottieni azienda ID
    const { data: azienda } = await supabase
      .from('aziende')
      .select('id, inserita_da_gestore_id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!azienda) {
      toast.error('Dati azienda non trovati');
      setSubmitting(false);
      return;
    }

    // Verifica se esiste già
    const { data: existing } = await supabase
      .from('pratiche')
      .select('id')
      .eq('azienda_id', azienda.id)
      .eq('bando_id', id)
      .maybeSingle();

    if (existing) {
      toast.error('Hai già richiesto la valutazione per questo bando');
      setSubmitting(false);
      setPraticaEsiste(true);
      return;
    }

    // Crea pratica
    const { error } = await supabase
      .from('pratiche')
      .insert({
        azienda_id: azienda.id,
        bando_id: id,
        titolo: bando?.titolo || 'Richiesta Valutazione',
        stato: 'bozza'
      });

    setSubmitting(false);

    if (error) {
      toast.error('Errore durante l\'invio della richiesta');
      console.error(error);
      return;
    }

    toast.success('Richiesta di valutazione inviata con successo!');
    setPraticaEsiste(true);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'd MMMM yyyy', { locale: it });
    } catch {
      return 'N/A';
    }
  };

  // Combina pdf_url e pdf_urls
  const allPdfUrls = [
    ...(bando?.pdf_url ? [bando.pdf_url] : []),
    ...(bando?.pdf_urls || [])
  ].filter((url, idx, arr) => arr.indexOf(url) === idx); // Rimuovi duplicati

  if (loading) {
    return (
      <AppLayout customHeader={<BandiHeader />}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!bando) {
    return (
      <AppLayout customHeader={<BandiHeader />}>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Bando non trovato</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout customHeader={<BandiHeader />}>
      <div className="bg-primary -mx-6 -my-8 pb-24">
        {/* Breadcrumb */}
        <div className="px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList className="text-white/70">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-white/70 hover:text-white">
                  <Link to="/app/dashboard" className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span>Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/50" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-white/70 hover:text-white">
                  <Link to="/app/bandi" className="flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Finanza Agevolata</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/50" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white font-medium truncate max-w-[150px]">
                  {bando.titolo}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Matching Criteria Card */}
        <div className="bg-white rounded-t-[40px] -mt-8 relative z-10 px-6 pt-8">
          <MatchingCriteriaCard
            criteriVisivi={criteriVisivi}
            compatibilitaPercentuale={compatibility?.compatibilita_percentuale || 0}
            criteriSoddisfatti={compatibility?.criteri_soddisfatti || 0}
            criteriTotali={compatibility?.criteri_totali || 0}
            compatibile={compatibility?.compatibile ?? true}
            datiMancanti={datiMancanti}
          />
        </div>
        
        <BandoDettaglioCard
          nomeBando={bando.titolo}
          dataInizio={formatDate(bando.data_apertura)}
          dataFine={formatDate(bando.data_chiusura)}
          descrizione={bando.descrizione}
          ente={bando.ente}
          tipoAgevolazione={bando.tipo_agevolazione}
          importoMinimo={bando.importo_minimo}
          importoMassimo={bando.importo_massimo}
          tipoAzienda={bando.tipo_azienda}
          numeroDipendenti={bando.numero_dipendenti}
          costituzioneSocieta={bando.costituzione_societa}
          zoneApplicabilita={bando.zone_applicabilita}
          investimentiFinanziabili={bando.investimenti_finanziabili}
          speseAmmissibili={bando.spese_ammissibili}
          note={bando.note}
          linkBando={bando.link_bando}
          pdfUrls={allPdfUrls}
          praticaEsiste={praticaEsiste}
          submitting={submitting}
          onRichiestaValutazione={handleRichiestaValutazione}
          hideRequisitiSection={true}
        />
      </div>
    </AppLayout>
  );
};

export default AppBandoDettaglio;
