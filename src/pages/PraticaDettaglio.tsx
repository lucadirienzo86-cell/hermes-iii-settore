import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePratiche } from '@/hooks/usePratiche';
import Sidebar from '@/components/Sidebar';
import { PraticaDocumenti } from '@/components/PraticaDocumenti';
import { PraticaLog } from '@/components/PraticaLog';
import { ModificaStatoPraticaDialog } from '@/components/ModificaStatoPraticaDialog';
import { ChatMessage } from '@/components/app/ChatMessage';
import { ChatDivider } from '@/components/app/ChatDivider';
import { ChatFooter } from '@/components/app/ChatFooter';
import { usePraticaChat } from '@/hooks/usePraticaChat';
import { StatoPraticaBadge } from '@/components/StatoPraticaBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  MessageSquare, 
  FolderOpen, 
  History,
  AlertTriangle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { registraLogPratica } from '@/hooks/usePraticaLog';

const PraticaDettaglio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { aggiornaStato } = usePratiche();
  const { messaggi, loading: loadingChat, inviaMessaggio, segnaComeLetti } = usePraticaChat(id || '');
  const [pratica, setPratica] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showModificaStato, setShowModificaStato] = useState(false);
  const [gestorePraticheId, setGestorePraticheId] = useState<string | null>(null);
  const [storicoOpen, setStoricoOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const firstUnreadIndex = messaggi.findIndex(msg => 
    msg.sender_type === 'azienda' && !msg.letto
  );

  // Check if user can modify status
  const canModifyStato = profile?.role === 'admin' || 
    (profile?.role === 'gestore_pratiche' && pratica?.gestore_pratiche_id === gestorePraticheId);

  useEffect(() => {
    if (id) {
      loadPratica();
      segnaComeLetti();
    }
  }, [id]);

  // Fetch gestorePraticheId for gestore_pratiche users
  useEffect(() => {
    const fetchGestorePraticheId = async () => {
      if (profile?.role === 'gestore_pratiche' && profile?.id) {
        const { data } = await supabase
          .from('gestori_pratiche')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        
        if (data) {
          setGestorePraticheId(data.id);
        }
      }
    };
    fetchGestorePraticheId();
  }, [profile]);

  useEffect(() => {
    scrollToBottom();
  }, [messaggi]);

  const loadPratica = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('pratiche')
      .select(`
        *,
        bandi!pratiche_bando_id_fkey(titolo),
        aziende(ragione_sociale, partita_iva, profile_id),
        gestori_pratiche(nome, cognome)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setPratica(data);
    }
    setLoading(false);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleInviaMessaggio = async (message: string) => {
    if (!id || !profile) return;
    
    setSending(true);

    try {
      await inviaMessaggio(message);
      
      // Registra log
      await registraLogPratica(
        id,
        profile.id,
        profile.role || 'unknown',
        'messaggio',
        { anteprima: message.substring(0, 50) }
      );
    } catch (error) {
      toast.error("Errore durante l'invio del messaggio");
    } finally {
      setSending(false);
    }
  };

  const getTipoUtente = () => {
    if (profile?.role === 'azienda') return 'azienda';
    if (profile?.role === 'gestore') return 'gestore';
    if (profile?.role === 'editore') return 'editore';
    if (profile?.role === 'gestore_pratiche') return 'gestore_pratiche';
    if (profile?.role === 'docente') return 'docente';
    return 'admin';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!pratica) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Pratica non trovata</h2>
            <Button onClick={() => navigate('/pratiche')}>Torna alle pratiche</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="bg-card border-b p-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/pratiche')}
              className="p-2 hover:bg-muted rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{pratica.titolo}</h1>
                <StatoPraticaBadge 
                  stato={pratica.stato} 
                  clickable={canModifyStato}
                  onClick={() => canModifyStato && setShowModificaStato(true)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{pratica.aziende?.ragione_sociale}</span>
              <span className="text-muted-foreground">({pratica.aziende?.partita_iva})</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>{pratica.bandi?.titolo || 'Nessun bando'}</span>
            </div>
            {pratica.gestori_pratiche && (
              <div className="flex items-center gap-2 text-muted-foreground">
                Gestore: {pratica.gestori_pratiche.nome} {pratica.gestori_pratiche.cognome}
              </div>
            )}
          </div>
        </div>

        {/* Banner avviso se l'azienda non ha account */}
        {pratica && !pratica.aziende?.profile_id && (
          <Alert variant="destructive" className="mx-6 mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Questa azienda non ha ancora un account. I messaggi non saranno visibili fino a quando non si registrerà.
            </AlertDescription>
          </Alert>
        )}

        {/* Layout 2 colonne: Chat + Documenti */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Colonna Sinistra - Chat (2/3) */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-[500px]">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="py-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="w-5 h-5" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                  {loadingChat ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : messaggi.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nessun messaggio. Inizia la conversazione!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messaggi.map((msg, index) => {
                        const isUser = msg.sender_type === getTipoUtente();
                        const showDivider = firstUnreadIndex !== -1 && index === firstUnreadIndex;

                        return (
                          <div key={msg.id}>
                            {showDivider && <ChatDivider />}
                            <ChatMessage
                              message={msg.message}
                              isUser={isUser}
                              allegati={msg.allegati}
                              senderName={isUser ? 'Tu' : (msg.sender?.nome || msg.sender_type === 'azienda' ? 'Azienda' : 'Admin')}
                              timestamp={msg.created_at}
                            />
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </CardContent>
                <div className="border-t p-4">
                  <ChatFooter 
                    onSendMessage={handleInviaMessaggio} 
                    disabled={sending}
                    praticaId={id || ''}
                    tipoUtente={getTipoUtente()}
                  />
                </div>
              </Card>
            </div>

            {/* Colonna Destra - Documenti + Storico (1/3) */}
            <div className="flex flex-col gap-6 h-full lg:order-last order-first">
              {/* Documenti */}
              <Card className="flex-1">
                <CardHeader className="py-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderOpen className="w-5 h-5" />
                    Documenti
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <PraticaDocumenti praticaId={id || ''} />
                </CardContent>
              </Card>

              {/* Storico Attività - Collapsible */}
              <Collapsible open={storicoOpen} onOpenChange={setStoricoOpen}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <History className="w-5 h-5" />
                          Storico attività
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${storicoOpen ? 'rotate-180' : ''}`} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-4 pt-0">
                      <PraticaLog praticaId={id || ''} />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          </div>
        </div>

        {/* Dialog Modifica Stato */}
        <ModificaStatoPraticaDialog
          pratica={pratica}
          open={showModificaStato}
          onOpenChange={setShowModificaStato}
          onSave={async (praticaId, nuovoStato, note) => {
            const success = await aggiornaStato(praticaId, nuovoStato, note);
            if (success) {
              await loadPratica();
            }
            return success;
          }}
          canModifyStato={profile?.role === 'admin' || profile?.role === 'gestore_pratiche'}
          isGestorePratiche={profile?.role === 'gestore_pratiche'}
          gestorePraticheId={gestorePraticheId}
        />
      </main>
    </div>
  );
};

export default PraticaDettaglio;
