import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get auth header from request
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    });

    const { partitaIva, ragioneSociale, batchPartiteIva } = await req.json();

    // Batch check for multiple partite IVA
    if (batchPartiteIva && Array.isArray(batchPartiteIva)) {
      console.log('[fondimpresa-check] Batch checking', batchPartiteIva.length, 'P.IVA');
      
      const cleanedPivas = batchPartiteIva.map((piva: string) => 
        piva.toString().trim().toUpperCase().replace(/^IT/, '').replace(/\s/g, '')
      );

      const { data, error } = await supabase
        .from('fondimpresa_aziende')
        .select('codice_fiscale, partita_iva, ragione_sociale, anno_adesione')
        .or(`codice_fiscale.in.(${cleanedPivas.join(',')}),partita_iva.in.(${cleanedPivas.join(',')})`);

      if (error) {
        console.error('[fondimpresa-check] Batch query error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create a map of results
      const results: Record<string, { found: boolean; annoAdesione?: number; denominazione?: string }> = {};
      cleanedPivas.forEach(piva => {
        const match = data?.find(d => d.codice_fiscale === piva || d.partita_iva === piva);
        results[piva] = match 
          ? { found: true, annoAdesione: match.anno_adesione, denominazione: match.ragione_sociale }
          : { found: false };
      });

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search by ragione sociale
    if (ragioneSociale) {
      const searchTerm = ragioneSociale.toString().trim();
      
      if (searchTerm.length < 3) {
        return new Response(
          JSON.stringify({ error: 'La ragione sociale deve contenere almeno 3 caratteri' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[fondimpresa-check] Searching by ragione sociale:', searchTerm);

      const { data, error } = await supabase
        .from('fondimpresa_aziende')
        .select('codice_fiscale, partita_iva, ragione_sociale, data_adesione, anno_adesione, stato_registrazione, regione, provincia')
        .ilike('ragione_sociale', `%${searchTerm}%`)
        .limit(20);

      if (error) {
        console.error('[fondimpresa-check] Query error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[fondimpresa-check] Found', data?.length || 0, 'results for', searchTerm);

      return new Response(
        JSON.stringify({
          found: (data?.length || 0) > 0,
          results: data?.map(d => ({
            codiceFiscale: d.codice_fiscale,
            partitaIva: d.partita_iva,
            denominazione: d.ragione_sociale,
            dataAdesione: d.data_adesione,
            annoAdesione: d.anno_adesione,
            stato: d.stato_registrazione,
            regione: d.regione,
            provincia: d.provincia
          })) || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search by partita IVA (existing logic)
    if (!partitaIva) {
      return new Response(
        JSON.stringify({ error: 'partitaIva o ragioneSociale richiesto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the partita IVA (remove spaces, IT prefix if present)
    const cleanedPiva = partitaIva
      .toString()
      .trim()
      .toUpperCase()
      .replace(/^IT/, '')
      .replace(/\s/g, '');

    console.log('[fondimpresa-check] Checking P.IVA:', cleanedPiva);

    // Query the fondimpresa_aziende table - search by both codice_fiscale and partita_iva
    const { data, error } = await supabase
      .from('fondimpresa_aziende')
      .select('codice_fiscale, partita_iva, ragione_sociale, data_adesione, anno_adesione, stato_registrazione, regione, provincia')
      .or(`codice_fiscale.eq.${cleanedPiva},partita_iva.eq.${cleanedPiva}`)
      .maybeSingle();

    if (error) {
      console.error('[fondimpresa-check] Query error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const found = !!data;
    console.log('[fondimpresa-check] Result for', cleanedPiva, ':', found ? 'FOUND' : 'NOT FOUND');

    return new Response(
      JSON.stringify({
        found,
        data: found ? {
          denominazione: data.ragione_sociale,
          dataAdesione: data.data_adesione,
          annoAdesione: data.anno_adesione,
          stato: data.stato_registrazione,
          regione: data.regione,
          provincia: data.provincia
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fondimpresa-check] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
