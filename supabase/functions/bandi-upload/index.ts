import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface BandoUpload {
  titolo: string;
  descrizione?: string;
  ente?: string;
  livello?: 'UE' | 'NAZ' | 'REG' | 'COM';
  settore_ateco?: string[];
  beneficiari?: string[];
  data_chiusura?: string;
  data_apertura?: string;
  link_bando?: string;
  zone_applicabilita?: string[];
  tipo_azienda?: string[];
  numero_dipendenti?: string[];
  costituzione_societa?: string[];
  investimenti_finanziabili?: string[];
  spese_ammissibili?: string[];
  importo_minimo?: number;
  importo_massimo?: number;
  tipo_agevolazione?: string;
  note?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth header from request
    const authHeader = req.headers.get('Authorization');
    
    // Create client with service role for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user is authenticated and is admin
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Forbidden - Admin role required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Handle single bando or batch upload
    const bandiToUpload: BandoUpload[] = Array.isArray(body.bandi) ? body.bandi : [body];
    
    console.log(`[bandi-upload] Uploading ${bandiToUpload.length} bandi`);

    const results = {
      success: 0,
      errors: 0,
      details: [] as { titolo: string; status: 'created' | 'error'; error?: string }[],
    };

    for (const bando of bandiToUpload) {
      try {
        if (!bando.titolo) {
          throw new Error('Titolo is required');
        }

        const { error } = await supabase
          .from('bandi')
          .insert({
            titolo: bando.titolo,
            descrizione: bando.descrizione || null,
            ente: bando.ente || 'Comune di Cassino',
            livello: bando.livello || 'COM',
            settore_ateco: bando.settore_ateco || [],
            beneficiari: bando.beneficiari || [],
            data_chiusura: bando.data_chiusura || null,
            data_apertura: bando.data_apertura || null,
            link_bando: bando.link_bando || null,
            zone_applicabilita: bando.zone_applicabilita || ['Lazio'],
            tipo_azienda: bando.tipo_azienda || [],
            numero_dipendenti: bando.numero_dipendenti || [],
            costituzione_societa: bando.costituzione_societa || [],
            investimenti_finanziabili: bando.investimenti_finanziabili || [],
            spese_ammissibili: bando.spese_ammissibili || [],
            importo_minimo: bando.importo_minimo || null,
            importo_massimo: bando.importo_massimo || null,
            tipo_agevolazione: bando.tipo_agevolazione || null,
            note: bando.note || null,
            fonte: 'COMUNE',
            metodo_acquisizione: 'UPLOAD',
            data_sync: new Date().toISOString(),
            attivo: true,
          });

        if (error) throw error;

        results.success++;
        results.details.push({ titolo: bando.titolo, status: 'created' });
        console.log(`[bandi-upload] Created: ${bando.titolo}`);

      } catch (error) {
        results.errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.details.push({ titolo: bando.titolo || 'Unknown', status: 'error', error: errorMsg });
        console.error(`[bandi-upload] Error for "${bando.titolo}":`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploaded: results.success,
        errors: results.errors,
        details: results.details,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[bandi-upload] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
