import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AssociazioneTerzoSettore {
  id: string;
  profile_id: string | null;
  denominazione: string;
  tipologia: 'APS' | 'ETS' | 'ODV' | 'Cooperativa' | 'Altro';
  codice_fiscale: string | null;
  partita_iva: string | null;
  stato_runts: 'dichiarato' | 'verificato' | 'non_iscritto';
  numero_iscritti: number;
  attiva: boolean;
  logo_url: string | null;
  email: string | null;
  pec: string | null;
  telefono: string | null;
  indirizzo: string | null;
  comune: string;
  descrizione: string | null;
  data_costituzione: string | null;
  settori_intervento: string[] | null;
  token_invito: string | null;
  data_invito: string | null;
  data_registrazione: string | null;
  created_at: string;
  // New fields for extended management
  stato_albo?: 'precaricata' | 'attiva' | 'non_iscritta' | 'invitata' | 'in_revisione';
  fonte_dato?: 'albo_comunale' | 'registrazione_autonoma';
  campi_completi?: boolean;
  data_iscrizione_albo?: string | null;
  notifica_assessorato?: boolean;
  data_notifica_assessorato?: string | null;
}

export const useAssociazioniTerzoSettore = () => {
  return useQuery({
    queryKey: ['associazioni-terzo-settore'],
    queryFn: async (): Promise<AssociazioneTerzoSettore[]> => {
      const { data, error } = await supabase
        .from('associazioni_terzo_settore')
        .select('*')
        .order('denominazione');
      
      if (error) throw error;
      
      return (data || []).map(a => ({
        ...a,
        tipologia: a.tipologia as AssociazioneTerzoSettore['tipologia'],
        stato_runts: a.stato_runts as AssociazioneTerzoSettore['stato_runts'],
      }));
    },
  });
};

export const useCreateAssociazioneTS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: Partial<AssociazioneTerzoSettore>) => {
      // Generate invite token
      const token = crypto.randomUUID();
      
      const { data: result, error } = await supabase
        .from('associazioni_terzo_settore')
        .insert({
          denominazione: data.denominazione!,
          tipologia: data.tipologia || 'Altro',
          codice_fiscale: data.codice_fiscale,
          partita_iva: data.partita_iva,
          stato_runts: data.stato_runts || 'dichiarato',
          email: data.email,
          pec: data.pec,
          telefono: data.telefono,
          indirizzo: data.indirizzo,
          comune: data.comune || 'Cassino',
          descrizione: data.descrizione,
          settori_intervento: data.settori_intervento,
          token_invito: token,
          data_invito: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associazioni-terzo-settore'] });
      queryClient.invalidateQueries({ queryKey: ['terzo-settore-stats'] });
      toast({ title: 'Associazione creata con successo' });
    },
    onError: (error) => {
      toast({ 
        title: 'Errore', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useUpdateAssociazioneTS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AssociazioneTerzoSettore> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('associazioni_terzo_settore')
        .update({
          denominazione: data.denominazione,
          tipologia: data.tipologia,
          codice_fiscale: data.codice_fiscale,
          partita_iva: data.partita_iva,
          stato_runts: data.stato_runts,
          numero_iscritti: data.numero_iscritti,
          attiva: data.attiva,
          email: data.email,
          pec: data.pec,
          telefono: data.telefono,
          indirizzo: data.indirizzo,
          comune: data.comune,
          descrizione: data.descrizione,
          settori_intervento: data.settori_intervento,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associazioni-terzo-settore'] });
      queryClient.invalidateQueries({ queryKey: ['terzo-settore-stats'] });
      toast({ title: 'Associazione aggiornata' });
    },
    onError: (error) => {
      toast({ 
        title: 'Errore', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};
