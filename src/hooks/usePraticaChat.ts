import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type SenderType = 'azienda' | 'admin' | 'gestore' | 'editore' | 'docente' | 'gestore_pratiche';

interface Allegato {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

interface Messaggio {
  id: string;
  pratica_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  letto: boolean;
  created_at: string;
  sender?: {
    nome: string;
    email: string;
  };
  allegati?: Allegato[];
}

export const usePraticaChat = (praticaId: string) => {
  const { profile } = useAuth();
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [loading, setLoading] = useState(true);

  // Determina il tipo di sender basandosi sul ruolo dell'utente
  const getSenderType = (): SenderType | null => {
    if (!profile?.role) return null; // Profilo non ancora caricato
    if (profile.role === 'azienda') return 'azienda';
    if (profile.role === 'gestore') return 'gestore';
    if (profile.role === 'docente') return 'docente';
    if (profile.role === 'gestore_pratiche') return 'gestore_pratiche';
    if (profile.role === 'editore') return 'editore';
    return 'admin';
  };

  useEffect(() => {
    if (praticaId && profile?.role) {
      loadMessaggi();
    }
    
    // Realtime subscription - reload all messages when new one arrives
    const channel = supabase
      .channel(`pratica-${praticaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pratiche_messaggi',
          filter: `pratica_id=eq.${praticaId}`
        },
        () => {
          // Reload all messages to include attachments
          loadMessaggi();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [praticaId, profile?.role]);

  const loadMessaggi = async () => {
    const { data, error } = await supabase
      .from('pratiche_messaggi')
      .select('*, sender:profiles(nome, email)')
      .eq('pratica_id', praticaId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Carica i documenti della pratica
      const { data: documenti } = await supabase
        .from('pratiche_documenti')
        .select('id, file_name, file_path, mime_type, file_size, created_at')
        .eq('pratica_id', praticaId)
        .order('created_at', { ascending: true });

      // Raggruppa documenti per timestamp (circa 5 minuti di tolleranza)
      const messaggiConAllegati = data.map((msg: any) => {
        const msgTime = new Date(msg.created_at).getTime();
        const allegati = documenti?.filter((doc) => {
          const docTime = new Date(doc.created_at).getTime();
          return Math.abs(msgTime - docTime) < 300000; // 5 minuti
        }) || [];
        
        return { ...msg, allegati };
      });

      setMessaggi(messaggiConAllegati as Messaggio[]);
    }
    setLoading(false);
  };

  const inviaMessaggio = async (testo: string) => {
    const senderType = getSenderType();
    
    if (!senderType || !profile?.id) {
      throw new Error('Profilo non ancora caricato');
    }

    const { error } = await supabase
      .from('pratiche_messaggi')
      .insert({
        pratica_id: praticaId,
        sender_id: profile.id,
        sender_type: senderType,
        message: testo
      });

    if (error) throw error;
  };

  const segnaComeLetti = async () => {
    const senderType = getSenderType();
    
    if (!senderType) return; // Non fare nulla se il profilo non è caricato
    
    // Segna come letti i messaggi non inviati dall'utente corrente
    await supabase
      .from('pratiche_messaggi')
      .update({ letto: true })
      .eq('pratica_id', praticaId)
      .neq('sender_type', senderType)
      .eq('letto', false);
  };

  return { messaggi, loading, inviaMessaggio, segnaComeLetti };
};
