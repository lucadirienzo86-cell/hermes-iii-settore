import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Badge formativi standard
const BADGE_FORMATIVI = [
  "Cybersecurity",
  "Privacy e GDPR",
  "Lingue straniere",
  "Informatica di base",
  "Intelligenza Artificiale",
  "Marketing e comunicazione",
  "Controllo di gestione",
  "Sicurezza sul lavoro",
  "Sostenibilità e ambiente",
  "Soft skills",
  "E-commerce",
  "Internazionalizzazione",
  "Project Management",
  "Risorse Umane",
  "Innovazione digitale"
];

const DIMENSIONI_AZIENDA = [
  "Startup", "PMI", "Ditta individuale", "Midcap", "Grandi imprese", "Liberi professionisti"
];

const NUMERO_DIPENDENTI = [
  "0", "1/3", "4/9", "10/19", "20/49", "50/99", "100/250", "+250"
];

const REGIONI = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
  "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
  "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
];

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing PDF for avviso fondo data extraction...");

    const systemPrompt = `Sei un esperto analizzatore di avvisi di fondi interprofessionali italiani (Fondimpresa, For.Te, Fondo Artigianato Formazione, ecc.).
Analizza il documento PDF fornito e estrai tutte le informazioni rilevanti per popolare un database di avvisi.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido, senza markdown o altro testo.

BADGE FORMATIVI STANDARD (usa SOLO questi):
${BADGE_FORMATIVI.map(b => `- "${b}"`).join('\n')}

DIMENSIONI AZIENDA STANDARD:
${DIMENSIONI_AZIENDA.map(d => `- "${d}"`).join('\n')}

NUMERO DIPENDENTI STANDARD:
${NUMERO_DIPENDENTI.map(n => `- "${n}"`).join('\n')}

REGIONI ITALIANE:
${REGIONI.map(r => `- "${r}"`).join('\n')}

Il JSON deve avere questa struttura:
{
  "titolo": "string - titolo dell'avviso",
  "numero_avviso": "string - numero/codice dell'avviso (es. 1/2024, Avviso 3/2024)",
  "descrizione": "string - descrizione completa dell'avviso",
  "data_apertura": "string YYYY-MM-DD o null se non trovata",
  "data_chiusura": "string YYYY-MM-DD o null se non trovata",
  "importo_minimo": "number o null - contributo minimo per piano",
  "importo_massimo": "number o null - contributo massimo per piano",
  "settore_ateco": ["array di codici ATECO ammessi, es. A, B, C01"],
  "regioni": ["array di regioni dalla lista REGIONI ITALIANE sopra, usa 'Tutta Italia' se nazionale"],
  "dimensione_azienda": ["array di dimensioni dalla lista DIMENSIONI AZIENDA STANDARD"],
  "numero_dipendenti": ["array di fasce dalla lista NUMERO DIPENDENTI STANDARD"],
  "badge_formativi": ["array di tematiche formative dalla lista BADGE FORMATIVI STANDARD che l'avviso copre"],
  "tematiche": ["array di tematiche formative generiche se non matchano con badge_formativi"],
  "link_avviso": "string URL se presente nel documento o null",
  "note": "string - altre informazioni rilevanti (requisiti particolari, scadenze, modalità di presentazione)",
  "claim_commerciale": "string - testo di vendita accattivante per comunicare il bando ai non addetti ai lavori (2-3 frasi, tono persuasivo ma professionale, evidenzia vantaggi principali come gratuità, importo, opportunità)",
  "aree_competenza": ["array di stringhe con le aree di competenza coperte dal bando, es. 'Competenze digitali', 'Sicurezza informatica', 'Lingue straniere per export'"]
}

IMPORTANTE per badge_formativi:
- Mappa le tematiche formative dell'avviso ai badge standard più appropriati
- Es: "Formazione su sicurezza informatica" -> ["Cybersecurity"]
- Es: "Corsi di lingua inglese per l'internazionalizzazione" -> ["Lingue straniere", "Internazionalizzazione"]
- Es: "Formazione antinfortunistica" -> ["Sicurezza sul lavoro"]

IMPORTANTE per claim_commerciale:
- Scrivi un testo accattivante e semplice che comunica i vantaggi del bando a chi non è del settore
- Massimo 2-3 frasi brevi e incisive
- Evidenzia: gratuità (se presente), importo massimo ottenibile, opportunità per l'azienda
- Tono persuasivo ma professionale, ad esempio: "Formazione gratuita per le tue risorse! Ottieni fino a €50.000 di contributi per far crescere le competenze digitali del tuo team."

IMPORTANTE per aree_competenza:
- Identifica 3-6 aree tematiche principali coperte dal bando
- Usa descrizioni chiare e comprensibili, es: "Competenze digitali e informatiche", "Sicurezza sul lavoro", "Sviluppo commerciale e vendite"

Se non riesci a trovare un'informazione, usa null per i campi singoli o [] per gli array.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "Analizza questo documento PDF di un avviso di fondo interprofessionale ed estrai tutte le informazioni. Rispondi SOLO con il JSON."
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

    let extractedData;
    try {
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

    // Filtra badge formativi validi
    if (extractedData.badge_formativi && Array.isArray(extractedData.badge_formativi)) {
      extractedData.badge_formativi = extractedData.badge_formativi.filter(
        (badge: string) => BADGE_FORMATIVI.includes(badge)
      );
    }

    // Filtra dimensioni azienda valide
    if (extractedData.dimensione_azienda && Array.isArray(extractedData.dimensione_azienda)) {
      extractedData.dimensione_azienda = extractedData.dimensione_azienda.filter(
        (dim: string) => DIMENSIONI_AZIENDA.includes(dim)
      );
    }

    // Filtra numero dipendenti validi
    if (extractedData.numero_dipendenti && Array.isArray(extractedData.numero_dipendenti)) {
      extractedData.numero_dipendenti = extractedData.numero_dipendenti.filter(
        (num: string) => NUMERO_DIPENDENTI.includes(num)
      );
    }

    // Filtra regioni valide
    if (extractedData.regioni && Array.isArray(extractedData.regioni)) {
      extractedData.regioni = extractedData.regioni.filter(
        (reg: string) => REGIONI.includes(reg) || reg === "Tutta Italia"
      );
    }

    // Upload PDF to storage
    let pdfUrl = null;
    if (fileName) {
      try {
        const binaryString = atob(pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `avvisi/${timestamp}_${safeName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bandi-documenti')
          .upload(storagePath, bytes, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
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

    console.log("Successfully extracted avviso data:", JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify({ data: extractedData, pdfUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in parse-avviso-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
