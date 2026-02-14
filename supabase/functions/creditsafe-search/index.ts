import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper per mappare dipendenti alle categorie del form
function getNumeroDipendentiRange(dipendenti: number | null): string {
  if (dipendenti === null || dipendenti === undefined) return "";
  if (dipendenti === 0) return "0";
  if (dipendenti <= 3) return "1/3";
  if (dipendenti <= 9) return "4/9";
  if (dipendenti <= 19) return "10/19";
  if (dipendenti <= 49) return "20/49";
  if (dipendenti <= 99) return "50/99";
  if (dipendenti <= 250) return "100/250";
  return "+250";
}

// Mappa dimensione azienda
function getDimensioneAzienda(dipendenti: number | null): string {
  if (dipendenti === null || dipendenti === undefined) return "";
  if (dipendenti === 0) return "Ditta individuale";
  if (dipendenti <= 9) return "PMI";
  if (dipendenti <= 49) return "PMI";
  if (dipendenti <= 250) return "Midcap";
  return "Grandi imprese";
}

// Helper per calcolare costituzione società
function getCostituzioneRange(dataCostituzione: string | null): string {
  if (!dataCostituzione) return "";
  try {
    const data = new Date(dataCostituzione);
    const now = new Date();
    const mesi = Math.floor((now.getTime() - data.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (mesi <= 12) return "Fino a 12 mesi";
    if (mesi <= 24) return "Da 12 a 24 mesi";
    if (mesi <= 60) return "Da 24 a 60 mesi";
    return "Oltre 60 mesi";
  } catch {
    return "";
  }
}

// Mappa province italiane
const PROVINCE_TO_REGIONE: Record<string, string> = {
  "AG": "Sicilia", "AL": "Piemonte", "AN": "Marche", "AO": "Valle d'Aosta",
  "AP": "Marche", "AQ": "Abruzzo", "AR": "Toscana", "AT": "Piemonte",
  "AV": "Campania", "BA": "Puglia", "BG": "Lombardia", "BI": "Piemonte",
  "BL": "Veneto", "BN": "Campania", "BO": "Emilia-Romagna", "BR": "Puglia",
  "BS": "Lombardia", "BT": "Puglia", "BZ": "Trentino-Alto Adige", "CA": "Sardegna",
  "CB": "Molise", "CE": "Campania", "CH": "Abruzzo", "CL": "Sicilia",
  "CN": "Piemonte", "CO": "Lombardia", "CR": "Lombardia", "CS": "Calabria",
  "CT": "Sicilia", "CZ": "Calabria", "EN": "Sicilia", "FC": "Emilia-Romagna",
  "FE": "Emilia-Romagna", "FG": "Puglia", "FI": "Toscana", "FM": "Marche",
  "FR": "Lazio", "GE": "Liguria", "GO": "Friuli-Venezia Giulia", "GR": "Toscana",
  "IM": "Liguria", "IS": "Molise", "KR": "Calabria", "LC": "Lombardia",
  "LE": "Puglia", "LI": "Toscana", "LO": "Lombardia", "LT": "Lazio",
  "LU": "Toscana", "MB": "Lombardia", "MC": "Marche", "ME": "Sicilia",
  "MI": "Lombardia", "MN": "Lombardia", "MO": "Emilia-Romagna", "MS": "Toscana",
  "MT": "Basilicata", "NA": "Campania", "NO": "Piemonte", "NU": "Sardegna",
  "OR": "Sardegna", "PA": "Sicilia", "PC": "Emilia-Romagna", "PD": "Veneto",
  "PE": "Abruzzo", "PG": "Umbria", "PI": "Toscana", "PN": "Friuli-Venezia Giulia",
  "PO": "Toscana", "PR": "Emilia-Romagna", "PT": "Toscana", "PU": "Marche",
  "PV": "Lombardia", "PZ": "Basilicata", "RA": "Emilia-Romagna", "RC": "Calabria",
  "RE": "Emilia-Romagna", "RG": "Sicilia", "RI": "Lazio", "RM": "Lazio",
  "RN": "Emilia-Romagna", "RO": "Veneto", "SA": "Campania", "SI": "Toscana",
  "SO": "Lombardia", "SP": "Liguria", "SR": "Sicilia", "SS": "Sardegna",
  "SU": "Sardegna", "SV": "Liguria", "TA": "Puglia", "TE": "Abruzzo",
  "TN": "Trentino-Alto Adige", "TO": "Piemonte", "TP": "Sicilia", "TR": "Umbria",
  "TS": "Friuli-Venezia Giulia", "TV": "Veneto", "UD": "Friuli-Venezia Giulia",
  "VA": "Lombardia", "VB": "Piemonte", "VC": "Piemonte", "VE": "Veneto",
  "VI": "Veneto", "VR": "Veneto", "VT": "Lazio", "VV": "Calabria"
};

const PROVINCE_NOMI: Record<string, string> = {
  "AG": "Agrigento", "AL": "Alessandria", "AN": "Ancona", "AO": "Aosta",
  "AP": "Ascoli Piceno", "AQ": "L'Aquila", "AR": "Arezzo", "AT": "Asti",
  "AV": "Avellino", "BA": "Bari", "BG": "Bergamo", "BI": "Biella",
  "BL": "Belluno", "BN": "Benevento", "BO": "Bologna", "BR": "Brindisi",
  "BS": "Brescia", "BT": "Barletta-Andria-Trani", "BZ": "Bolzano", "CA": "Cagliari",
  "CB": "Campobasso", "CE": "Caserta", "CH": "Chieti", "CL": "Caltanissetta",
  "CN": "Cuneo", "CO": "Como", "CR": "Cremona", "CS": "Cosenza",
  "CT": "Catania", "CZ": "Catanzaro", "EN": "Enna", "FC": "Forlì-Cesena",
  "FE": "Ferrara", "FG": "Foggia", "FI": "Firenze", "FM": "Fermo",
  "FR": "Frosinone", "GE": "Genova", "GO": "Gorizia", "GR": "Grosseto",
  "IM": "Imperia", "IS": "Isernia", "KR": "Crotone", "LC": "Lecco",
  "LE": "Lecce", "LI": "Livorno", "LO": "Lodi", "LT": "Latina",
  "LU": "Lucca", "MB": "Monza e Brianza", "MC": "Macerata", "ME": "Messina",
  "MI": "Milano", "MN": "Mantova", "MO": "Modena", "MS": "Massa-Carrara",
  "MT": "Matera", "NA": "Napoli", "NO": "Novara", "NU": "Nuoro",
  "OR": "Oristano", "PA": "Palermo", "PC": "Piacenza", "PD": "Padova",
  "PE": "Pescara", "PG": "Perugia", "PI": "Pisa", "PN": "Pordenone",
  "PO": "Prato", "PR": "Parma", "PT": "Pistoia", "PU": "Pesaro e Urbino",
  "PV": "Pavia", "PZ": "Potenza", "RA": "Ravenna", "RC": "Reggio Calabria",
  "RE": "Reggio Emilia", "RG": "Ragusa", "RI": "Rieti", "RM": "Roma",
  "RN": "Rimini", "RO": "Rovigo", "SA": "Salerno", "SI": "Siena",
  "SO": "Sondrio", "SP": "La Spezia", "SR": "Siracusa", "SS": "Sassari",
  "SU": "Sud Sardegna", "SV": "Savona", "TA": "Taranto", "TE": "Teramo",
  "TN": "Trento", "TO": "Torino", "TP": "Trapani", "TR": "Terni",
  "TS": "Trieste", "TV": "Treviso", "UD": "Udine", "VA": "Varese",
  "VB": "Verbano-Cusio-Ossola", "VC": "Vercelli", "VE": "Venezia", "VI": "Vicenza",
  "VR": "Verona", "VT": "Viterbo", "VV": "Vibo Valentia"
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partita_iva } = await req.json();

    if (!partita_iva || !/^\d{11}$/.test(partita_iva)) {
      return new Response(
        JSON.stringify({ success: false, error: "Partita IVA non valida" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const username = Deno.env.get('CREDITSAFE_USERNAME');
    const password = Deno.env.get('CREDITSAFE_PASSWORD');

    if (!username || !password) {
      console.error('[creditsafe-search] Missing credentials');
      return new Response(
        JSON.stringify({ success: false, error: "Credenziali CreditSafe non configurate" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Authenticate
    console.log('[creditsafe-search] Authenticating...');
    const authResponse = await fetch('https://connect.creditsafe.com/v1/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('[creditsafe-search] Auth failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: "Autenticazione CreditSafe fallita" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = await authResponse.json();
    const token = authData.token;
    console.log('[creditsafe-search] Authenticated successfully');

    // Step 2: Search company by VAT number
    console.log('[creditsafe-search] Searching for P.IVA:', partita_iva);
    const searchUrl = `https://connect.creditsafe.com/v1/companies?countries=IT&vatNo=${partita_iva}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      if (searchResponse.status === 404) {
        return new Response(
          JSON.stringify({ success: false, error: "Azienda non trovata" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const searchError = await searchResponse.text();
      console.error('[creditsafe-search] Search failed:', searchError);
      return new Response(
        JSON.stringify({ success: false, error: "Errore ricerca CreditSafe" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log('[creditsafe-search] Search response:', JSON.stringify(searchData));

    if (!searchData.companies || searchData.companies.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Azienda non trovata" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const company = searchData.companies[0];
    const connectId = company.id;

    // Step 3: Get detailed company report
    console.log('[creditsafe-search] Getting detailed report for:', connectId);
    const reportUrl = `https://connect.creditsafe.com/v1/companies/${connectId}`;
    
    const reportResponse = await fetch(reportUrl, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let detailedData = null;
    if (reportResponse.ok) {
      detailedData = await reportResponse.json();
      console.log('[creditsafe-search] Detailed report received');
    } else {
      console.warn('[creditsafe-search] Could not get detailed report, using search data');
    }

    // Extract data from response
    const report = detailedData?.report || {};
    const companyInfo = report.companySummary || company;
    const companyId = report.companyIdentification || {};
    const contactInfo = report.contactInformation || {};
    const employeesInfo = report.employeesInformation || {};

    // Get employee count
    let employeeCount: number | null = null;
    if (employeesInfo.numberOfEmployees) {
      employeeCount = parseInt(employeesInfo.numberOfEmployees);
    } else if (companyInfo.numberOfEmployees) {
      employeeCount = parseInt(companyInfo.numberOfEmployees);
    }

    // Get province from address
    let provinciaSigla = "";
    let provinciaNome = "";
    let regione = "";
    
    const address = contactInfo.mainAddress || companyInfo.address || {};
    if (address.province) {
      provinciaSigla = address.province.toUpperCase();
      provinciaNome = PROVINCE_NOMI[provinciaSigla] || address.province;
      regione = PROVINCE_TO_REGIONE[provinciaSigla] || "";
    }

    // Get ATECO code
    let codiceAteco = "";
    if (report.activityClassifications && report.activityClassifications.length > 0) {
      const atecoEntry = report.activityClassifications.find((a: any) => a.classification === "ATECO2007");
      if (atecoEntry) {
        codiceAteco = atecoEntry.code;
      }
    }
    if (!codiceAteco && companyId.activityCode) {
      codiceAteco = companyId.activityCode;
    }

    // Get founding date
    let dataCostituzione = "";
    if (companyInfo.dateOfIncorporation) {
      dataCostituzione = companyInfo.dateOfIncorporation;
    } else if (companyId.incorporationDate) {
      dataCostituzione = companyId.incorporationDate;
    }

    const result = {
      success: true,
      source: "creditsafe",
      data: {
        ragione_sociale: companyInfo.businessName || companyInfo.name || company.name || "",
        partita_iva: partita_iva,
        codice_fiscale: companyId.vatRegistrationNumber || partita_iva,
        codice_ateco: codiceAteco,
        regione: regione,
        provincia_sigla: provinciaSigla,
        provincia_nome: provinciaNome,
        sede_legale: address.simpleValue || address.street || "",
        telefono: contactInfo.telephone || "",
        email: contactInfo.email || "",
        pec: contactInfo.pec || "",
        sito_web: contactInfo.website || "",
        forma_giuridica: companyId.legalForm?.description || "",
        numero_dipendenti: getNumeroDipendentiRange(employeeCount),
        dimensione_azienda: getDimensioneAzienda(employeeCount),
        costituzione_societa: getCostituzioneRange(dataCostituzione),
        data_costituzione: dataCostituzione,
        numero_rea: companyId.reaNumber || "",
        cciaa: provinciaSigla
      }
    };

    console.log('[creditsafe-search] Returning result:', JSON.stringify(result.data));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[creditsafe-search] Error:', error);
    const message = error instanceof Error ? error.message : "Errore interno";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
