import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper per parsare importi italiani "1.300.000,00€" → 1300000.00
const parseImporto = (importoStr: string | undefined): number | null => {
  if (!importoStr) return null;
  // Rimuove € e spazi
  let cleaned = importoStr.replace(/[€\s]/g, '').trim();
  // Formato italiano: 1.300.000,00
  // 1. Rimuove i punti (separatori migliaia)
  // 2. Sostituisce virgola (decimale) con punto
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
};

// Helper per parsare date nel formato "24/01/25" → "2025-01-24"
const parseDate = (dateStr: string | undefined): string | null => {
  if (!dateStr) return null;
  // Formato atteso: "DD/MM/YY"
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    // Assume anni 2000+
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partitaIva } = await req.json();

    if (!partitaIva) {
      return new Response(
        JSON.stringify({ error: 'Partita IVA richiesta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pulisci la partita IVA
    const cleanPiva = partitaIva.trim().toUpperCase().replace(/^IT/, '').replace(/\s/g, '');

    console.log('Calling RNA API for:', cleanPiva);

    // Chiama il nuovo endpoint RNA
    const response = await fetch('https://rna-api.legconsulenze.it/check_piva', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ piva: cleanPiva }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RNA API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Errore API RNA: ${response.status}`,
          fondimpresa: { found: false },
          fondoforte: { found: false },
          rna: { found: false, aiuti: [], numeroAiuti: 0, numeroAiutiDeminimis: 0, aiutiDeminimis: [] }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('RNA API response:', JSON.stringify(data));

    // Debug: log dei campi disponibili
    if (data.rna_response && data.rna_response.length > 0) {
      console.log('RNA aiuti fields:', Object.keys(data.rna_response[0]));
      console.log('First aiuto sample:', JSON.stringify(data.rna_response[0]));
    }
    if (data.rna_deminimis_response && data.rna_deminimis_response.length > 0) {
      console.log('RNA deminimis fields:', Object.keys(data.rna_deminimis_response[0]));
      console.log('First deminimis sample:', JSON.stringify(data.rna_deminimis_response[0]));
    }
    console.log('RNA counts - aiuti:', data.rna_response?.length, 'deminimis:', data.rna_deminimis_response?.length);

    // Mappa gli aiuti di stato da rna_response (snake_case -> camelCase)
    const aiuti = (data.rna_response || []).map((aiuto: any) => ({
      dataConcessione: parseDate(aiuto.data_concessione) || aiuto.data_concessione || null,
      titoloProgetto: aiuto.titolo_progetto || null,
      titoloMisura: aiuto.titolo_misura || null,
      importoAgevolazione: parseImporto(aiuto.importo_agevolazione),
      autoritaConcedente: aiuto.autorita_concedente || null,
      tipologia: aiuto.tipologia || null,
      strumento: aiuto.strumento || null,
      // Nuovi campi
      codiceCar: aiuto.codice_car || null,
      codiceCe: aiuto.codice_ce || null,
      tipoMisura: aiuto.tipo_misura || null,
      cor: aiuto.cor || null,
      regione: aiuto.regione || null,
      denominazioneBeneficiario: aiuto.denominazione_beneficiario || null,
    }));

    // Mappa gli aiuti de minimis da rna_deminimis_response
    const aiutiDeminimis = (data.rna_deminimis_response || []).map((aiuto: any) => ({
      dataConcessione: parseDate(aiuto.data_concessione) || aiuto.data_concessione || null,
      titoloProgetto: aiuto.titolo_progetto || null,
      titoloMisura: aiuto.titolo_misura || null,
      importoAgevolazione: parseImporto(aiuto.importo_agevolazione),
      autoritaConcedente: aiuto.autorita_concedente || null,
      tipologia: aiuto.tipologia || null,
      strumento: aiuto.strumento || null,
      // Nuovi campi
      codiceCar: aiuto.codice_car || null,
      codiceCe: aiuto.codice_ce || null,
      tipoMisura: aiuto.tipo_misura || null,
      cor: aiuto.cor || null,
      regione: aiuto.regione || null,
      denominazioneBeneficiario: aiuto.denominazione_beneficiario || null,
    }));

    // Normalizza la risposta per il frontend
    // NOTA: fondimpresa non è più fornito da questa API, rimane come placeholder
    const result = {
      fondimpresa: {
        found: false,
        denominazione: null,
        annoAdesione: null,
        dataAdesione: null,
        stato: null,
        regione: null,
        provincia: null,
      },
      fondoforte: {
        // fondoforte_registration è ora un semplice boolean
        found: data.fondoforte_registration === true,
      },
      rna: {
        found: aiuti.length > 0 || aiutiDeminimis.length > 0,
        aiuti: aiuti,
        numeroAiuti: data.rna || aiuti.length,
        numeroAiutiDeminimis: data.rna_deminimis || aiutiDeminimis.length,
        aiutiDeminimis: aiutiDeminimis,
      }
    };

    console.log('Returning result:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rna-check:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        fondimpresa: { found: false },
        fondoforte: { found: false },
        rna: { found: false, aiuti: [], numeroAiuti: 0, numeroAiutiDeminimis: 0, aiutiDeminimis: [] }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
