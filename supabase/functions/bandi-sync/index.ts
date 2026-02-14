import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NormalizedBando {
  titolo: string;
  descrizione: string | null;
  ente: string | null;
  livello: 'UE' | 'NAZ' | 'REG' | 'COM';
  settore_ateco: string[] | null;
  beneficiari: string[] | null;
  data_chiusura: string | null;
  data_apertura: string | null;
  link_bando: string | null;
  fonte: string;
  metodo_acquisizione: 'API' | 'SCRAPING' | 'UPLOAD';
  external_id: string | null;
  zone_applicabilita: string[] | null;
  tipo_azienda: string[] | null;
  importo_minimo: number | null;
  importo_massimo: number | null;
}

interface SyncResult {
  fonte: string;
  metodo: string;
  bandi_trovati: number;
  bandi_nuovi: number;
  bandi_aggiornati: number;
  errori: number;
  dettagli_errori: string[];
}

// ============ SOURCE ADAPTERS ============

/**
 * Scrape ARSIAL bandi (placeholder - real implementation would use Firecrawl/scraping)
 */
async function scrapeArsial(): Promise<NormalizedBando[]> {
  console.log('[bandi-sync] Scraping ARSIAL...');
  
  // In production, this would:
  // 1. Fetch the ARSIAL bandi page
  // 2. Parse the HTML to extract bando information
  // 3. Normalize to our schema
  
  // For now, return empty array - implement with Firecrawl connector when ready
  return [];
}

/**
 * Scrape Regione Lazio bandi
 */
async function scrapeRegioneLazio(): Promise<NormalizedBando[]> {
  console.log('[bandi-sync] Scraping Regione Lazio...');
  
  // Placeholder for Regione Lazio scraping
  return [];
}

/**
 * Fetch EU funding opportunities via API
 */
async function fetchEUBandi(): Promise<NormalizedBando[]> {
  console.log('[bandi-sync] Fetching EU bandi...');
  
  try {
    // EU Funding & Tenders API (simplified example)
    // Real implementation would use: https://api.tech.ec.europa.eu/
    
    // For now, return empty - implement with actual EU API when credentials available
    return [];
  } catch (error) {
    console.error('[bandi-sync] Error fetching EU bandi:', error);
    return [];
  }
}

/**
 * Fetch from Invitalia API
 */
async function fetchInvitalia(): Promise<NormalizedBando[]> {
  console.log('[bandi-sync] Fetching Invitalia bandi...');
  
  // Placeholder for Invitalia API integration
  return [];
}

// ============ SYNC LOGIC ============

async function syncSource(
  supabase: ReturnType<typeof createClient>,
  fonte: string,
  fetchFn: () => Promise<NormalizedBando[]>,
  metodo: 'API' | 'SCRAPING'
): Promise<SyncResult> {
  const result: SyncResult = {
    fonte,
    metodo,
    bandi_trovati: 0,
    bandi_nuovi: 0,
    bandi_aggiornati: 0,
    errori: 0,
    dettagli_errori: [],
  };

  try {
    const bandi = await fetchFn();
    result.bandi_trovati = bandi.length;

    for (const bando of bandi) {
      try {
        // Generate hash for deduplication
        const hashCheck = `${bando.titolo}|${bando.ente}|${bando.link_bando}`.toLowerCase();
        
        // Check if exists
        const { data: existing } = await supabase
          .from('bandi')
          .select('id, hash_dedup')
          .eq('fonte', fonte)
          .eq('external_id', bando.external_id || '')
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('bandi')
            .update({
              ...bando,
              data_sync: new Date().toISOString(),
              attivo: true,
            })
            .eq('id', existing.id);

          if (error) throw error;
          result.bandi_aggiornati++;
        } else {
          // Check for duplicates by hash
          const { data: duplicate } = await supabase
            .from('bandi')
            .select('id')
            .textSearch('hash_dedup', hashCheck)
            .maybeSingle();

          if (!duplicate) {
            // Insert new
            const { error } = await supabase
              .from('bandi')
              .insert({
                ...bando,
                data_sync: new Date().toISOString(),
                attivo: true,
              });

            if (error) throw error;
            result.bandi_nuovi++;
          } else {
            console.log(`[bandi-sync] Duplicate found for: ${bando.titolo}`);
          }
        }
      } catch (error) {
        result.errori++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.dettagli_errori.push(`${bando.titolo}: ${errorMsg}`);
        console.error(`[bandi-sync] Error processing bando "${bando.titolo}":`, error);
      }
    }
  } catch (error) {
    result.errori++;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.dettagli_errori.push(`Source fetch error: ${errorMsg}`);
    console.error(`[bandi-sync] Error fetching from ${fonte}:`, error);
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for specific source sync
    let body: { fonte?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body - sync all sources
    }

    console.log('[bandi-sync] Starting sync, fonte:', body.fonte || 'ALL');

    // Create sync log entry
    const { data: logEntry, error: logError } = await supabase
      .from('bandi_sync_log')
      .insert({
        fonte: body.fonte || 'ALL',
        metodo: 'MIXED',
        status: 'running',
      })
      .select()
      .single();

    if (logError) {
      console.error('[bandi-sync] Error creating log entry:', logError);
    }

    const results: SyncResult[] = [];

    // Define sources to sync
    const sources = [
      { fonte: 'ARSIAL', fetch: scrapeArsial, metodo: 'SCRAPING' as const },
      { fonte: 'REGIONE_LAZIO', fetch: scrapeRegioneLazio, metodo: 'SCRAPING' as const },
      { fonte: 'UE', fetch: fetchEUBandi, metodo: 'API' as const },
      { fonte: 'INVITALIA', fetch: fetchInvitalia, metodo: 'API' as const },
    ];

    // Filter to specific source if requested
    const sourcesToSync = body.fonte 
      ? sources.filter(s => s.fonte === body.fonte)
      : sources;

    // Sync each source
    for (const source of sourcesToSync) {
      const result = await syncSource(supabase, source.fonte, source.fetch, source.metodo);
      results.push(result);
    }

    // Aggregate results
    const totals = results.reduce(
      (acc, r) => ({
        bandi_trovati: acc.bandi_trovati + r.bandi_trovati,
        bandi_nuovi: acc.bandi_nuovi + r.bandi_nuovi,
        bandi_aggiornati: acc.bandi_aggiornati + r.bandi_aggiornati,
        errori: acc.errori + r.errori,
      }),
      { bandi_trovati: 0, bandi_nuovi: 0, bandi_aggiornati: 0, errori: 0 }
    );

    // Update sync log
    if (logEntry) {
      await supabase
        .from('bandi_sync_log')
        .update({
          ...totals,
          dettagli_errori: results.flatMap(r => r.dettagli_errori),
          completed_at: new Date().toISOString(),
          status: totals.errori > 0 ? 'completed_with_errors' : 'completed',
        })
        .eq('id', logEntry.id);
    }

    console.log('[bandi-sync] Sync completed:', totals);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totals,
        logId: logEntry?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[bandi-sync] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
