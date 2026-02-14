import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to extract value from nested or flat structure
const extractValue = (data: any, ...paths: string[]): any => {
  for (const path of paths) {
    const keys = path.split('.');
    let value = data;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    if (value !== undefined && value !== null) return value;
  }
  return null;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdf_base64, file_name } = await req.json();

    if (!pdf_base64) {
      return new Response(
        JSON.stringify({ error: "PDF base64 richiesto" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing documento: ${file_name || 'unknown'}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurata");
    }

    // Prepara il prompt per l'estrazione dati - richiediamo esplicitamente formato FLAT
    const systemPrompt = `Sei un esperto analista di documenti aziendali italiani. Analizza il documento fornito (visura camerale, bilancio, o altro documento aziendale) ed estrai le seguenti informazioni in formato JSON FLAT (senza struttura annidata).

IMPORTANTE: Rispondi con un JSON FLAT, NON annidato. Tutti i campi devono essere al primo livello.

ESTRAI TUTTI I DATI DISPONIBILI:

DATI IDENTIFICATIVI:
- ragione_sociale: nome completo dell'azienda
- partita_iva: solo numeri, 11 cifre
- codice_fiscale: codice fiscale dell'azienda (può coincidere con P.IVA o essere diverso)
- numero_rea: numero REA completo (es. "MI-1234567" o "RM 1234567")
- cciaa: sigla Camera di Commercio (es. "MI", "RM", "TO")

FORMA E STRUTTURA:
- forma_giuridica: es. SRL, SPA, SNC, Ditta Individuale, SRLS, ecc.
- capitale_sociale: numero in euro (solo valore numerico)
- data_costituzione: data di costituzione in formato YYYY-MM-DD
- data_iscrizione: data iscrizione registro imprese in formato YYYY-MM-DD
- stato_attivita: es. Attiva, Inattiva, In liquidazione, Cessata

ATTIVITÀ:
- codice_ateco: codice ATECO principale (formato XX.XX o XX.XX.XX)
- codici_ateco_secondari: array di codici ATECO secondari
- descrizione_attivita: descrizione completa dell'attività/oggetto sociale

SEDI:
- sede_legale: oggetto con { regione, provincia, provincia_sigla, comune, indirizzo, cap } dove provincia_sigla è la sigla della provincia in maiuscolo (es. "MI" per Milano, "RM" per Roma, "TO" per Torino)
- sede_operativa: oggetto con { regione, provincia, provincia_sigla, comune, indirizzo, cap } (solo se diversa dalla sede legale)

CONTATTI:
- pec: indirizzo PEC
- email: email ordinaria
- telefono: numero telefono (con prefisso)
- fax: numero fax (se presente)
- sito_web: URL sito web

DATI ECONOMICI:
- numero_dipendenti: numero o range (es. "10", "10-19", "20-49")
- fatturato: ultimo fatturato disponibile in euro (solo valore numerico)
- utile_ultimo_bilancio: utile/perdita ultimo esercizio (numero, negativo se perdita)

PERSONE (estrai TUTTI i nominativi trovati):
- soci: array di oggetti con { nome, cognome, codice_fiscale, quota_percentuale, quota_euro, ruolo }
- amministratori: array di oggetti con { nome, cognome, codice_fiscale, carica, data_nomina, poteri }
- altri_rappresentanti: array di oggetti con { nome, cognome, codice_fiscale, ruolo, descrizione }

ALTRI DATI (estrai tutto ciò che trovi di rilevante):
- certificazioni: array di certificazioni (ISO, ecc.)
- albi_registri: array di iscrizioni ad albi o registri speciali
- procedure_concorsuali: eventuali procedure in corso
- note: altre informazioni rilevanti non categorizzabili

REGOLE:
1. Rispondi SOLO con JSON valido FLAT (senza struttura annidata), senza testo aggiuntivo
2. Usa null per i campi non trovati, [] per gli array vuoti
3. Per i numeri, usa valori numerici senza simboli (no €, no %)
4. Per le date, usa formato YYYY-MM-DD
5. Per i codici ATECO, mantieni il formato con punti (es. "62.01")
6. Per la regione, usa il nome completo (es. "Lombardia", non "LO")
7. Estrai TUTTI i soci e amministratori che trovi, anche se solo parziali
8. Se un campo ha più valori (es. più email), mettili tutti in un array
9. Non inventare dati: se non trovi un'informazione, usa null`;

    const userPrompt = `Analizza questo documento e estrai TUTTI i dati aziendali disponibili in formato JSON FLAT. Estrai il maggior numero possibile di informazioni.

[Il documento è stato caricato come PDF]`;

    // Chiama Lovable AI con il PDF
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:application/pdf;base64,${pdf_base64}` 
                } 
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite richieste superato, riprova tra poco" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Risposta AI vuota");
    }

    console.log("AI response length:", content.length);
    console.log("AI response preview:", content.substring(0, 800));

    // Parse JSON dalla risposta
    let extractedData;
    try {
      // Rimuovi eventuali backticks markdown
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();
      
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content was:", content.substring(0, 500));
      
      // Tentativo di estrazione parziale
      extractedData = {
        raw_content: content,
        parse_error: true
      };
    }

    // Normalizza i dati - gestisce sia formato flat che annidato
    const normalizedData = {
      // Dati identificativi - cerca in più posizioni possibili
      ragione_sociale: extractValue(extractedData, 
        'ragione_sociale', 
        'DATI_IDENTIFICATIVI.ragione_sociale',
        'dati_identificativi.ragione_sociale'
      ),
      partita_iva: (() => {
        const piva = extractValue(extractedData, 
          'partita_iva', 
          'DATI_IDENTIFICATIVI.partita_iva',
          'dati_identificativi.partita_iva'
        );
        return piva?.toString().replace(/\D/g, '') || null;
      })(),
      codice_fiscale: extractValue(extractedData, 
        'codice_fiscale', 
        'DATI_IDENTIFICATIVI.codice_fiscale',
        'dati_identificativi.codice_fiscale'
      ),
      numero_rea: extractValue(extractedData, 
        'numero_rea', 
        'DATI_IDENTIFICATIVI.numero_rea',
        'dati_identificativi.numero_rea'
      ),
      cciaa: extractValue(extractedData, 
        'cciaa', 
        'DATI_IDENTIFICATIVI.cciaa',
        'dati_identificativi.cciaa'
      ),
      
      // Forma e struttura
      forma_giuridica: extractValue(extractedData, 
        'forma_giuridica', 
        'FORMA_E_STRUTTURA.forma_giuridica',
        'forma_e_struttura.forma_giuridica'
      ),
      capitale_sociale: extractValue(extractedData, 
        'capitale_sociale', 
        'FORMA_E_STRUTTURA.capitale_sociale',
        'forma_e_struttura.capitale_sociale'
      ),
      data_costituzione: extractValue(extractedData, 
        'data_costituzione', 
        'FORMA_E_STRUTTURA.data_costituzione',
        'forma_e_struttura.data_costituzione'
      ),
      data_iscrizione: extractValue(extractedData, 
        'data_iscrizione', 
        'FORMA_E_STRUTTURA.data_iscrizione',
        'forma_e_struttura.data_iscrizione'
      ),
      stato_attivita: extractValue(extractedData, 
        'stato_attivita', 
        'FORMA_E_STRUTTURA.stato_attivita',
        'forma_e_struttura.stato_attivita'
      ),
      
      // Attività
      codice_ateco: extractValue(extractedData, 
        'codice_ateco', 
        'ATTIVITÀ.codice_ateco',
        'ATTIVITA.codice_ateco',
        'attivita.codice_ateco'
      ),
      codici_ateco: extractValue(extractedData, 
        'codici_ateco_secondari', 
        'codici_ateco',
        'ATTIVITÀ.codici_ateco_secondari',
        'ATTIVITA.codici_ateco_secondari',
        'attivita.codici_ateco_secondari'
      ) || [],
      descrizione_attivita: extractValue(extractedData, 
        'descrizione_attivita', 
        'ATTIVITÀ.descrizione_attivita',
        'ATTIVITA.descrizione_attivita',
        'attivita.descrizione_attivita'
      ),
      
      // Sedi
      sede_legale: extractValue(extractedData, 
        'sede_legale', 
        'SEDI.sede_legale',
        'sedi.sede_legale'
      ),
      sede_operativa: extractValue(extractedData, 
        'sede_operativa', 
        'SEDI.sede_operativa',
        'sedi.sede_operativa'
      ),
      
      // Contatti
      pec: extractValue(extractedData, 
        'pec', 
        'CONTATTI.pec',
        'contatti.pec'
      ),
      email: extractValue(extractedData, 
        'email', 
        'CONTATTI.email',
        'contatti.email'
      ),
      telefono: extractValue(extractedData, 
        'telefono', 
        'CONTATTI.telefono',
        'contatti.telefono'
      ),
      fax: extractValue(extractedData, 
        'fax', 
        'CONTATTI.fax',
        'contatti.fax'
      ),
      sito_web: extractValue(extractedData, 
        'sito_web', 
        'CONTATTI.sito_web',
        'contatti.sito_web'
      ),
      
      // Dati economici
      numero_dipendenti: (() => {
        const nd = extractValue(extractedData, 
          'numero_dipendenti', 
          'DATI_ECONOMICI.numero_dipendenti',
          'dati_economici.numero_dipendenti'
        );
        return nd?.toString() || null;
      })(),
      fatturato: extractValue(extractedData, 
        'fatturato', 
        'DATI_ECONOMICI.fatturato',
        'dati_economici.fatturato'
      ),
      utile_ultimo_bilancio: extractValue(extractedData, 
        'utile_ultimo_bilancio', 
        'DATI_ECONOMICI.utile_ultimo_bilancio',
        'dati_economici.utile_ultimo_bilancio'
      ),
      
      // Persone
      soci: extractValue(extractedData, 
        'soci', 
        'PERSONE.soci',
        'persone.soci'
      ) || [],
      amministratori: extractValue(extractedData, 
        'amministratori', 
        'PERSONE.amministratori',
        'persone.amministratori'
      ) || [],
      altri_rappresentanti: extractValue(extractedData, 
        'altri_rappresentanti', 
        'PERSONE.altri_rappresentanti',
        'persone.altri_rappresentanti'
      ) || [],
      
      // Altri dati
      certificazioni: extractValue(extractedData, 
        'certificazioni', 
        'ALTRI_DATI.certificazioni',
        'altri_dati.certificazioni'
      ) || [],
      albi_registri: extractValue(extractedData, 
        'albi_registri', 
        'ALTRI_DATI.albi_registri',
        'altri_dati.albi_registri'
      ) || [],
      procedure_concorsuali: extractValue(extractedData, 
        'procedure_concorsuali', 
        'ALTRI_DATI.procedure_concorsuali',
        'altri_dati.procedure_concorsuali'
      ),
      note: extractValue(extractedData, 
        'note', 
        'ALTRI_DATI.note',
        'altri_dati.note'
      ),
      
      // Dati grezzi per riferimento
      raw_data: extractedData
    };

    console.log("Dati estratti - principali:", JSON.stringify({
      ragione_sociale: normalizedData.ragione_sociale,
      partita_iva: normalizedData.partita_iva,
      codice_fiscale: normalizedData.codice_fiscale,
      numero_rea: normalizedData.numero_rea,
      cciaa: normalizedData.cciaa,
      forma_giuridica: normalizedData.forma_giuridica,
      codice_ateco: normalizedData.codice_ateco,
      soci_count: normalizedData.soci?.length || 0,
      amministratori_count: normalizedData.amministratori?.length || 0
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: normalizedData,
        file_name 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Parse visura error:', error);
    const errorMessage = error instanceof Error ? error.message : "Errore durante l'analisi del documento";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
