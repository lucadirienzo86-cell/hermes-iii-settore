import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface BandoFilters {
  fonte?: string;
  livello?: string;
  attivo?: boolean;
  settore_ateco?: string;
  regione?: string;
  tipo_azienda?: string;
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract ID if present in path (e.g., /bandi-api/123)
    const bandoId = pathParts.length > 1 ? pathParts[1] : null;
    
    console.log(`[bandi-api] Method: ${req.method}, Path: ${url.pathname}, ID: ${bandoId}`);

    // GET /bandi-api/{id} - Get single bando
    if (req.method === 'GET' && bandoId) {
      const { data, error } = await supabase
        .from('bandi')
        .select('*')
        .eq('id', bandoId)
        .single();

      if (error) {
        console.error('[bandi-api] Error fetching bando:', error);
        return new Response(
          JSON.stringify({ error: 'Bando not found', details: error.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /bandi-api - List bandi with filters
    if (req.method === 'GET') {
      const filters: BandoFilters = {
        fonte: url.searchParams.get('fonte') || undefined,
        livello: url.searchParams.get('livello') || undefined,
        attivo: url.searchParams.get('attivo') === 'false' ? false : true,
        settore_ateco: url.searchParams.get('settore_ateco') || undefined,
        regione: url.searchParams.get('regione') || undefined,
        tipo_azienda: url.searchParams.get('tipo_azienda') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
      };

      console.log('[bandi-api] Filters:', filters);

      let query = supabase
        .from('bandi')
        .select('*', { count: 'exact' })
        .eq('attivo', filters.attivo)
        .order('created_at', { ascending: false });

      // Apply optional filters
      if (filters.fonte) {
        query = query.eq('fonte', filters.fonte);
      }
      if (filters.livello) {
        query = query.eq('livello', filters.livello);
      }
      if (filters.settore_ateco) {
        query = query.contains('settore_ateco', [filters.settore_ateco]);
      }
      if (filters.regione) {
        query = query.or(`zone_applicabilita.cs.{"${filters.regione}"},zone_applicabilita.cs.{"Tutta Italia"}`);
      }
      if (filters.tipo_azienda) {
        query = query.contains('tipo_azienda', [filters.tipo_azienda]);
      }

      // Pagination
      query = query.range(filters.offset!, filters.offset! + filters.limit! - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('[bandi-api] Error fetching bandi:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch bandi', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data,
          pagination: {
            total: count,
            limit: filters.limit,
            offset: filters.offset,
            hasMore: (filters.offset! + filters.limit!) < (count || 0),
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[bandi-api] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
