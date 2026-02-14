import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/layouts/AppLayout';
import { HersCard } from '@/components/app/HersCard';
import { HersPraticaCard } from '@/components/app/HersPraticaCard';
import { HersBadge } from '@/components/app/HersBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Sparkles } from 'lucide-react';

const AppPratiche = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [pratiche, setPratiche] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadPratiche();
  }, [profile]);

  // Realtime subscription per aggiornare contatori messaggi
  useEffect(() => {
    if (pratiche.length === 0) return;

    const channel = supabase
      .channel('app-pratiche-messaggi-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pratiche_messaggi'
        },
        async (payload) => {
          if (payload.new && 'pratica_id' in payload.new) {
            const praticaId = payload.new.pratica_id as string;
            const { count } = await supabase
              .from('pratiche_messaggi')
              .select('*', { count: 'exact', head: true })
              .eq('pratica_id', praticaId)
              .neq('sender_type', 'azienda')
              .eq('letto', false);

            if (count !== null) {
              setUnreadCounts(prev => ({ ...prev, [praticaId]: count }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pratiche]);

  const loadPratiche = async () => {
    if (!profile?.id) return;

    // Get azienda ID first
    const { data: azienda } = await supabase
      .from('aziende')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!azienda) {
      setLoading(false);
      return;
    }

    // Carica pratiche
    const { data, error } = await supabase
      .from('pratiche')
      .select('*')
      .eq('azienda_id', azienda.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setPratiche(data);
      
      // Carica conteggio messaggi non letti per ogni pratica
      data.forEach(async (pratica) => {
        const { count: msgCount } = await supabase
          .from('pratiche_messaggi')
          .select('*', { count: 'exact', head: true })
          .eq('pratica_id', pratica.id)
          .neq('sender_type', 'azienda')
          .eq('letto', false);

        if (msgCount) {
          setUnreadCounts(prev => ({ ...prev, [pratica.id]: msgCount }));
        }
      });
    }
    
    setLoading(false);
  };

  // Count by status - nuovi stati
  const praticheInCorso = pratiche.filter(p => 
    ['richiesta', 'presa_in_carico', 'documenti_mancanti', 'in_corso', 'in_erogazione',
     // Stati legacy
     'bozza', 'in_valutazione', 'in_lavorazione'].includes(p.stato)
  ).length;
  
  const praticheCompletate = pratiche.filter(p => 
    ['accettata', 'erogata',
     // Stati legacy
     'completata', 'approvata'].includes(p.stato)
  ).length;

  // Custom header
  const customHeader = (
    <header className="bg-background sticky top-0 z-40 px-5 py-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Le tue pratiche</h1>
        <p className="text-sm text-muted-foreground">
          Monitora lo stato delle tue richieste
        </p>
      </div>
    </header>
  );

  return (
    <AppLayout customHeader={customHeader}>
      <div className="space-y-6">
        {/* Stats Cards */}
        {!loading && pratiche.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="hers-card text-center py-4">
              <div className="text-3xl font-bold text-primary">
                {praticheInCorso}
              </div>
              <p className="text-sm text-muted-foreground mt-1">In corso</p>
            </div>
            <div className="hers-card text-center py-4">
              <div className="text-3xl font-bold text-success">
                {praticheCompletate}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Completate</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-36 rounded-3xl" />
            ))}
          </div>
        )}

        {/* Lista Pratiche */}
        {!loading && pratiche.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Tutte le pratiche</h2>
              <HersBadge variant="gray">{pratiche.length}</HersBadge>
            </div>
            
            <div className="space-y-3">
              {pratiche.map((pratica) => (
                <HersPraticaCard
                  key={pratica.id}
                  id={pratica.id}
                  titolo={pratica.titolo}
                  stato={pratica.stato}
                  descrizione={pratica.descrizione}
                  createdAt={pratica.created_at}
                  updatedAt={pratica.updated_at}
                  unreadCount={unreadCounts[pratica.id] || 0}
                  onClick={() => navigate(`/app/pratiche/${pratica.id}/chat`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && pratiche.length === 0 && (
          <HersCard className="text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-muted mx-auto flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nessuna pratica
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              Non hai ancora richieste in corso. Sfoglia i fondi disponibili per iniziare.
            </p>
            <button
              onClick={() => navigate('/app/fondi')}
              className="hers-button hers-button-primary inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Sfoglia fondi
            </button>
          </HersCard>
        )}
      </div>
    </AppLayout>
  );
};

export default AppPratiche;
