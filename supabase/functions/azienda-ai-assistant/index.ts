import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Opzioni valide per i campi strutturati
const TIPI_AZIENDA = [
  "Startup", "PMI", "Ditta individuale", "Midcap", 
  "Grandi imprese", "Liberi professionisti", "Rete di imprese"
];

const NUMERO_DIPENDENTI_OPTIONS = [
  "0", "1/3", "4/9", "10/19", "20/49", "50/99", "100/250", "+250"
];

const COSTITUZIONE_SOCIETA_OPTIONS = [
  "Da costituire", "Fino a 12 mesi", "Da 12 a 24 mesi", 
  "Da 24 a 60 mesi", "Oltre 60 mesi"
];

const REGIONI = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
  "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
  "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
];

const INVESTIMENTI_FINANZIABILI = [
  "Beni strumentali ordinari", "Beni strumentali tecnologici-4.0",
  "Riduzione consumi e efficientamento energetico", "Sito web e e-commerce",
  "Marketing e social", "Acquisto software e licenze", "Opere edili ed impiantistiche",
  "Consulenza tecnica, progettazione, ricerca-sviluppo prodotto/processo",
  "Spese di personale", "Conseguimento certificazioni", "Partecipazione a fiere/workshop",
  "Liquidità", "Tecnologie di innovazione digitale 4.0", "Digital marketing"
];

const SPESE_AMMISSIBILI = [
  "Macchinari e impianti di produzione", "Hardware", "Software gestionale",
  "Climatizzazione e pompe di calore", "Opere edili e cartongesso",
  "Impianti generici", "Illuminazione a led", "Installazione fotovoltaico",
  "Personale dedicato al progetto", "Formazione del personale dedicato",
  "Robotica e IOT", "Sistemi di e-commerce"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentFormData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY non configurata');
      return new Response(
        JSON.stringify({ error: 'Configurazione AI mancante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Assistant] Richiesta ricevuta, messaggi:', messages?.length);
    console.log('[AI Assistant] Form corrente:', currentFormData);

    const systemPrompt = `Sei un assistente AI esperto in compilazione di profili aziendali italiani per accedere a bandi e finanziamenti. 
Il tuo compito è aiutare l'utente a compilare i dati della sua azienda in modo completo e accurato.

CONTESTO FORM ATTUALE:
${JSON.stringify(currentFormData, null, 2)}

CAMPI DA COMPILARE:
- ragione_sociale: nome dell'azienda
- partita_iva: 11 cifre
- email: email aziendale
- telefono: numero di telefono
- codice_ateco: codice ATECO principale (es. 62.01.00)
- settore: settore merceologico
- regione: una tra ${REGIONI.join(', ')}
- dimensione_azienda: una tra ${TIPI_AZIENDA.join(', ')}
- numero_dipendenti: una tra ${NUMERO_DIPENDENTI_OPTIONS.join(', ')}
- costituzione_societa: una tra ${COSTITUZIONE_SOCIETA_OPTIONS.join(', ')}
- investimenti_interesse: array di interessi tra ${INVESTIMENTI_FINANZIABILI.slice(0, 10).join(', ')}...
- spese_interesse: array di spese tra ${SPESE_AMMISSIBILI.slice(0, 8).join(', ')}...

ISTRUZIONI:
1. Quando l'utente descrive la sua azienda, estrai tutte le informazioni possibili
2. Rispondi SEMPRE con un JSON valido nel formato:
{
  "message": "Il tuo messaggio per l'utente",
  "suggestions": {
    "campo1": "valore suggerito",
    "campo2": ["array", "di", "valori"]
  },
  "reasoning": {
    "campo1": "Perché suggerisci questo valore"
  }
}
3. Suggerisci solo campi che puoi dedurre ragionevolmente
4. Per dimensione_azienda, numero_dipendenti e costituzione_societa usa ESATTAMENTE i valori consentiti
5. Per regione usa ESATTAMENTE uno dei nomi delle regioni italiane
6. Se l'utente chiede aiuto generico, fai domande per capire meglio l'azienda

ESEMPIO:
Utente: "Siamo una startup tech di Milano con 5 dipendenti, facciamo software per e-commerce"
Risposta:
{
  "message": "Perfetto! Ho identificato alcuni dati. Sei una startup tecnologica milanese nel settore software. Ti suggerisco questi valori:",
  "suggestions": {
    "settore": "ICT",
    "regione": "Lombardia",
    "dimensione_azienda": "Startup",
    "numero_dipendenti": "1/6",
    "codice_ateco": "62.01.00",
    "investimenti_interesse": ["Sito web e e-commerce", "Tecnologie di innovazione digitale 4.0"]
  },
  "reasoning": {
    "regione": "Milano è in Lombardia",
    "numero_dipendenti": "5 dipendenti rientra nella fascia 1/6",
    "codice_ateco": "62.01.00 è per produzione di software"
  }
}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [])
    ];

    console.log('[AI Assistant] Chiamata AI Gateway...');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Assistant] Errore AI Gateway:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite richieste superato, riprova tra poco." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Errore nel servizio AI" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    console.log('[AI Assistant] Risposta AI:', content.substring(0, 500));

    // Prova a parsare come JSON, altrimenti restituisci come messaggio
    let parsedResponse;
    try {
      // Rimuovi eventuali markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch {
      // Se non è JSON valido, restituisci come messaggio semplice
      parsedResponse = {
        message: content,
        suggestions: {},
        reasoning: {}
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Assistant] Errore:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Errore interno', 
        message: error instanceof Error ? error.message : 'Errore sconosciuto'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
