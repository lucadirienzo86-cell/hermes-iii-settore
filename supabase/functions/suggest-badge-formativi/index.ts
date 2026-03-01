import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping ATECO sezioni -> Badge suggeriti con rilevanza
const ATECO_BADGE_MAPPING: Record<string, { badge: string; rilevanza: 'alta' | 'media' | 'bassa' }[]> = {
  // A - Agricoltura
  "A": [
    { badge: "HACCP", rilevanza: "alta" },
    { badge: "Sostenibilità Ambientale", rilevanza: "alta" },
    { badge: "Supply Chain", rilevanza: "media" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" }
  ],
  // C - Manifatturiero
  "C": [
    { badge: "Lean Manufacturing", rilevanza: "alta" },
    { badge: "Industry 4.0", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Qualità e Certificazioni", rilevanza: "media" },
    { badge: "Automazione e Robotica", rilevanza: "media" }
  ],
  // F - Costruzioni
  "F": [
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "BIM", rilevanza: "alta" },
    { badge: "Sostenibilità Ambientale", rilevanza: "media" }
  ],
  // G - Commercio
  "G": [
    { badge: "E-commerce", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Visual Merchandising", rilevanza: "media" },
    { badge: "Supply Chain", rilevanza: "media" }
  ],
  // H - Trasporti
  "H": [
    { badge: "Logistica", rilevanza: "alta" },
    { badge: "Supply Chain", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Sostenibilità Ambientale", rilevanza: "media" }
  ],
  // I - Ristorazione/Alloggio
  "I": [
    { badge: "HACCP", rilevanza: "alta" },
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "Revenue Management", rilevanza: "media" },
    { badge: "Lingue Straniere", rilevanza: "media" }
  ],
  // J - ICT
  "J": [
    { badge: "Intelligenza Artificiale", rilevanza: "alta" },
    { badge: "Cybersecurity", rilevanza: "alta" },
    { badge: "Cloud Computing", rilevanza: "alta" },
    { badge: "Data Analytics", rilevanza: "alta" },
    { badge: "Programmazione", rilevanza: "alta" },
    { badge: "DevOps", rilevanza: "media" },
    { badge: "Agile/Scrum", rilevanza: "media" }
  ],
  // K - Finanza
  "K": [
    { badge: "Amministrazione e Finanza", rilevanza: "alta" },
    { badge: "Antiriciclaggio", rilevanza: "alta" },
    { badge: "Compliance", rilevanza: "alta" },
    { badge: "Cybersecurity", rilevanza: "media" },
    { badge: "Data Analytics", rilevanza: "media" }
  ],
  // L - Immobiliare
  "L": [
    { badge: "Marketing Immobiliare", rilevanza: "alta" },
    { badge: "Valutazione Immobiliare", rilevanza: "alta" },
    { badge: "BIM", rilevanza: "media" },
    { badge: "Sostenibilità Ambientale", rilevanza: "media" }
  ],
  // M - Consulenza
  "M": [
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "Soft Skills", rilevanza: "alta" },
    { badge: "Change Management", rilevanza: "alta" },
    { badge: "Comunicazione", rilevanza: "media" },
    { badge: "Data Analytics", rilevanza: "media" }
  ],
  // N - Servizi
  "N": [
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Time Management", rilevanza: "alta" },
    { badge: "Soft Skills", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "media" }
  ],
  // P - Istruzione
  "P": [
    { badge: "Public Speaking", rilevanza: "alta" },
    { badge: "Leadership", rilevanza: "alta" },
    { badge: "Soft Skills", rilevanza: "alta" },
    { badge: "E-Learning", rilevanza: "alta" },
    { badge: "Comunicazione", rilevanza: "media" }
  ],
  // Q - Sanità
  "Q": [
    { badge: "Privacy e GDPR", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "HACCP", rilevanza: "alta" },
    { badge: "Comunicazione Sanitaria", rilevanza: "media" },
    { badge: "First Aid", rilevanza: "media" }
  ],
  // R - Attività artistiche
  "R": [
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "Social Media", rilevanza: "alta" },
    { badge: "Event Management", rilevanza: "alta" },
    { badge: "Comunicazione", rilevanza: "media" }
  ],
  // S - Altri servizi
  "S": [
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "media" },
    { badge: "Soft Skills", rilevanza: "media" },
    { badge: "Comunicazione", rilevanza: "media" }
  ]
};

// Mapping ATECO specifici per codici dettagliati (sovrascrivono le sezioni)
const ATECO_SPECIFICO_MAPPING: Record<string, { badge: string; rilevanza: 'alta' | 'media' | 'bassa' }[]> = {
  // === ICT - Sottocategorie specifiche ===
  // 62.01 - Produzione software
  "62.01": [
    { badge: "Intelligenza Artificiale", rilevanza: "alta" },
    { badge: "Programmazione", rilevanza: "alta" },
    { badge: "DevOps", rilevanza: "alta" },
    { badge: "Agile/Scrum", rilevanza: "alta" },
    { badge: "Cybersecurity", rilevanza: "alta" },
    { badge: "Cloud Computing", rilevanza: "alta" },
    { badge: "Testing e QA", rilevanza: "media" },
    { badge: "UX/UI Design", rilevanza: "media" }
  ],
  // 62.02 - Consulenza informatica
  "62.02": [
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "Cloud Computing", rilevanza: "alta" },
    { badge: "Cybersecurity", rilevanza: "alta" },
    { badge: "Agile/Scrum", rilevanza: "alta" },
    { badge: "Digital Transformation", rilevanza: "alta" },
    { badge: "Data Analytics", rilevanza: "media" },
    { badge: "Soft Skills", rilevanza: "media" }
  ],
  // 62.03 - Gestione strutture informatiche
  "62.03": [
    { badge: "Cloud Computing", rilevanza: "alta" },
    { badge: "Cybersecurity", rilevanza: "alta" },
    { badge: "DevOps", rilevanza: "alta" },
    { badge: "Networking", rilevanza: "alta" },
    { badge: "ITIL", rilevanza: "media" },
    { badge: "Disaster Recovery", rilevanza: "media" }
  ],
  // 62.09 - Altre attività IT
  "62.09": [
    { badge: "Programmazione", rilevanza: "alta" },
    { badge: "Data Analytics", rilevanza: "alta" },
    { badge: "Cloud Computing", rilevanza: "media" },
    { badge: "Cybersecurity", rilevanza: "media" }
  ],
  // 63.11 - Elaborazione dati
  "63.11": [
    { badge: "Data Analytics", rilevanza: "alta" },
    { badge: "Big Data", rilevanza: "alta" },
    { badge: "Machine Learning", rilevanza: "alta" },
    { badge: "Privacy e GDPR", rilevanza: "alta" },
    { badge: "Cloud Computing", rilevanza: "media" },
    { badge: "Database Management", rilevanza: "media" }
  ],
  // 63.12 - Portali web
  "63.12": [
    { badge: "E-commerce", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "SEO/SEM", rilevanza: "alta" },
    { badge: "UX/UI Design", rilevanza: "alta" },
    { badge: "Content Marketing", rilevanza: "media" },
    { badge: "Social Media", rilevanza: "media" }
  ],

  // === Manifatturiero - Sottocategorie ===
  // 10.xx - Alimentare
  "10": [
    { badge: "HACCP", rilevanza: "alta" },
    { badge: "Qualità e Certificazioni", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Supply Chain", rilevanza: "alta" },
    { badge: "Lean Manufacturing", rilevanza: "media" },
    { badge: "Sostenibilità Ambientale", rilevanza: "media" }
  ],
  // 25.xx - Metalmeccanica
  "25": [
    { badge: "Lean Manufacturing", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Saldatura", rilevanza: "alta" },
    { badge: "CNC e Lavorazioni Meccaniche", rilevanza: "alta" },
    { badge: "Industry 4.0", rilevanza: "media" },
    { badge: "Qualità e Certificazioni", rilevanza: "media" }
  ],
  // 26.xx - Elettronica
  "26": [
    { badge: "Industry 4.0", rilevanza: "alta" },
    { badge: "Elettronica", rilevanza: "alta" },
    { badge: "Automazione e Robotica", rilevanza: "alta" },
    { badge: "IoT", rilevanza: "alta" },
    { badge: "Qualità e Certificazioni", rilevanza: "media" },
    { badge: "Lean Manufacturing", rilevanza: "media" }
  ],
  // 28.xx - Macchinari
  "28": [
    { badge: "Industry 4.0", rilevanza: "alta" },
    { badge: "Automazione e Robotica", rilevanza: "alta" },
    { badge: "Lean Manufacturing", rilevanza: "alta" },
    { badge: "Manutenzione Predittiva", rilevanza: "alta" },
    { badge: "PLC e Automazione", rilevanza: "media" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "media" }
  ],
  // 29.xx - Automotive
  "29": [
    { badge: "Lean Manufacturing", rilevanza: "alta" },
    { badge: "Industry 4.0", rilevanza: "alta" },
    { badge: "Qualità Automotive", rilevanza: "alta" },
    { badge: "IATF 16949", rilevanza: "alta" },
    { badge: "Automazione e Robotica", rilevanza: "media" },
    { badge: "Sostenibilità Ambientale", rilevanza: "media" }
  ],

  // === Costruzioni - Sottocategorie ===
  // 41.xx - Costruzione edifici
  "41": [
    { badge: "BIM", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "Efficienza Energetica", rilevanza: "alta" },
    { badge: "Sostenibilità Ambientale", rilevanza: "media" },
    { badge: "Cantieri Green", rilevanza: "media" }
  ],
  // 42.xx - Ingegneria civile
  "42": [
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "BIM", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Geotecnica", rilevanza: "media" },
    { badge: "Appalti Pubblici", rilevanza: "media" }
  ],
  // 43.xx - Lavori specializzati
  "43": [
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Impiantistica", rilevanza: "alta" },
    { badge: "Efficienza Energetica", rilevanza: "alta" },
    { badge: "Qualità e Certificazioni", rilevanza: "media" }
  ],

  // === Commercio - Sottocategorie ===
  // 45.xx - Commercio autoveicoli
  "45": [
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Sales Management", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "After Sales", rilevanza: "media" },
    { badge: "CRM", rilevanza: "media" }
  ],
  // 46.xx - Commercio ingrosso
  "46": [
    { badge: "Supply Chain", rilevanza: "alta" },
    { badge: "Logistica", rilevanza: "alta" },
    { badge: "E-commerce B2B", rilevanza: "alta" },
    { badge: "Sales Management", rilevanza: "media" },
    { badge: "Export Management", rilevanza: "media" }
  ],
  // 47.xx - Commercio dettaglio
  "47": [
    { badge: "E-commerce", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Visual Merchandising", rilevanza: "alta" },
    { badge: "Social Media", rilevanza: "media" },
    { badge: "Retail Management", rilevanza: "media" }
  ],

  // === Ristorazione/Alloggio - Sottocategorie ===
  // 55.xx - Alloggio
  "55": [
    { badge: "Revenue Management", rilevanza: "alta" },
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "Booking Management", rilevanza: "alta" },
    { badge: "Lingue Straniere", rilevanza: "alta" },
    { badge: "HACCP", rilevanza: "media" }
  ],
  // 56.xx - Ristorazione
  "56": [
    { badge: "HACCP", rilevanza: "alta" },
    { badge: "Food Cost", rilevanza: "alta" },
    { badge: "Customer Experience", rilevanza: "alta" },
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "Sommelier", rilevanza: "media" },
    { badge: "Barman", rilevanza: "media" }
  ],

  // === Finanza - Sottocategorie ===
  // 64.xx - Servizi finanziari
  "64": [
    { badge: "Antiriciclaggio", rilevanza: "alta" },
    { badge: "Compliance", rilevanza: "alta" },
    { badge: "Risk Management", rilevanza: "alta" },
    { badge: "FinTech", rilevanza: "alta" },
    { badge: "Cybersecurity", rilevanza: "alta" },
    { badge: "Data Analytics", rilevanza: "media" }
  ],
  // 65.xx - Assicurazioni
  "65": [
    { badge: "Insurance Management", rilevanza: "alta" },
    { badge: "Risk Management", rilevanza: "alta" },
    { badge: "Compliance", rilevanza: "alta" },
    { badge: "InsurTech", rilevanza: "media" },
    { badge: "Customer Experience", rilevanza: "media" }
  ],
  // 66.xx - Attività ausiliarie finanza
  "66": [
    { badge: "Consulenza Finanziaria", rilevanza: "alta" },
    { badge: "Antiriciclaggio", rilevanza: "alta" },
    { badge: "Compliance", rilevanza: "alta" },
    { badge: "Wealth Management", rilevanza: "media" }
  ],

  // === Consulenza - Sottocategorie ===
  // 69.xx - Legale e contabile
  "69": [
    { badge: "Privacy e GDPR", rilevanza: "alta" },
    { badge: "Compliance", rilevanza: "alta" },
    { badge: "Amministrazione e Finanza", rilevanza: "alta" },
    { badge: "Legal Tech", rilevanza: "media" },
    { badge: "Digital Transformation", rilevanza: "media" }
  ],
  // 70.xx - Consulenza gestionale
  "70": [
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "Change Management", rilevanza: "alta" },
    { badge: "Strategy", rilevanza: "alta" },
    { badge: "Data Analytics", rilevanza: "alta" },
    { badge: "Digital Transformation", rilevanza: "media" }
  ],
  // 71.xx - Architettura e ingegneria
  "71": [
    { badge: "BIM", rilevanza: "alta" },
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "CAD/CAM", rilevanza: "alta" },
    { badge: "Sostenibilità Ambientale", rilevanza: "alta" },
    { badge: "Efficienza Energetica", rilevanza: "media" }
  ],
  // 72.xx - Ricerca e sviluppo
  "72": [
    { badge: "Innovation Management", rilevanza: "alta" },
    { badge: "Project Management", rilevanza: "alta" },
    { badge: "Data Analytics", rilevanza: "alta" },
    { badge: "Intelligenza Artificiale", rilevanza: "media" },
    { badge: "Brevetti e Proprietà Intellettuale", rilevanza: "media" }
  ],
  // 73.xx - Pubblicità e ricerche mercato
  "73": [
    { badge: "Digital Marketing", rilevanza: "alta" },
    { badge: "Social Media", rilevanza: "alta" },
    { badge: "Content Marketing", rilevanza: "alta" },
    { badge: "Data Analytics", rilevanza: "alta" },
    { badge: "SEO/SEM", rilevanza: "alta" },
    { badge: "Copywriting", rilevanza: "media" }
  ],
  // 74.xx - Design e altre attività professionali
  "74": [
    { badge: "UX/UI Design", rilevanza: "alta" },
    { badge: "Graphic Design", rilevanza: "alta" },
    { badge: "Adobe Creative Suite", rilevanza: "alta" },
    { badge: "3D Modeling", rilevanza: "media" },
    { badge: "Brand Management", rilevanza: "media" }
  ],

  // === Trasporti - Sottocategorie ===
  // 49.xx - Trasporto terrestre
  "49": [
    { badge: "Logistica", rilevanza: "alta" },
    { badge: "Supply Chain", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "ADR Trasporto Merci Pericolose", rilevanza: "media" },
    { badge: "Tachigrafo Digitale", rilevanza: "media" }
  ],
  // 52.xx - Magazzinaggio
  "52": [
    { badge: "Logistica", rilevanza: "alta" },
    { badge: "Supply Chain", rilevanza: "alta" },
    { badge: "Warehouse Management", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "Carrelli Elevatori", rilevanza: "media" }
  ],

  // === Sanità - Sottocategorie ===
  // 86.xx - Assistenza sanitaria
  "86": [
    { badge: "Privacy e GDPR", rilevanza: "alta" },
    { badge: "Sicurezza sul Lavoro", rilevanza: "alta" },
    { badge: "First Aid", rilevanza: "alta" },
    { badge: "Comunicazione Sanitaria", rilevanza: "alta" },
    { badge: "Medical Device Regulation", rilevanza: "media" }
  ],
  // 87.xx - Assistenza residenziale
  "87": [
    { badge: "HACCP", rilevanza: "alta" },
    { badge: "Privacy e GDPR", rilevanza: "alta" },
    { badge: "First Aid", rilevanza: "alta" },
    { badge: "Assistenza Anziani", rilevanza: "alta" },
    { badge: "Soft Skills", rilevanza: "media" }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codici_ateco, descrizione_attivita, dimensione_azienda, badge_disponibili } = await req.json();

    console.log('Richiesta suggerimenti badge:', { codici_ateco, dimensione_azienda });

    if (!codici_ateco || codici_ateco.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Nessun codice ATECO fornito"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Estrai le sezioni ATECO e i codici specifici
    const codiciNormalizzati: string[] = [];
    const sezioni: string[] = [];
    
    codici_ateco.forEach((c: string) => {
      // Estrai il codice numerico (es. "62.01" da "62.01 - Produzione software")
      const match = c.match(/^(\d{2}(?:\.\d{2})?)/);
      if (match) {
        codiciNormalizzati.push(match[1]);
        // Estrai anche la sezione (primi 2 numeri)
        const divisione = match[1].split('.')[0];
        if (!sezioni.includes(divisione)) {
          sezioni.push(divisione);
        }
      } else {
        // Potrebbe essere una lettera di sezione
        const firstChar = c.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstChar) && !sezioni.includes(firstChar)) {
          sezioni.push(firstChar);
        }
      }
    });

    // Mappa divisioni a sezioni lettere per fallback
    const divisioneToSezione = (div: string): string => {
      const code = parseInt(div);
      if (code >= 1 && code < 4) return "A";
      if (code >= 5 && code < 10) return "B";
      if (code >= 10 && code < 34) return "C";
      if (code >= 35 && code < 36) return "D";
      if (code >= 36 && code < 40) return "E";
      if (code >= 41 && code < 44) return "F";
      if (code >= 45 && code < 48) return "G";
      if (code >= 49 && code < 54) return "H";
      if (code >= 55 && code < 57) return "I";
      if (code >= 58 && code < 64) return "J";
      if (code >= 64 && code < 67) return "K";
      if (code >= 68 && code < 69) return "L";
      if (code >= 69 && code < 76) return "M";
      if (code >= 77 && code < 83) return "N";
      if (code >= 84 && code < 85) return "O";
      if (code >= 85 && code < 86) return "P";
      if (code >= 86 && code < 89) return "Q";
      if (code >= 90 && code < 94) return "R";
      if (code >= 94 && code < 97) return "S";
      return "";
    };

    console.log('Codici ATECO normalizzati:', codiciNormalizzati);
    console.log('Sezioni/Divisioni identificate:', sezioni);

    // Raccogli suggerimenti - priorità: codice specifico > divisione > sezione
    const suggerimentiBase: Map<string, { badge: string; rilevanza: 'alta' | 'media' | 'bassa'; count: number; source: string }> = new Map();
    
    // Prima controlla codici specifici (es. 62.01)
    for (const codice of codiciNormalizzati) {
      if (ATECO_SPECIFICO_MAPPING[codice]) {
        console.log(`Trovato mapping specifico per ${codice}`);
        ATECO_SPECIFICO_MAPPING[codice].forEach(b => {
          const existing = suggerimentiBase.get(b.badge);
          if (existing) {
            existing.count++;
            if (b.rilevanza === 'alta') existing.rilevanza = 'alta';
          } else {
            suggerimentiBase.set(b.badge, { ...b, count: 1, source: codice });
          }
        });
      }
    }

    // Poi controlla divisioni (es. 62)
    for (const sezione of sezioni) {
      if (/^\d{2}$/.test(sezione) && ATECO_SPECIFICO_MAPPING[sezione]) {
        console.log(`Trovato mapping per divisione ${sezione}`);
        ATECO_SPECIFICO_MAPPING[sezione].forEach(b => {
          if (!suggerimentiBase.has(b.badge)) {
            suggerimentiBase.set(b.badge, { ...b, count: 1, source: sezione });
          }
        });
      }
    }

    // Infine fallback a sezioni lettere
    for (const sezione of sezioni) {
      let sezioneLettera = sezione;
      if (/^\d{2}$/.test(sezione)) {
        sezioneLettera = divisioneToSezione(sezione);
      }
      if (sezioneLettera && ATECO_BADGE_MAPPING[sezioneLettera]) {
        ATECO_BADGE_MAPPING[sezioneLettera].forEach(b => {
          if (!suggerimentiBase.has(b.badge)) {
            suggerimentiBase.set(b.badge, { ...b, count: 1, source: sezioneLettera });
          }
        });
      }
    }

    // Se abbiamo badge disponibili dal DB, filtra solo quelli esistenti
    let suggerimentiFinali = Array.from(suggerimentiBase.values());
    if (badge_disponibili && badge_disponibili.length > 0) {
      const nomiBadgeDB = badge_disponibili.map((b: any) => b.nome.toLowerCase());
      suggerimentiFinali = suggerimentiFinali.filter(s => 
        nomiBadgeDB.some((nome: string) => 
          nome.includes(s.badge.toLowerCase()) || s.badge.toLowerCase().includes(nome)
        )
      );
      
      // Aggiungi info categoria dai badge DB
      suggerimentiFinali = suggerimentiFinali.map(s => {
        const badgeDB = badge_disponibili.find((b: any) => 
          b.nome.toLowerCase().includes(s.badge.toLowerCase()) || 
          s.badge.toLowerCase().includes(b.nome.toLowerCase())
        );
        return {
          ...s,
          badge: badgeDB?.nome || s.badge,
          categoria: badgeDB?.categoria || null,
          descrizione_badge: badgeDB?.descrizione || null
        };
      });
    }

    // Ordina per rilevanza e count
    suggerimentiFinali.sort((a, b) => {
      const rilevanzaOrder = { alta: 0, media: 1, bassa: 2 };
      const rilevanzaDiff = rilevanzaOrder[a.rilevanza] - rilevanzaOrder[b.rilevanza];
      if (rilevanzaDiff !== 0) return rilevanzaDiff;
      return b.count - a.count;
    });

    // Genera motivazioni con AI se disponibile API key
    const googleAiKey = Deno.env.get('GOOGLE_AI_KEY');
    let suggerimentiConMotivazione = suggerimentiFinali;
    let motivazioneGenerale = "";

    if (googleAiKey && suggerimentiFinali.length > 0) {
      try {
        const prompt = `Sei un esperto di formazione aziendale italiana. Dato un'azienda con i seguenti codici ATECO: ${codiciNormalizzati.join(', ')}${descrizione_attivita ? ` che si occupa di: ${descrizione_attivita}` : ''}${dimensione_azienda ? ` di tipo ${dimensione_azienda}` : ''}.

I badge formativi suggeriti sono: ${suggerimentiFinali.map(s => `${s.badge} (da ATECO ${s.source})`).join(', ')}.

Per ogni badge, fornisci una motivazione breve (max 25 parole) specifica per il codice ATECO dell'azienda.
Inoltre, scrivi una motivazione generale (max 40 parole) sull'importanza della formazione per questo tipo di azienda.

Rispondi SOLO con un JSON valido in questo formato:
{
  "motivazioni": {
    "Nome Badge": "motivazione specifica...",
    ...
  },
  "motivazione_generale": "testo motivazione generale..."
}`;

        const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gemini-2.0-flash',
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 1000
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          // Estrai JSON dalla risposta
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            motivazioneGenerale = parsed.motivazione_generale || "";
            
            suggerimentiConMotivazione = suggerimentiFinali.map(s => ({
              ...s,
              motivazione: parsed.motivazioni?.[s.badge] || `Formazione rilevante per aziende del settore ${sezioni.join(', ')}.`
            }));
          }
        }
      } catch (aiError) {
        console.error('Errore AI per motivazioni:', aiError);
        // Fallback: motivazioni generiche
        suggerimentiConMotivazione = suggerimentiFinali.map(s => ({
          ...s,
          motivazione: `Competenza strategica per aziende con codice ATECO ${sezioni.join('/')}.`
        }));
        motivazioneGenerale = `Per un'azienda del settore ${sezioni.join('/')}, la formazione continua è fondamentale per mantenersi competitivi e aggiornati sulle normative e best practice di settore.`;
      }
    } else {
      // Fallback senza AI
      suggerimentiConMotivazione = suggerimentiFinali.map(s => ({
        ...s,
        motivazione: `Competenza strategica per aziende con codice ATECO ${sezioni.join('/')}.`
      }));
      motivazioneGenerale = `Per un'azienda del settore ${sezioni.join('/')}, la formazione continua è fondamentale per mantenersi competitivi e aggiornati.`;
    }

    console.log('Suggerimenti generati:', suggerimentiConMotivazione.length);

    return new Response(JSON.stringify({
      success: true,
      suggerimenti: suggerimentiConMotivazione.slice(0, 10), // Max 10 suggerimenti
      motivazione_generale: motivazioneGenerale,
      codici_ateco_analizzati: codiciNormalizzati,
      sezioni_ateco: sezioni
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Errore suggest-badge-formativi:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Errore interno"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
