import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genera un ID unico per tracciare la richiesta
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Logger strutturato con timestamp e request ID
function createLogger(requestId: string) {
  const prefix = `[OpenAPI][${requestId}]`;
  
  return {
    info: (message: string, data?: unknown) => {
      const timestamp = new Date().toISOString();
      if (data !== undefined) {
        console.log(`${timestamp} ${prefix} ℹ️ ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`${timestamp} ${prefix} ℹ️ ${message}`);
      }
    },
    warn: (message: string, data?: unknown) => {
      const timestamp = new Date().toISOString();
      if (data !== undefined) {
        console.warn(`${timestamp} ${prefix} ⚠️ ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.warn(`${timestamp} ${prefix} ⚠️ ${message}`);
      }
    },
    error: (message: string, data?: unknown) => {
      const timestamp = new Date().toISOString();
      if (data !== undefined) {
        console.error(`${timestamp} ${prefix} ❌ ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.error(`${timestamp} ${prefix} ❌ ${message}`);
      }
    },
    success: (message: string, data?: unknown) => {
      const timestamp = new Date().toISOString();
      if (data !== undefined) {
        console.log(`${timestamp} ${prefix} ✅ ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`${timestamp} ${prefix} ✅ ${message}`);
      }
    },
    debug: (message: string, data?: unknown) => {
      const timestamp = new Date().toISOString();
      if (data !== undefined) {
        console.log(`${timestamp} ${prefix} 🔍 ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`${timestamp} ${prefix} 🔍 ${message}`);
      }
    },
    timing: (label: string, startTime: number) => {
      const duration = Date.now() - startTime;
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} ${prefix} ⏱️ ${label}: ${duration}ms`);
      return duration;
    }
  };
}

// Mapping province sigla -> regione
const PROVINCE_TO_REGIONE: Record<string, string> = {
  'AG': 'Sicilia', 'AL': 'Piemonte', 'AN': 'Marche', 'AO': 'Valle d\'Aosta', 'AP': 'Marche',
  'AQ': 'Abruzzo', 'AR': 'Toscana', 'AT': 'Piemonte', 'AV': 'Campania', 'BA': 'Puglia',
  'BG': 'Lombardia', 'BI': 'Piemonte', 'BL': 'Veneto', 'BN': 'Campania', 'BO': 'Emilia-Romagna',
  'BR': 'Puglia', 'BS': 'Lombardia', 'BT': 'Puglia', 'BZ': 'Trentino-Alto Adige', 'CA': 'Sardegna',
  'CB': 'Molise', 'CE': 'Campania', 'CH': 'Abruzzo', 'CI': 'Sardegna', 'CL': 'Sicilia',
  'CN': 'Piemonte', 'CO': 'Lombardia', 'CR': 'Lombardia', 'CS': 'Calabria', 'CT': 'Sicilia',
  'CZ': 'Calabria', 'EN': 'Sicilia', 'FC': 'Emilia-Romagna', 'FE': 'Emilia-Romagna', 'FG': 'Puglia',
  'FI': 'Toscana', 'FM': 'Marche', 'FR': 'Lazio', 'GE': 'Liguria', 'GO': 'Friuli-Venezia Giulia',
  'GR': 'Toscana', 'IM': 'Liguria', 'IS': 'Molise', 'KR': 'Calabria', 'LC': 'Lombardia',
  'LE': 'Puglia', 'LI': 'Toscana', 'LO': 'Lombardia', 'LT': 'Lazio', 'LU': 'Toscana',
  'MB': 'Lombardia', 'MC': 'Marche', 'ME': 'Sicilia', 'MI': 'Lombardia', 'MN': 'Lombardia',
  'MO': 'Emilia-Romagna', 'MS': 'Toscana', 'MT': 'Basilicata', 'NA': 'Campania', 'NO': 'Piemonte',
  'NU': 'Sardegna', 'OR': 'Sardegna', 'PA': 'Sicilia', 'PC': 'Emilia-Romagna', 'PD': 'Veneto',
  'PE': 'Abruzzo', 'PG': 'Umbria', 'PI': 'Toscana', 'PN': 'Friuli-Venezia Giulia', 'PO': 'Toscana',
  'PR': 'Emilia-Romagna', 'PT': 'Toscana', 'PU': 'Marche', 'PV': 'Lombardia', 'PZ': 'Basilicata',
  'RA': 'Emilia-Romagna', 'RC': 'Calabria', 'RE': 'Emilia-Romagna', 'RG': 'Sicilia', 'RI': 'Lazio',
  'RM': 'Lazio', 'RN': 'Emilia-Romagna', 'RO': 'Veneto', 'SA': 'Campania', 'SI': 'Toscana',
  'SO': 'Lombardia', 'SP': 'Liguria', 'SR': 'Sicilia', 'SS': 'Sardegna', 'SU': 'Sardegna',
  'SV': 'Liguria', 'TA': 'Puglia', 'TE': 'Abruzzo', 'TN': 'Trentino-Alto Adige', 'TO': 'Piemonte',
  'TP': 'Sicilia', 'TR': 'Umbria', 'TS': 'Friuli-Venezia Giulia', 'TV': 'Veneto', 'UD': 'Friuli-Venezia Giulia',
  'VA': 'Lombardia', 'VB': 'Piemonte', 'VC': 'Piemonte', 'VE': 'Veneto', 'VI': 'Veneto',
  'VR': 'Veneto', 'VS': 'Sardegna', 'VT': 'Lazio', 'VV': 'Calabria'
};

// Mapping province sigla -> nome completo
const PROVINCE_NOMI: Record<string, string> = {
  'AG': 'Agrigento', 'AL': 'Alessandria', 'AN': 'Ancona', 'AO': 'Aosta', 'AP': 'Ascoli Piceno',
  'AQ': 'L\'Aquila', 'AR': 'Arezzo', 'AT': 'Asti', 'AV': 'Avellino', 'BA': 'Bari',
  'BG': 'Bergamo', 'BI': 'Biella', 'BL': 'Belluno', 'BN': 'Benevento', 'BO': 'Bologna',
  'BR': 'Brindisi', 'BS': 'Brescia', 'BT': 'Barletta-Andria-Trani', 'BZ': 'Bolzano', 'CA': 'Cagliari',
  'CB': 'Campobasso', 'CE': 'Caserta', 'CH': 'Chieti', 'CI': 'Carbonia-Iglesias', 'CL': 'Caltanissetta',
  'CN': 'Cuneo', 'CO': 'Como', 'CR': 'Cremona', 'CS': 'Cosenza', 'CT': 'Catania',
  'CZ': 'Catanzaro', 'EN': 'Enna', 'FC': 'Forlì-Cesena', 'FE': 'Ferrara', 'FG': 'Foggia',
  'FI': 'Firenze', 'FM': 'Fermo', 'FR': 'Frosinone', 'GE': 'Genova', 'GO': 'Gorizia',
  'GR': 'Grosseto', 'IM': 'Imperia', 'IS': 'Isernia', 'KR': 'Crotone', 'LC': 'Lecco',
  'LE': 'Lecce', 'LI': 'Livorno', 'LO': 'Lodi', 'LT': 'Latina', 'LU': 'Lucca',
  'MB': 'Monza e Brianza', 'MC': 'Macerata', 'ME': 'Messina', 'MI': 'Milano', 'MN': 'Mantova',
  'MO': 'Modena', 'MS': 'Massa-Carrara', 'MT': 'Matera', 'NA': 'Napoli', 'NO': 'Novara',
  'NU': 'Nuoro', 'OR': 'Oristano', 'PA': 'Palermo', 'PC': 'Piacenza', 'PD': 'Padova',
  'PE': 'Pescara', 'PG': 'Perugia', 'PI': 'Pisa', 'PN': 'Pordenone', 'PO': 'Prato',
  'PR': 'Parma', 'PT': 'Pistoia', 'PU': 'Pesaro e Urbino', 'PV': 'Pavia', 'PZ': 'Potenza',
  'RA': 'Ravenna', 'RC': 'Reggio Calabria', 'RE': 'Reggio Emilia', 'RG': 'Ragusa', 'RI': 'Rieti',
  'RM': 'Roma', 'RN': 'Rimini', 'RO': 'Rovigo', 'SA': 'Salerno', 'SI': 'Siena',
  'SO': 'Sondrio', 'SP': 'La Spezia', 'SR': 'Siracusa', 'SS': 'Sassari', 'SU': 'Sud Sardegna',
  'SV': 'Savona', 'TA': 'Taranto', 'TE': 'Teramo', 'TN': 'Trento', 'TO': 'Torino',
  'TP': 'Trapani', 'TR': 'Terni', 'TS': 'Trieste', 'TV': 'Treviso', 'UD': 'Udine',
  'VA': 'Varese', 'VB': 'Verbano-Cusio-Ossola', 'VC': 'Vercelli', 'VE': 'Venezia', 'VI': 'Vicenza',
  'VR': 'Verona', 'VS': 'Medio Campidano', 'VT': 'Viterbo', 'VV': 'Vibo Valentia'
};

// Determina la dimensione azienda in base ai dipendenti
function getDimensioneAzienda(dipendenti: number | null): string {
  if (!dipendenti) return '';
  if (dipendenti <= 9) return 'Ditta individuale';
  if (dipendenti <= 49) return 'PMI';
  if (dipendenti <= 249) return 'PMI';
  return 'Grandi imprese';
}

// Converte numero dipendenti in range
function getNumeroDipendentiRange(dipendenti: number | null): string {
  if (!dipendenti) return '';
  if (dipendenti === 0) return '0';
  if (dipendenti <= 6) return '1/6';
  if (dipendenti <= 9) return '7/9';
  if (dipendenti <= 19) return '10/19';
  if (dipendenti <= 49) return '20/49';
  if (dipendenti <= 99) return '50/99';
  if (dipendenti <= 250) return '100/250';
  return '+250';
}

// Calcola anzianità società
function getCostituzioneRange(dataCostituzione: string | null): string {
  if (!dataCostituzione) return '';
  
  const costituzione = new Date(dataCostituzione);
  const oggi = new Date();
  const mesi = (oggi.getFullYear() - costituzione.getFullYear()) * 12 + 
               (oggi.getMonth() - costituzione.getMonth());
  
  if (mesi < 0) return 'Da costituire';
  if (mesi <= 12) return 'Fino a 12 mesi';
  if (mesi <= 24) return 'Da 12 a 24 mesi';
  if (mesi <= 60) return 'Da 24 a 60 mesi';
  return 'Oltre 60 mesi';
}

// Interfaccia per la risposta IT-start
interface ITStartApiResponse {
  success: boolean;
  message?: string;
  error?: string | null;
  data?: Array<{
    taxCode?: string;
    companyName?: string;
    vatCode?: string;
    address?: {
      registeredOffice?: {
        toponym?: string;
        street?: string;
        streetNumber?: string;
        streetName?: string;
        town?: string;
        hamlet?: string | null;
        province?: string;
        zipCode?: string;
        gps?: {
          coordinates?: number[];
        };
        townCode?: string;
        region?: {
          code?: string;
          description?: string;
        };
      };
    };
    activityStatus?: string;
    creationTimestamp?: number;
    lastUpdateTimestamp?: number;
    sdiCode?: string;
    sdiCodeTimestamp?: number;
    id?: string;
    registrationDate?: string;
  }>;
}

serve(async (req) => {
  const requestId = generateRequestId();
  const log = createLogger(requestId);
  const totalStartTime = Date.now();
  
  log.info('=== NUOVA RICHIESTA OPENAPI IT-START ===');
  log.debug('Request method', req.method);
  log.debug('Request headers', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    log.info('Gestione preflight CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body
    const parseStartTime = Date.now();
    let body;
    try {
      body = await req.json();
      log.debug('Request body parsed', body);
    } catch (parseError) {
      log.error('Errore parsing JSON body', { error: String(parseError) });
      return new Response(
        JSON.stringify({ error: 'Corpo richiesta non valido', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    log.timing('Body parsing', parseStartTime);

    const { partita_iva } = body;
    
    if (!partita_iva) {
      log.warn('Partita IVA mancante nella richiesta');
      return new Response(
        JSON.stringify({ error: 'Partita IVA richiesta', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pulisci la P.IVA
    const cleanPiva = partita_iva.replace(/\D/g, '');
    log.info(`Ricerca azienda - P.IVA originale: ${partita_iva}, pulita: ${cleanPiva}`);
    
    if (cleanPiva.length !== 11) {
      log.warn(`Formato P.IVA non valido: ${cleanPiva.length} cifre invece di 11`);
      return new Response(
        JSON.stringify({ error: 'Formato P.IVA non valido', message: 'La Partita IVA deve essere di 11 cifre', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica token
    const OPENAPI_TOKEN = Deno.env.get('OPENAPI_KEY');
    
    if (!OPENAPI_TOKEN) {
      log.error('OPENAPI_KEY non configurata nelle variabili d\'ambiente');
      return new Response(
        JSON.stringify({ error: 'Configurazione API mancante (token)', success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info('Token configurazione', {
      tokenLength: OPENAPI_TOKEN.length,
      tokenPreview: `${OPENAPI_TOKEN.substring(0, 6)}...${OPENAPI_TOKEN.substring(OPENAPI_TOKEN.length - 4)}`
    });

    // Headers per la chiamata API
    const apiHeaders = {
      'Authorization': `Bearer ${OPENAPI_TOKEN}`,
      'Accept': 'application/json'
    };

    // Singola chiamata al nuovo endpoint IT-start
    const API_URL = `https://company.openapi.com/IT-start/${cleanPiva}`;
    log.info('Esecuzione chiamata API IT-start', { apiUrl: API_URL });
    
    const apiStartTime = Date.now();
    const response = await fetch(API_URL, { 
      method: 'GET', 
      headers: apiHeaders 
    });
    log.timing('Chiamata API IT-start', apiStartTime);

    log.info('Risposta API ricevuta', {
      status: response.status, 
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Gestione 404 - azienda non trovata
    if (response.status === 404) {
      log.warn('Azienda non trovata (404)');
      return new Response(
        JSON.stringify({ 
          error: 'Azienda non trovata', 
          message: 'Nessuna azienda trovata con questa Partita IVA. Verifica e compila manualmente.',
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gestione altri errori HTTP
    if (!response.ok) {
      const errorText = await response.text();
      log.error(`Errore API (${response.status})`, { 
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText 
      });

      const errorDetails: Record<number, string> = {
        401: 'Token OpenAPI non valido/scaduto oppure senza permessi per questo endpoint',
        402: 'Credito OpenAPI insufficiente - ricarica necessaria',
        403: 'Accesso negato dal servizio esterno (permessi insufficienti)',
        429: 'Troppe richieste al servizio esterno, riprova tra poco'
      };

      const userMessage = errorDetails[response.status] || 'Impossibile contattare il servizio di ricerca imprese';

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Errore servizio esterno',
          status: response.status,
          details: errorText,
          message: userMessage,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse risposta JSON
    const parseResponseStartTime = Date.now();
    const apiData: ITStartApiResponse = await response.json();
    log.timing('Parsing risposta API', parseResponseStartTime);
    log.debug('Dati API ricevuti', apiData);

    // Verifica successo
    if (!apiData.success || !apiData.data || apiData.data.length === 0) {
      log.warn('Risposta API senza dati validi', { 
        success: apiData.success, 
        dataLength: apiData.data?.length || 0,
        message: apiData.message 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Azienda non trovata', 
          message: apiData.message || 'Nessuna azienda trovata con questa Partita IVA.',
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyData = apiData.data[0];
    log.success('Dati azienda estratti', {
      ragioneSociale: companyData.companyName,
      codiceFiscale: companyData.taxCode,
      partitaIva: companyData.vatCode,
      statoAttivita: companyData.activityStatus
    });

    // Estrazione e elaborazione dati
    log.info('Inizio elaborazione dati');
    const processingStartTime = Date.now();

    // Estrai dati dalla sede legale
    const sedeLegale = companyData.address?.registeredOffice || {};
    const provinciaSigla = sedeLegale.province || '';
    
    // Regione: priorità a quella dall'API, fallback al mapping
    const regioneApi = sedeLegale.region?.description || '';
    const regione = regioneApi || PROVINCE_TO_REGIONE[provinciaSigla] || '';
    const provinciaNome = PROVINCE_NOMI[provinciaSigla] || '';

    log.debug('Dati geografici estratti', { provinciaSigla, provinciaNome, regione, regioneApi });

    // Data costituzione
    const dataCostituzione = companyData.registrationDate || null;

    // SDI Code
    const sdiCode = companyData.sdiCode || '';

    // Stato attività
    const statoAttivita = companyData.activityStatus || 'ATTIVA';

    // Codice fiscale
    const codiceFiscale = companyData.taxCode || '';

    // Costruisci indirizzo completo
    const indirizzoCompleto = sedeLegale.streetName || 
      [sedeLegale.toponym, sedeLegale.street, sedeLegale.streetNumber].filter(Boolean).join(' ') || '';

    log.timing('Elaborazione dati', processingStartTime);

    // Costruisci risposta (campi non disponibili da IT-start rimangono vuoti)
    const result = {
      success: true,
      data: {
        // Dati identificativi
        ragione_sociale: companyData.companyName || '',
        partita_iva: cleanPiva,
        codice_fiscale: codiceFiscale,
        
        // ATECO (non disponibile da IT-start)
        codice_ateco: '',
        descrizione_ateco: '',
        
        // Geografici
        regione: regione,
        provincia_nome: provinciaNome,
        provincia_sigla: provinciaSigla,
        citta: sedeLegale.town || '',
        cap: sedeLegale.zipCode || '',
        indirizzo: indirizzoCompleto,
        
        // Contatti (non disponibile da IT-start)
        pec: '',
        
        // Dimensioni (non disponibile da IT-start)
        numero_dipendenti: '',
        numero_dipendenti_esatto: null,
        dimensione_azienda: '',
        
        // Finanziari (non disponibile da IT-start)
        fatturato: null,
        capitale_sociale: null,
        anno_bilancio: null,
        
        // Legali (non disponibile da IT-start)
        forma_giuridica: '',
        numero_rea: '',
        cciaa: '',
        codice_sdi: sdiCode,
        
        // Temporali
        costituzione_societa: getCostituzioneRange(dataCostituzione),
        data_costituzione: dataCostituzione,
        
        // Stato
        stato_attivita: statoAttivita,
        
        // Flag per indicare che i dati avanzati non sono disponibili
        dati_avanzati_disponibili: false
      }
    };

    log.timing('TEMPO TOTALE RICHIESTA', totalStartTime);
    log.success('Risposta elaborata con successo', {
      ragioneSociale: result.data.ragione_sociale,
      partitaIva: result.data.partita_iva,
      regione: result.data.regione,
      statoAttivita: result.data.stato_attivita,
      datiAvanzatiDisponibili: result.data.dati_avanzati_disponibili
    });
    log.info('=== FINE RICHIESTA OPENAPI IT-START ===');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('Errore non gestito', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    log.timing('TEMPO TOTALE (ERRORE)', totalStartTime);
    log.info('=== FINE RICHIESTA OPENAPI IT-START (CON ERRORE) ===');
    
    return new Response(
      JSON.stringify({ 
        error: 'Errore interno', 
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
