import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FondimpresaRecord {
  codice_fiscale: string;
  partita_iva: string | null;
  ragione_sociale: string | null;
  provincia: string | null;
  regione: string | null;
  comune: string | null;
  codice_ateco: string | null;
  data_adesione: string | null;
  anno_adesione: number | null;
  numero_dipendenti: number | null;
  classe_dimensionale: string | null;
  stato_registrazione: string | null;
  data_estrazione: string | null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Remove time portion if present (e.g., "18/05/2015 00:00:00" -> "18/05/2015")
  const dateOnly = dateStr.split(' ')[0];
  
  // Try DD/MM/YYYY format
  const parts = dateOnly.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    // Validate parts are numeric
    if (/^\d+$/.test(day) && /^\d+$/.test(month) && /^\d+$/.test(year)) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

function parseInteger(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
  return isNaN(parsed) ? null : parsed;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { csvContent, clearExisting = false } = await req.json();

    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'csvContent is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[fondimpresa-import] Starting import...');

    // Optionally clear existing data
    if (clearExisting) {
      console.log('[fondimpresa-import] Clearing existing data...');
      const { error: deleteError } = await supabase
        .from('fondimpresa_aziende')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) {
        console.error('[fondimpresa-import] Error clearing data:', deleteError);
      }
    }

    // Parse CSV
    const lines = csvContent.split('\n').filter((line: string) => line.trim() !== '');
    const headers = parseCSVLine(lines[0]);
    
    console.log('[fondimpresa-import] Headers found:', headers);
    console.log('[fondimpresa-import] Total lines to process:', lines.length - 1);

    // Map header names to indices
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      headerMap[h.toLowerCase().trim()] = i;
    });

    // Find column indices - map "denominazione azienda" to ragione_sociale
    const codiceFiscaleIdx = headerMap['codice fiscale'] ?? headerMap['codicefiscale'] ?? -1;
    const partitaIvaIdx = headerMap['partita iva'] ?? headerMap['partitaiva'] ?? headerMap['matricola inps'] ?? headerMap['matricolainps'] ?? -1;
    const ragioneSocialeIdx = headerMap['denominazione azienda'] ?? headerMap['denominazioneazienda'] ?? headerMap['denominazione'] ?? headerMap['ragione sociale'] ?? headerMap['ragionesociale'] ?? -1;
    const provinciaIdx = headerMap['provincia'] ?? headerMap['nome provincia'] ?? -1;
    const regioneIdx = headerMap['regione'] ?? -1;
    const comuneIdx = headerMap['comune'] ?? -1;
    const codiceAtecoIdx = headerMap['codice istat'] ?? headerMap['codiceistat'] ?? headerMap['codice ateco'] ?? headerMap['codiceateco'] ?? -1;
    const dataAdesioneIdx = headerMap['data adesione'] ?? headerMap['dataadesione'] ?? -1;
    const annoAdesioneIdx = headerMap['anno adesione'] ?? headerMap['annoadesione'] ?? -1;
    const numeroDipendentiIdx = headerMap['numero dipendenti'] ?? headerMap['numerodipendenti'] ?? -1;
    const classeDimensionaleIdx = headerMap['classe dimensionale'] ?? headerMap['classedimensionale'] ?? -1;
    const statoRegistrazioneIdx = headerMap['stato registrazione'] ?? headerMap['statoregistrazione'] ?? -1;
    const dataEstrazioneIdx = headerMap['data estrazione'] ?? headerMap['dataestrazione'] ?? -1;

    if (codiceFiscaleIdx === -1) {
      return new Response(
        JSON.stringify({ error: 'Colonna "Codice Fiscale" non trovata nel CSV' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse records
    const records: FondimpresaRecord[] = [];
    const seenCodici = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const codiceFiscale = values[codiceFiscaleIdx]?.trim();
      
      if (!codiceFiscale || seenCodici.has(codiceFiscale)) {
        continue;
      }
      
      seenCodici.add(codiceFiscale);

      records.push({
        codice_fiscale: codiceFiscale,
        partita_iva: partitaIvaIdx >= 0 ? values[partitaIvaIdx]?.trim() || null : null,
        ragione_sociale: ragioneSocialeIdx >= 0 ? values[ragioneSocialeIdx]?.trim() || null : null,
        provincia: provinciaIdx >= 0 ? values[provinciaIdx]?.trim() || null : null,
        regione: regioneIdx >= 0 ? values[regioneIdx]?.trim() || null : null,
        comune: comuneIdx >= 0 ? values[comuneIdx]?.trim() || null : null,
        codice_ateco: codiceAtecoIdx >= 0 ? values[codiceAtecoIdx]?.trim() || null : null,
        data_adesione: dataAdesioneIdx >= 0 ? parseDate(values[dataAdesioneIdx]) : null,
        anno_adesione: annoAdesioneIdx >= 0 ? parseInteger(values[annoAdesioneIdx]) : null,
        numero_dipendenti: numeroDipendentiIdx >= 0 ? parseInteger(values[numeroDipendentiIdx]) : null,
        classe_dimensionale: classeDimensionaleIdx >= 0 ? values[classeDimensionaleIdx]?.trim() || null : null,
        stato_registrazione: statoRegistrazioneIdx >= 0 ? values[statoRegistrazioneIdx]?.trim() || null : null,
        data_estrazione: dataEstrazioneIdx >= 0 ? parseDate(values[dataEstrazioneIdx]) : null,
      });
    }

    console.log('[fondimpresa-import] Unique records to insert:', records.length);

    // Insert in batches
    const BATCH_SIZE = 500;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from('fondimpresa_aziende')
        .upsert(batch, { 
          onConflict: 'codice_fiscale',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`[fondimpresa-import] Batch error at ${i}:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
      
      console.log(`[fondimpresa-import] Progress: ${i + batch.length}/${records.length}`);
    }

    console.log('[fondimpresa-import] Import complete. Inserted:', inserted, 'Errors:', errors);

    return new Response(
      JSON.stringify({
        success: true,
        totalLines: lines.length - 1,
        uniqueRecords: records.length,
        inserted,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fondimpresa-import] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
