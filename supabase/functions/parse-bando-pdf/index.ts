import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Categorie standard per le spese ammissibili (devono matchare con quelle nel DB)
const SPESE_CATEGORIE = [
  "Beni strumentali",
  "Macchinari e attrezzature",
  "Hardware e dispositivi",
  "Software e licenze",
  "Brevetti e marchi",
  "Certificazioni",
  "Consulenze specialistiche",
  "Spese notarili",
  "Locazione immobili",
  "Comunicazione e marketing",
  "Formazione",
  "Personale",
  "Ricerca e sviluppo",
  "Materie prime",
  "Opere edili e impianti",
  "Arredi e allestimenti",
  "Spese generali"
];

// Categorie standard per gli investimenti finanziabili
const INVESTIMENTI_CATEGORIE = [
  "Innovazione tecnologica",
  "Digitalizzazione",
  "Transizione ecologica",
  "Efficienza energetica",
  "Internazionalizzazione",
  "Ricerca e sviluppo",
  "Nuovi impianti produttivi",
  "Ampliamento attività",
  "Ammodernamento macchinari",
  "Startup e nuove imprese",
  "E-commerce",
  "Formazione e competenze",
  "Sicurezza sul lavoro",
  "Sostenibilità ambientale",
  "Economia circolare",
  "Automazione e Industria 4.0",
  "Brevetti e proprietà intellettuale",
  "Marketing e comunicazione"
];

// Tipi di agevolazione standard
const TIPI_AGEVOLAZIONE = [
  "Fondo perduto",
  "Credito d'imposta",
  "Finanziamento agevolato",
  "Garanzia",
  "Misto",
  "Voucher"
];

// Mappatura regioni -> province per auto-popolamento zone_applicabilita
const REGIONI_PROVINCE: Record<string, string[]> = {
  "Abruzzo": ["L'Aquila", "Chieti", "Pescara", "Teramo"],
  "Basilicata": ["Matera", "Potenza"],
  "Calabria": ["Catanzaro", "Cosenza", "Crotone", "Reggio Calabria", "Vibo Valentia"],
  "Campania": ["Avellino", "Benevento", "Caserta", "Napoli", "Salerno"],
  "Emilia-Romagna": ["Bologna", "Ferrara", "Forlì-Cesena", "Modena", "Parma", "Piacenza", "Ravenna", "Reggio Emilia", "Rimini"],
  "Friuli-Venezia Giulia": ["Gorizia", "Pordenone", "Trieste", "Udine"],
  "Lazio": ["Frosinone", "Latina", "Rieti", "Roma", "Viterbo"],
  "Liguria": ["Genova", "Imperia", "La Spezia", "Savona"],
  "Lombardia": ["Bergamo", "Brescia", "Como", "Cremona", "Lecco", "Lodi", "Mantova", "Milano", "Monza e Brianza", "Pavia", "Sondrio", "Varese"],
  "Marche": ["Ancona", "Ascoli Piceno", "Fermo", "Macerata", "Pesaro e Urbino"],
  "Molise": ["Campobasso", "Isernia"],
  "Piemonte": ["Alessandria", "Asti", "Biella", "Cuneo", "Novara", "Torino", "Verbano-Cusio-Ossola", "Vercelli"],
  "Puglia": ["Bari", "Barletta-Andria-Trani", "Brindisi", "Foggia", "Lecce", "Taranto"],
  "Sardegna": ["Cagliari", "Nuoro", "Oristano", "Sassari", "Sud Sardegna"],
  "Sicilia": ["Agrigento", "Caltanissetta", "Catania", "Enna", "Messina", "Palermo", "Ragusa", "Siracusa", "Trapani"],
  "Toscana": ["Arezzo", "Firenze", "Grosseto", "Livorno", "Lucca", "Massa-Carrara", "Pisa", "Pistoia", "Prato", "Siena"],
  "Trentino-Alto Adige": ["Bolzano", "Trento"],
  "Umbria": ["Perugia", "Terni"],
  "Valle d'Aosta": ["Aosta"],
  "Veneto": ["Belluno", "Padova", "Rovigo", "Treviso", "Venezia", "Verona", "Vicenza"]
};

// Funzione per estrarre la regione dall'ente erogatore e mappare alle province
function mapEnteToProvinces(ente: string | null, sedeInteresse: string[] | null): string[] {
  if (!ente) return sedeInteresse || [];
  
  const enteLower = ente.toLowerCase();
  
  // Cerca se l'ente contiene "regione X"
  for (const [regione, province] of Object.entries(REGIONI_PROVINCE)) {
    const regioneLower = regione.toLowerCase();
    if (enteLower.includes(`regione ${regioneLower}`) || enteLower.includes(regioneLower)) {
      // Se trova la regione, restituisce tutte le province
      console.log(`Detected region "${regione}" in ente "${ente}", mapping to provinces:`, province);
      return province;
    }
  }
  
  // Se sede_interesse contiene solo il nome della regione, espandilo alle province
  if (sedeInteresse && sedeInteresse.length > 0) {
    const expandedProvinces: string[] = [];
    for (const sede of sedeInteresse) {
      const sedeLower = sede.toLowerCase().trim();
      let found = false;
      for (const [regione, province] of Object.entries(REGIONI_PROVINCE)) {
        if (sedeLower === regione.toLowerCase()) {
          console.log(`Expanding region "${sede}" to provinces:`, province);
          expandedProvinces.push(...province);
          found = true;
          break;
        }
      }
      if (!found) {
        expandedProvinces.push(sede);
      }
    }
    return expandedProvinces;
  }
  
  return sedeInteresse || [];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, fileName } = await req.json();
    
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: "PDF base64 data is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      console.error("GOOGLE_AI_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inizializza Supabase client per upload storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing PDF for bando data extraction...");

    const systemPrompt = `Sei un esperto analizzatore di bandi e finanziamenti pubblici italiani. 
Analizza il documento PDF fornito e estrai tutte le informazioni rilevanti per popolare un database di bandi.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido, senza markdown o altro testo.

CATEGORIE SPESE AMMISSIBILI STANDARD (usa SOLO queste):
${SPESE_CATEGORIE.map(c => `- "${c}"`).join('\n')}

CATEGORIE INVESTIMENTI FINANZIABILI STANDARD (usa SOLO queste):
${INVESTIMENTI_CATEGORIE.map(c => `- "${c}"`).join('\n')}

TIPI AGEVOLAZIONE STANDARD (usa SOLO questi):
${TIPI_AGEVOLAZIONE.map(t => `- "${t}"`).join('\n')}

Il JSON deve avere questa struttura:
{
  "titolo": "string - titolo del bando",
  "descrizione": "string - descrizione completa del bando",
  "ente": "string - ente che emette il bando (es. Regione Lombardia, Ministero, Invitalia)",
  "data_apertura": "string YYYY-MM-DD o null se non trovata",
  "data_chiusura": "string YYYY-MM-DD o null se non trovata",
  "tipo_agevolazione": "string - uno tra: Fondo perduto, Credito d'imposta, Finanziamento agevolato, Garanzia, Misto, Voucher",
  "importo_minimo": "number o null",
  "importo_massimo": "number o null",
  "settore_ateco": ["array di codici ATECO ammessi, es. A, B, C01, ecc."],
  "sede_interesse": ["array di regioni, es. Lombardia, Piemonte, ecc. - se nazionale usa 'Tutta Italia'"],
  "tipo_azienda": ["array tra: Startup, PMI, Ditta individuale, Midcap, Grandi imprese, Liberi professionisti, Rete di imprese"],
  "numero_dipendenti": ["array tra: 0, 1/3, 4/9, 10/19, 20/49, 50/99, 100/250, +250"],
  "costituzione_societa": ["array tra: Da costituire, Fino a 12 mesi, Da 12 a 24 mesi, Da 24 a 60 mesi, Oltre 60 mesi"],
  "investimenti_finanziabili": ["array di categorie brevi dalla lista CATEGORIE INVESTIMENTI FINANZIABILI STANDARD sopra"],
  "spese_ammissibili": ["array di categorie brevi dalla lista CATEGORIE SPESE AMMISSIBILI STANDARD sopra"],
  "spese_dettaglio": "string - descrizione dettagliata delle spese ammissibili dal bando (da mettere nelle note)",
  "link_bando": "string URL se presente nel documento o null",
  "note": "string - altre informazioni rilevanti non categorizzate"
}

IMPORTANTE per investimenti_finanziabili e spese_ammissibili:
- NON usare descrizioni lunghe, usa SOLO le categorie brevi dalle liste sopra
- Mappa le descrizioni dettagliate alle categorie standard più appropriate
- Esempi spese: "Acquisto beni strumentali/macchinari" -> ["Beni strumentali", "Macchinari e attrezzature"]
- Esempi investimenti: "Progetti di innovazione digitale" -> ["Digitalizzazione", "Innovazione tecnologica"]

IMPORTANTE per tipo_agevolazione:
- Usa SOLO uno dei valori standard: Fondo perduto, Credito d'imposta, Finanziamento agevolato, Garanzia, Misto, Voucher

Se non riesci a trovare un'informazione, usa null per i campi singoli o [] per gli array.
Estrai il più possibile dal documento.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "Analizza questo documento PDF di un bando ed estrai tutte le informazioni. MAPPA le spese ammissibili alle categorie brevi standard. Rispondi SOLO con il JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite richieste AI superato. Riprova tra qualche minuto." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti. Ricarica i crediti." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Errore nell'elaborazione AI" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Nessuna risposta dall'AI" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("AI response received, parsing JSON...");

    // Try to parse the JSON from the response
    let extractedData;
    try {
      // Remove any markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "Impossibile interpretare la risposta AI", raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtra le spese ammissibili per includere solo categorie valide
    if (extractedData.spese_ammissibili && Array.isArray(extractedData.spese_ammissibili)) {
      extractedData.spese_ammissibili = extractedData.spese_ammissibili.filter(
        (spesa: string) => SPESE_CATEGORIE.includes(spesa)
      );
    }

    // Filtra gli investimenti finanziabili per includere solo categorie valide
    if (extractedData.investimenti_finanziabili && Array.isArray(extractedData.investimenti_finanziabili)) {
      extractedData.investimenti_finanziabili = extractedData.investimenti_finanziabili.filter(
        (inv: string) => INVESTIMENTI_CATEGORIE.includes(inv)
      );
    }

    // Normalizza tipo_agevolazione
    if (extractedData.tipo_agevolazione && !TIPI_AGEVOLAZIONE.includes(extractedData.tipo_agevolazione)) {
      const tipoLower = extractedData.tipo_agevolazione.toLowerCase();
      if (tipoLower.includes("fondo perduto") || tipoLower.includes("contributo")) {
        extractedData.tipo_agevolazione = "Fondo perduto";
      } else if (tipoLower.includes("credito") || tipoLower.includes("imposta")) {
        extractedData.tipo_agevolazione = "Credito d'imposta";
      } else if (tipoLower.includes("finanziamento") || tipoLower.includes("prestito")) {
        extractedData.tipo_agevolazione = "Finanziamento agevolato";
      } else if (tipoLower.includes("garanzia")) {
        extractedData.tipo_agevolazione = "Garanzia";
      } else if (tipoLower.includes("voucher")) {
        extractedData.tipo_agevolazione = "Voucher";
      } else if (tipoLower.includes("misto")) {
        extractedData.tipo_agevolazione = "Misto";
      } else {
        extractedData.tipo_agevolazione = "Fondo perduto"; // Default
      }
    }

    // Mappa ente erogatore alle province della regione
    const zoneApplicabilita = mapEnteToProvinces(extractedData.ente, extractedData.sede_interesse);
    if (zoneApplicabilita.length > 0) {
      extractedData.zone_applicabilita = zoneApplicabilita;
    }

    // Aggiungi il dettaglio spese alle note se presente
    if (extractedData.spese_dettaglio) {
      const noteOriginali = extractedData.note || "";
      extractedData.note = noteOriginali 
        ? `${noteOriginali}\n\n--- Dettaglio Spese Ammissibili ---\n${extractedData.spese_dettaglio}`
        : `--- Dettaglio Spese Ammissibili ---\n${extractedData.spese_dettaglio}`;
      delete extractedData.spese_dettaglio;
    }

    // Upload PDF to storage
    let pdfUrl = null;
    if (fileName) {
      try {
        // Decode base64 to Uint8Array
        const binaryString = atob(pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${timestamp}_${safeName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bandi-documenti')
          .upload(storagePath, bytes, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('bandi-documenti')
            .getPublicUrl(storagePath);
          
          pdfUrl = urlData?.publicUrl;
          console.log("PDF uploaded successfully:", pdfUrl);
        }
      } catch (uploadErr) {
        console.error("Error uploading PDF:", uploadErr);
      }
    }

    console.log("Successfully extracted bando data:", JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify({ data: extractedData, pdfUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in parse-bando-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
