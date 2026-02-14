import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePraticaChat } from '@/hooks/usePraticaChat';
import { HersChatHeader } from '@/components/app/ChatHeader';
import { HersChatMessage } from '@/components/app/ChatMessage';
import { HersChatFooter } from '@/components/app/ChatFooter';
import { ChatDivider } from '@/components/app/ChatDivider';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const AppPraticaChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { messaggi, loading, inviaMessaggio, segnaComeLetti } = usePraticaChat(id || '');
  const [pratica, setPratica] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trova l'indice del primo messaggio non letto
  const firstUnreadIndex = messaggi.findIndex(msg => 
    msg.sender_type !== 'azienda' && !msg.letto
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
      .select('*')
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

  const getStatoDisplay = (stato: string) => {
    const statiMap: Record<string, string> = {
      'bozza': 'In attesa',
      'in_valutazione': 'In revisione',
      'in_lavorazione': 'In lavorazione',
      'approvata': 'Approvata',
      'completata': 'Completata',
      'annullata': 'Annullata',
    };
    return statiMap[stato] || stato;
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <HersChatHeader 
        titolo={pratica?.titolo || 'Caricamento...'} 
        stato={pratica ? getStatoDisplay(pratica.stato) : undefined}
        onBack={() => navigate('/app/pratiche')}
      />

      {/* Messages Area */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 px-4 py-4 pb-24 overflow-y-auto"
      >
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4 rounded-3xl" />
            <Skeleton className="h-12 w-2/3 rounded-3xl ml-auto" />
            <Skeleton className="h-20 w-3/4 rounded-3xl" />
          </div>
        ) : messaggi.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Nessun messaggio ancora.<br />
              Inizia la conversazione!
            </p>
          </div>
        ) : (
          <>
            {messaggi.map((msg, index) => {
              const isAzienda = msg.sender_type === 'azienda';
              const showDivider = firstUnreadIndex !== -1 && index === firstUnreadIndex;

              return (
                <div key={msg.id}>
                  {showDivider && <ChatDivider />}
                  <HersChatMessage
                    message={msg.message}
                    isUser={isAzienda}
                    allegati={msg.allegati}
                    senderName={isAzienda ? undefined : (msg.sender?.nome || 'Sonyc')}
                    timestamp={msg.created_at}
                    isRead={msg.letto}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </motion.div>

      {/* Footer Input */}
      <HersChatFooter 
        onSendMessage={handleInviaMessaggio} 
        disabled={sending}
        praticaId={id || ''}
      />
    </div>
  );
};

export default AppPraticaChat;