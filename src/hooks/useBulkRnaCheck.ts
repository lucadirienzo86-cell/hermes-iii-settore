import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AiutoItem {
  titoloProgetto?: string;
  titoloMisura?: string;
  autoritaConcedente?: string;
  importoAgevolazione?: number | null;
  dataConcessione?: string;
  tipologia?: string;
  strumento?: string;
}

interface AziendaToCheck {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
}

export interface BulkRnaResult {
  total: number;
  processed: number;
  success: number;
  errors: number;
  isLoading: boolean;
  progress: number;
  currentAzienda: string | null;
}

export const useBulkRnaCheck = () => {
  const [result, setResult] = useState<BulkRnaResult>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
    isLoading: false,
    progress: 0,
    currentAzienda: null,
  });

  const cancelledRef = useRef(false);

  const saveRnaToDatabase = async (aziendaId: string, aiutiDeminimis: AiutoItem[]) => {
    try {
      // Prima elimina i vecchi dati
      await supabase
        .from('aziende_aiuti_rna')
        .delete()
        .eq('azienda_id', aziendaId);

      // Inserisci i nuovi dati
      if (aiutiDeminimis.length > 0) {
        const recordsToInsert = aiutiDeminimis.map(aiuto => ({
          azienda_id: aziendaId,
          titolo_progetto: aiuto.titoloProgetto || null,
          titolo_misura: aiuto.titoloMisura || null,
          autorita_concedente: aiuto.autoritaConcedente || null,
          importo_agevolazione: aiuto.importoAgevolazione || null,
          data_concessione: aiuto.dataConcessione || null,
          tipologia: aiuto.tipologia || null,
          strumento: aiuto.strumento || null,
        }));

        const { error } = await supabase
          .from('aziende_aiuti_rna')
          .insert(recordsToInsert);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Errore salvataggio RNA nel database:', error);
      throw error;
    }
  };

  const runBulkCheck = useCallback(async (aziendeIds?: string[], maxDaysOld: number = 7) => {
    cancelledRef.current = false;

    setResult({
      total: 0,
      processed: 0,
      success: 0,
      errors: 0,
      isLoading: true,
      progress: 0,
      currentAzienda: null,
    });

    try {
      // Carica aziende da controllare
      let query = supabase
        .from('aziende')
        .select('id, ragione_sociale, partita_iva')
        .not('partita_iva', 'is', null);

      if (aziendeIds && aziendeIds.length > 0) {
        query = query.in('id', aziendeIds);
      }

      const { data: aziende, error: aziendeError } = await query;

      if (aziendeError) throw aziendeError;

      if (!aziende || aziende.length === 0) {
        toast({
          title: "Nessuna azienda",
          description: "Non ci sono aziende da verificare",
        });
        setResult(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Trova aziende con dati RNA vecchi o mancanti
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDaysOld);

      const { data: recentRnaData } = await supabase
        .from('aziende_aiuti_rna')
        .select('azienda_id, updated_at')
        .gte('updated_at', cutoffDate.toISOString());

      const aziendeConRnaRecente = new Set(recentRnaData?.map(r => r.azienda_id) || []);

      // Filtra aziende che necessitano aggiornamento
      const aziendeToCheck: AziendaToCheck[] = aziende.filter(
        a => !aziendeConRnaRecente.has(a.id) && a.partita_iva
      );

      if (aziendeToCheck.length === 0) {
        toast({
          title: "Dati già aggiornati",
          description: "Tutti i dati RNA sono già aggiornati (ultimi 7 giorni)",
        });
        setResult(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setResult(prev => ({ ...prev, total: aziendeToCheck.length }));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < aziendeToCheck.length; i++) {
        if (cancelledRef.current) {
          toast({
            title: "Operazione annullata",
            description: `Processate ${i} aziende su ${aziendeToCheck.length}`,
          });
          break;
        }

        const azienda = aziendeToCheck[i];

        setResult(prev => ({
          ...prev,
          currentAzienda: azienda.ragione_sociale,
          processed: i,
          progress: Math.round(((i) / aziendeToCheck.length) * 100),
        }));

        try {
          const { data, error } = await supabase.functions.invoke('rna-check', {
            body: { partitaIva: azienda.partita_iva }
          });

          if (error) throw error;

          const rnaResult = data?.rna;

          if (rnaResult?.found && rnaResult?.aiutiDeminimis) {
            await saveRnaToDatabase(azienda.id, rnaResult.aiutiDeminimis);
          } else {
            // Cancella eventuali vecchi dati se non trovato
            await supabase
              .from('aziende_aiuti_rna')
              .delete()
              .eq('azienda_id', azienda.id);
          }

          successCount++;
        } catch (err) {
          console.error(`Errore RNA per ${azienda.ragione_sociale}:`, err);
          errorCount++;
        }

        // Delay per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResult({
        total: aziendeToCheck.length,
        processed: aziendeToCheck.length,
        success: successCount,
        errors: errorCount,
        isLoading: false,
        progress: 100,
        currentAzienda: null,
      });

      toast({
        title: "Verifica RNA completata",
        description: `${successCount} aziende aggiornate, ${errorCount} errori`,
      });
    } catch (err: any) {
      console.error('Errore bulk RNA check:', err);
      toast({
        title: "Errore",
        description: err.message || "Errore durante la verifica RNA",
        variant: "destructive",
      });
      setResult(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const cancelCheck = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return {
    result,
    runBulkCheck,
    cancelCheck,
  };
};
