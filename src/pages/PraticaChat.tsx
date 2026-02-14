import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePraticaChat } from '@/hooks/usePraticaChat';
import Sidebar from '@/components/Sidebar';
import { ChatMessage } from '@/components/app/ChatMessage';
import { ChatDivider } from '@/components/app/ChatDivider';
import { ChatFooter } from '@/components/app/ChatFooter';
import { toast } from 'sonner';
import { ArrowLeft, Building2, FileText, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PraticaChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { messaggi, loading, inviaMessaggio, segnaComeLetti } = usePraticaChat(id || '');
  const [pratica, setPratica] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trova l'indice del primo messaggio non letto
  const firstUnreadIndex = messaggi.findIndex(msg => 
    msg.sender_type === 'azienda' && !msg.letto
  );

  useEffect(() => {
    if (id) {
      loadPratica();
      segnaComeLetti();
    }
  }, [id]);

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
        aziende(ragione_sociale, partita_iva, profile_id)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setPratica(data);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInviaMessaggio = async (message: string) => {
    setSending(true);

    try {
      await inviaMessaggio(message);
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
    return 'admin';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/pratiche')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Chat Pratica</h1>
            <div className="ml-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate('/pratiche')}
              >
                <X className="w-4 h-4 mr-2" />
                Chiudi
              </Button>
            </div>
          </div>
          
          {pratica && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{pratica.aziende?.ragione_sociale}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>{pratica.bandi?.titolo || 'Finanziamento'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Banner avviso se l'azienda non ha account */}
        {pratica && !pratica.aziende?.profile_id && (
          <Alert variant="destructive" className="mx-6 mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Questa azienda non ha ancora un account. I messaggi non saranno visibili fino a quando non si registrerà.
            </AlertDescription>
          </Alert>
        )}

        {/* Area messaggi */}
        <div className="flex-1 overflow-y-auto p-6 pb-32">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : messaggi.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nessun messaggio. Inizia la conversazione!
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
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
        </div>

        {/* Footer con input */}
        <div className="border-t bg-white">
          <div className="max-w-4xl mx-auto">
            <ChatFooter 
              onSendMessage={handleInviaMessaggio} 
              disabled={sending}
              praticaId={id || ''}
              tipoUtente={getTipoUtente()}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PraticaChat;
