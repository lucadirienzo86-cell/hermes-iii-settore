import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LogEntry {
  id: string;
  pratica_id: string;
  user_id: string | null;
  user_type: string;
  azione: string;
  dettagli: Record<string, any> | null;
  created_at: string;
  user_name?: string;
}

export const usePraticaLog = (praticaId: string) => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!praticaId) return;

    const { data, error } = await supabase
      .from('pratiche_log')
      .select('*')
      .eq('pratica_id', praticaId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch user names for each log entry
      const logsWithNames = await Promise.all(
        data.map(async (log: any) => {
          if (log.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome, cognome, email')
              .eq('id', log.user_id)
              .maybeSingle();
            
            const userName = profileData 
              ? `${profileData.nome || ''} ${profileData.cognome || ''}`.trim() || profileData.email
              : 'Utente sconosciuto';
            
            return { ...log, user_name: userName };
          }
          return { ...log, user_name: 'Sistema' };
        })
      );
      
      setLogs(logsWithNames);
    }
    setLoading(false);
  }, [praticaId]);

  useEffect(() => {
    loadLogs();

    // Realtime subscription
    const channel = supabase
      .channel(`pratica-log-${praticaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pratiche_log',
          filter: `pratica_id=eq.${praticaId}`
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [praticaId, loadLogs]);

  const registraAzione = useCallback(async (
    azione: string, 
    dettagli?: Record<string, any>
  ) => {
    if (!profile?.id || !praticaId) return;

    const { error } = await supabase
      .from('pratiche_log')
      .insert({
        pratica_id: praticaId,
        user_id: profile.id,
        user_type: profile.role || 'unknown',
        azione,
        dettagli: dettagli || null
      });

    if (error) {
      console.error('Error registering log:', error);
    }
  }, [profile?.id, profile?.role, praticaId]);

  return { logs, loading, registraAzione, reload: loadLogs };
};

// Helper function to register log from outside the hook context
export const registraLogPratica = async (
  praticaId: string,
  userId: string,
  userType: string,
  azione: string,
  dettagli?: Record<string, any>
) => {
  const { error } = await supabase
    .from('pratiche_log')
    .insert({
      pratica_id: praticaId,
      user_id: userId,
      user_type: userType,
      azione,
      dettagli: dettagli || null
    });

  if (error) {
    console.error('Error registering log:', error);
  }
};
