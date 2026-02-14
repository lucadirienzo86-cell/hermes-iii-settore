import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { registraLogPratica } from './usePraticaLog';
import { useAuth } from './useAuth';

export interface Pratica {
  id: string;
  azienda_id: string;
  bando_id?: string;
  gestore_pratiche_id?: string | null;
  stato: string;
  created_at: string;
  updated_at: string;
  aziende?: {
    ragione_sociale: string;
    partita_iva: string;
    profile_id: string | null;
  };
  bandi?: {
    titolo: string;
    data_chiusura: string;
  };
  gestori?: {
    nome: string;
    cognome: string;
  };
  gestori_pratiche?: {
    nome: string;
    cognome: string;
  } | null;
}

export const STATI_PRATICHE = [
  'richiesta',
  'presa_in_carico',
  'documenti_mancanti',
  'in_corso',
  'accettata',
  'rifiutata',
  'in_erogazione',
  'erogata',
] as const;

export type StatoPratica = typeof STATI_PRATICHE[number];

export const usePratiche = (aziendaId?: string) => {
  const { profile } = useAuth();
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPratiche();
  }, [aziendaId]);

  const loadPratiche = async () => {
    try {
      let query = supabase
        .from('pratiche')
        .select(`
          *,
          aziende(ragione_sociale, partita_iva, profile_id),
          bandi(titolo, data_chiusura),
          gestori_pratiche(nome, cognome)
        `);

      if (aziendaId) {
        query = query.eq('azienda_id', aziendaId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      setPratiche(data as any);
    } catch (error: any) {
      console.error('Errore caricamento pratiche:', error);
      toast.error('Errore nel caricamento delle pratiche');
    } finally {
      setLoading(false);
    }
  };

  const richiediPratica = async (bandoId: string, aziendaId: string) => {
    try {
      // Verifica se esiste già una pratica
      const { data: existing } = await supabase
        .from('pratiche')
        .select('id')
        .eq('azienda_id', aziendaId)
        .eq('bando_id', bandoId)
        .maybeSingle();

      if (existing) {
        toast.error('Pratica già esistente per questo bando');
        return false;
      }

      // Crea pratica con stato "richiesta"
      const { data: newPratica, error } = await supabase
        .from('pratiche')
        .insert({
          azienda_id: aziendaId,
          bando_id: bandoId,
          titolo: 'Nuova Pratica',
          stato: 'richiesta',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Registra log
      if (newPratica && profile?.id) {
        await registraLogPratica(
          newPratica.id,
          profile.id,
          profile.role || 'unknown',
          'creazione',
          { bando_id: bandoId }
        );
      }

      toast.success('Pratica richiesta con successo');
      await loadPratiche();
      return true;
    } catch (error: any) {
      console.error('Errore creazione pratica:', error);
      toast.error('Errore nella creazione della pratica');
      return false;
    }
  };

  const prendiInCarico = async (praticaId: string, gestorePraticheId: string) => {
    try {
      // Get current state before update
      const { data: currentPratica } = await supabase
        .from('pratiche')
        .select('stato')
        .eq('id', praticaId)
        .single();

      const { error } = await supabase
        .from('pratiche')
        .update({
          gestore_pratiche_id: gestorePraticheId,
          stato: 'presa_in_carico',
          updated_at: new Date().toISOString()
        })
        .eq('id', praticaId)
        .eq('stato', 'richiesta');

      if (error) throw error;

      // Registra log
      if (profile?.id) {
        await registraLogPratica(
          praticaId,
          profile.id,
          profile.role || 'unknown',
          'presa_in_carico',
          { 
            stato_precedente: currentPratica?.stato || 'richiesta',
            stato_nuovo: 'presa_in_carico',
            gestore_pratiche_id: gestorePraticheId 
          }
        );
      }

      toast.success('Pratica presa in carico');
      await loadPratiche();
      return true;
    } catch (error: any) {
      console.error('Errore presa in carico pratica:', error);
      toast.error('Errore nella presa in carico della pratica');
      return false;
    }
  };

  const aggiornaStato = async (praticaId: string, nuovoStato: string, note?: string) => {
    try {
      // Get current state before update
      const { data: currentPratica } = await supabase
        .from('pratiche')
        .select('stato')
        .eq('id', praticaId)
        .single();

      // Note: la tabella pratiche non ha colonna 'note', le note vanno solo nel log
      const updateData = { 
        stato: nuovoStato,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('pratiche')
        .update(updateData)
        .eq('id', praticaId);

      if (error) throw error;

      // Registra log con le note (le note sono salvate solo nel log, non nella tabella pratiche)
      if (profile?.id) {
        await registraLogPratica(
          praticaId,
          profile.id,
          profile.role || 'unknown',
          'cambio_stato',
          { 
            stato_precedente: currentPratica?.stato || 'unknown',
            stato_nuovo: nuovoStato,
            note: note 
          }
        );
      }

      toast.success('Stato pratica aggiornato');
      await loadPratiche();
      return true;
    } catch (error: any) {
      console.error('Errore aggiornamento pratica:', error);
      toast.error('Errore nell\'aggiornamento della pratica');
      return false;
    }
  };

  return { pratiche, loading, loadPratiche, richiediPratica, prendiInCarico, aggiornaStato };
};
