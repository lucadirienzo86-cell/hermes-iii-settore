import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { HersCard } from '@/components/app/HersCard';
import { HersBadge } from '@/components/app/HersBadge';
import { HersButton } from '@/components/app/HersButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
  Calendar, 
  Building2, 
  MapPin, 
  Users, 
  Euro, 
  ExternalLink,
  FileText,
  Sparkles,
  Check,
  Home,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Avviso {
  id: string;
  titolo: string;
  descrizione: string | null;
  fondo_id: string;
  numero_avviso: string | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  settore_ateco: string[] | null;
  regioni: string[] | null;
  dimensione_azienda: string[] | null;
  numero_dipendenti: string[] | null;
  badge_formativi: string[] | null;
  tematiche: string[] | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
  link_avviso: string | null;
  pdf_urls: string[] | null;
  note: string | null;
  fondo?: {
    id: string;
    nome: string;
    codice: string | null;
  };
}

const AppFondoDettaglio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [avviso, setAvviso] = useState<Avviso | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExistingPratica, setHasExistingPratica] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAvviso();
    checkExistingPratica();
  }, [id, profile]);

  const loadAvviso = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('avvisi_fondi')
      .select(`
        *,
        fondo:fondi_interprofessionali(id, nome, codice)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error loading avviso:', error);
      toast.error('Errore nel caricamento');
      navigate('/app/fondi');
      return;
    }
    
    setAvviso(data as unknown as Avviso);
    setLoading(false);
  };

  const checkExistingPratica = async () => {
    if (!profile?.id || !id) return;
    
    // Get azienda id
    const { data: azienda } = await supabase
      .from('aziende')
      .select('id')
      .eq('profile_id', profile.id)
      .single();
    
    if (!azienda) return;
    
    // Check for existing pratica with this avviso (stored in note or description)
    const { data: pratiche } = await supabase
      .from('pratiche')
      .select('id')
      .eq('azienda_id', azienda.id)
      .ilike('descrizione', `%${id}%`);
    
    setHasExistingPratica((pratiche?.length || 0) > 0);
  };

  const handleRichiestaInfo = async () => {
    if (!profile?.id || !avviso) return;
    
    setCreating(true);
    
    try {
      // Get azienda
      const { data: azienda } = await supabase
        .from('aziende')
        .select('id')
        .eq('profile_id', profile.id)
        .single();
      
      if (!azienda) {
        toast.error('Dati azienda non trovati');
        return;
      }
      
      // Create pratica
      const { data: pratica, error } = await supabase
        .from('pratiche')
        .insert({
          azienda_id: azienda.id,
          titolo: `Richiesta info: ${avviso.titolo}`,
          descrizione: `Richiesta informazioni per avviso ${avviso.numero_avviso || avviso.id} - ${avviso.fondo?.nome}`,
          stato: 'bozza',
          created_by: profile.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Richiesta inviata con successo!');
      navigate(`/app/pratiche/${pratica.id}/chat`);
      
    } catch (error) {
      console.error('Error creating pratica:', error);
      toast.error('Errore nell\'invio della richiesta');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), 'd MMMM yyyy', { locale: it });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <AppLayout showBack>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-1/2 rounded-xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  if (!avviso) return null;

  return (
    <AppLayout showBack>
      <div className="space-y-6 pb-24">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/app/dashboard" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span>Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/app/fondi" className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Formazione Finanziata</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[150px]">
                {avviso.titolo}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {avviso.titolo}
              </h1>
              {avviso.fondo && (
                <p className="text-sm text-primary font-medium mt-1">
                  {avviso.fondo.nome}
                </p>
              )}
            </div>
          </div>
          
          {avviso.numero_avviso && (
            <HersBadge variant="gray">
              Avviso {avviso.numero_avviso}
            </HersBadge>
          )}
        </div>

        {/* Quick Info */}
        <HersCard>
          <div className="grid grid-cols-2 gap-4">
            {avviso.data_apertura && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Apertura</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(avviso.data_apertura)}
                  </p>
                </div>
              </div>
            )}
            
            {avviso.data_chiusura && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Scadenza</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(avviso.data_chiusura)}
                  </p>
                </div>
              </div>
            )}
            
            {(avviso.importo_minimo || avviso.importo_massimo) && (
              <div className="flex items-center gap-3 col-span-2">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Euro className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Importo</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(avviso.importo_minimo)} - {formatCurrency(avviso.importo_massimo)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </HersCard>

        {/* Descrizione */}
        {avviso.descrizione && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Descrizione</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {avviso.descrizione}
            </p>
          </div>
        )}

        {/* Requisiti */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Requisiti</h3>
          
          <HersCard>
            <div className="space-y-4">
              {avviso.regioni && avviso.regioni.length > 0 && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Regioni</p>
                    <p className="text-sm text-muted-foreground">
                      {avviso.regioni.join(', ')}
                    </p>
                  </div>
                </div>
              )}
              
              {avviso.dimensione_azienda && avviso.dimensione_azienda.length > 0 && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Dimensione azienda</p>
                    <p className="text-sm text-muted-foreground">
                      {avviso.dimensione_azienda.join(', ')}
                    </p>
                  </div>
                </div>
              )}
              
              {avviso.numero_dipendenti && avviso.numero_dipendenti.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Dipendenti</p>
                    <p className="text-sm text-muted-foreground">
                      {avviso.numero_dipendenti.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </HersCard>
        </div>

        {/* Tematiche */}
        {avviso.tematiche && avviso.tematiche.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Tematiche</h3>
            <div className="flex flex-wrap gap-2">
              {avviso.tematiche.map((tema, idx) => (
                <HersBadge 
                  key={idx} 
                  variant={idx % 3 === 0 ? 'yellow' : idx % 3 === 1 ? 'pink' : 'gray'}
                >
                  {tema}
                </HersBadge>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="space-y-3">
          {avviso.link_avviso && (
            <a 
              href={avviso.link_avviso}
              target="_blank"
              rel="noopener noreferrer"
              className="hers-card flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Pagina ufficiale</p>
                <p className="text-sm text-muted-foreground">Apri nel browser</p>
              </div>
            </a>
          )}
          
          {avviso.pdf_urls && avviso.pdf_urls.length > 0 && (
            <a 
              href={avviso.pdf_urls[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="hers-card flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Documentazione</p>
                <p className="text-sm text-muted-foreground">Scarica PDF</p>
              </div>
            </a>
          )}
        </div>

        {/* Fixed CTA */}
        <div className="fixed bottom-20 left-0 right-0 px-5 max-w-lg mx-auto">
          <HersButton
            onClick={handleRichiestaInfo}
            variant="primary"
            fullWidth
            disabled={hasExistingPratica || creating}
            icon={hasExistingPratica ? Check : undefined}
          >
            {hasExistingPratica 
              ? 'Richiesta già inviata' 
              : creating 
                ? 'Invio in corso...' 
                : 'Richiedi informazioni'}
          </HersButton>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppFondoDettaglio;