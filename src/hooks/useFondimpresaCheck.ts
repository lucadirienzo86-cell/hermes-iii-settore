import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FondimpresaResult {
  found: boolean;
  annoAdesione?: number;
  denominazione?: string;
}

type FondimpresaCache = Record<string, FondimpresaResult>;

export const useFondimpresaCheck = (partiteIva: string[]) => {
  const [results, setResults] = useState<FondimpresaCache>({});
  const [loading, setLoading] = useState(false);

  const checkBatch = useCallback(async (pivas: string[]) => {
    if (pivas.length === 0) return;

    // Filter out already checked
    const toCheck = pivas.filter(piva => !results[piva]);
    if (toCheck.length === 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fondimpresa-check', {
        body: { batchPartiteIva: toCheck }
      });

      if (!error && data?.results) {
        setResults(prev => ({ ...prev, ...data.results }));
      }
    } catch (err) {
      console.error('Error checking Fondimpresa batch:', err);
    } finally {
      setLoading(false);
    }
  }, [results]);

  useEffect(() => {
    if (partiteIva.length > 0) {
      checkBatch(partiteIva);
    }
  }, [partiteIva.join(',')]);

  return { results, loading };
};
