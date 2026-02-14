import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subYears, parseISO, isBefore, startOfDay } from "date-fns";

export const MASSIMALE_DEMINIMIS = 300000;

export interface AziendaDeMinimis {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
  regione?: string;
  dimensione_azienda?: string;
  totaleDeMinimis3Anni: number;
  totaleStorico: number;
  percentualePlafond: number;
  ultimoAggiornamento: string | null;
  numeroAiuti: number;
  hasWarning: boolean; // > 80%
  hasDanger: boolean;  // > 95%
  hasRnaData: boolean;
}

interface AiutoRna {
  id: string;
  azienda_id: string;
  data_concessione: string | null;
  importo_agevolazione: number | null;
  updated_at: string | null;
  created_at: string | null;
}

export const useAziendeDeMinimis = () => {
  const { profile } = useAuth();
  const [aziende, setAziende] = useState<AziendaDeMinimis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totaleAziende: 0,
    aziendeConRna: 0,
    aziendeWarning: 0,
    aziendeDanger: 0,
    totaleDeMinimisUtilizzato: 0,
  });

  const loadData = async () => {
    if (!profile?.id || !profile?.role) return;

    setLoading(true);
    setError(null);

    try {
      // Carica le aziende in base al ruolo
      let aziendeQuery = supabase
        .from('aziende')
        .select('id, ragione_sociale, partita_iva, regione, dimensione_azienda');

      if (profile.role === 'gestore') {
        // Trova il gestore_id
        const { data: gestoreData } = await supabase
          .from('gestori')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (gestoreData) {
          aziendeQuery = aziendeQuery.eq('inserita_da_gestore_id', gestoreData.id);
        }
      } else if (profile.role === 'docente') {
        // Trova il docente_id
        const { data: docenteData } = await supabase
          .from('docenti')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (docenteData) {
          aziendeQuery = aziendeQuery.eq('inserita_da_docente_id', docenteData.id);
        }
      }
      // Admin vede tutto - nessun filtro

      const { data: aziendeData, error: aziendeError } = await aziendeQuery;

      if (aziendeError) throw aziendeError;

      if (!aziendeData || aziendeData.length === 0) {
        setAziende([]);
        setSummary({
          totaleAziende: 0,
          aziendeConRna: 0,
          aziendeWarning: 0,
          aziendeDanger: 0,
          totaleDeMinimisUtilizzato: 0,
        });
        setLoading(false);
        return;
      }

      // Carica tutti gli aiuti RNA per le aziende trovate
      const aziendeIds = aziendeData.map(a => a.id);
      const { data: aiutiData, error: aiutiError } = await supabase
        .from('aziende_aiuti_rna')
        .select('id, azienda_id, data_concessione, importo_agevolazione, updated_at, created_at')
        .in('azienda_id', aziendeIds);

      if (aiutiError) throw aiutiError;

      // Raggruppa aiuti per azienda
      const aiutiByAzienda = new Map<string, AiutoRna[]>();
      aiutiData?.forEach(aiuto => {
        const existing = aiutiByAzienda.get(aiuto.azienda_id) || [];
        existing.push(aiuto);
        aiutiByAzienda.set(aiuto.azienda_id, existing);
      });

      // Calcola de minimis per ogni azienda
      const oggi = startOfDay(new Date());
      const treAnniFa = subYears(oggi, 3);

      let totaleDeMinimisGlobale = 0;
      let aziendeConRnaCount = 0;
      let aziendeWarningCount = 0;
      let aziendeDangerCount = 0;

      const aziendeProcessed: AziendaDeMinimis[] = aziendeData.map(azienda => {
        const aiuti = aiutiByAzienda.get(azienda.id) || [];
        const hasRnaData = aiuti.length > 0;

        if (hasRnaData) aziendeConRnaCount++;

        let totale3Anni = 0;
        let totaleStorico = 0;
        let ultimoAggiornamento: string | null = null;

        aiuti.forEach(aiuto => {
          const importo = aiuto.importo_agevolazione || 0;
          
          // Aggiorna data ultimo aggiornamento
          const updateDate = aiuto.updated_at || aiuto.created_at;
          if (updateDate && (!ultimoAggiornamento || updateDate > ultimoAggiornamento)) {
            ultimoAggiornamento = updateDate;
          }

          // Calcola se è negli ultimi 3 anni
          if (aiuto.data_concessione) {
            try {
              const dataAiuto = parseISO(aiuto.data_concessione);
              if (isBefore(dataAiuto, treAnniFa)) {
                totaleStorico += importo;
              } else {
                totale3Anni += importo;
              }
            } catch {
              totale3Anni += importo;
            }
          } else {
            totale3Anni += importo;
          }
        });

        const percentuale = Math.round((totale3Anni / MASSIMALE_DEMINIMIS) * 100);
        const hasWarning = percentuale > 80;
        const hasDanger = percentuale > 95;

        if (hasWarning) aziendeWarningCount++;
        if (hasDanger) aziendeDangerCount++;
        totaleDeMinimisGlobale += totale3Anni;

        return {
          id: azienda.id,
          ragione_sociale: azienda.ragione_sociale,
          partita_iva: azienda.partita_iva,
          regione: azienda.regione || undefined,
          dimensione_azienda: azienda.dimensione_azienda || undefined,
          totaleDeMinimis3Anni: totale3Anni,
          totaleStorico,
          percentualePlafond: percentuale,
          ultimoAggiornamento,
          numeroAiuti: aiuti.length,
          hasWarning,
          hasDanger,
          hasRnaData,
        };
      });

      // Ordina per percentuale decrescente
      aziendeProcessed.sort((a, b) => b.percentualePlafond - a.percentualePlafond);

      setAziende(aziendeProcessed);
      setSummary({
        totaleAziende: aziendeProcessed.length,
        aziendeConRna: aziendeConRnaCount,
        aziendeWarning: aziendeWarningCount,
        aziendeDanger: aziendeDangerCount,
        totaleDeMinimisUtilizzato: totaleDeMinimisGlobale,
      });
    } catch (err: any) {
      console.error('Errore caricamento dati de minimis:', err);
      setError(err.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id, profile?.role]);

  return {
    aziende,
    loading,
    error,
    summary,
    reload: loadData,
  };
};
