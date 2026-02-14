import { useMemo } from "react";

interface Azienda {
  id: string;
  ragione_sociale: string;
  partita_iva?: string | null;
  codice_ateco?: string | null;
  codici_ateco?: string[] | null;
  regione?: string | null;
  sede_operativa?: string | null;
  dimensione_azienda?: string | null;
  numero_dipendenti?: string | null;
}

interface Avviso {
  id: string;
  fondo_id: string;
  titolo: string;
  settore_ateco?: string[] | null;
  regioni?: string[] | null;
  dimensione_azienda?: string[] | null;
  numero_dipendenti?: string[] | null;
  attivo?: boolean;
}

interface FondoMatch {
  azienda: Azienda;
  avviso: Avviso;
  fondoNome: string;
  match: boolean;
  percentage: number;
  criteria: string[];
}

// Helper: normalize ATECO to group level (XX.X)
const normalizeAteco = (ateco: string): string => {
  if (!ateco) return "";
  // Remove dots and take first 3 chars for group level
  const cleaned = ateco.replace(/\./g, "");
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 2)}.${cleaned.charAt(2)}`;
  }
  return ateco;
};

// Helper: extract region from complex location string
const extractRegione = (location: string | null | undefined): string => {
  if (!location) return "";
  // Format: "Regione - Provincia (XX)"
  const parts = location.split(" - ");
  return parts[0]?.trim() || "";
};

// Check if any ATECO codes match
const matchAteco = (aziendaAteco: string | null | undefined, aziendaCodici: string[] | null | undefined, avvisoAteco: string[] | null | undefined): boolean => {
  if (!avvisoAteco || avvisoAteco.length === 0) return true; // No requirement = match
  
  const aziendaCodes: string[] = [];
  if (aziendaAteco) aziendaCodes.push(normalizeAteco(aziendaAteco));
  if (aziendaCodici) {
    aziendaCodici.forEach(c => aziendaCodes.push(normalizeAteco(c)));
  }
  
  if (aziendaCodes.length === 0) return false;
  
  const avvisoNormalized = avvisoAteco.map(normalizeAteco);
  
  return aziendaCodes.some(ac => 
    avvisoNormalized.some(aa => 
      ac.startsWith(aa) || aa.startsWith(ac) || ac === aa
    )
  );
};

// Check if region matches
const matchRegione = (aziendaRegione: string | null | undefined, aziendaSede: string | null | undefined, avvisoRegioni: string[] | null | undefined): boolean => {
  if (!avvisoRegioni || avvisoRegioni.length === 0) return true; // No requirement = match
  
  const aziendaReg = extractRegione(aziendaRegione);
  const aziendaSedeReg = extractRegione(aziendaSede);
  
  return avvisoRegioni.some(r => 
    r.toLowerCase() === aziendaReg.toLowerCase() ||
    r.toLowerCase() === aziendaSedeReg.toLowerCase()
  );
};

// Check if dimensione matches
const matchDimensione = (aziendaDimensione: string | null | undefined, avvisoDimensione: string[] | null | undefined): boolean => {
  if (!avvisoDimensione || avvisoDimensione.length === 0) return true;
  if (!aziendaDimensione) return false;
  
  return avvisoDimensione.some(d => 
    d.toLowerCase() === aziendaDimensione.toLowerCase()
  );
};

// Check if numero dipendenti matches
const matchDipendenti = (aziendaDipendenti: string | null | undefined, avvisoDipendenti: string[] | null | undefined): boolean => {
  if (!avvisoDipendenti || avvisoDipendenti.length === 0) return true;
  if (!aziendaDipendenti) return false;
  
  return avvisoDipendenti.some(d => d === aziendaDipendenti);
};

// Calculate match between azienda and avviso
export const calculateFondoMatch = (azienda: Azienda, avviso: Avviso): { match: boolean; percentage: number; criteria: string[] } => {
  const criteria: string[] = [];
  
  // ========== CRITERI VINCOLANTI ==========
  
  // 1. ATECO - VINCOLANTE
  if (avviso.settore_ateco && avviso.settore_ateco.length > 0) {
    if (!matchAteco(azienda.codice_ateco, azienda.codici_ateco, avviso.settore_ateco)) {
      return { match: false, percentage: 0, criteria: [] };
    }
    criteria.push("Settore ATECO");
  }
  
  // 2. REGIONE - VINCOLANTE
  if (avviso.regioni && avviso.regioni.length > 0) {
    if (!matchRegione(azienda.regione, azienda.sede_operativa, avviso.regioni)) {
      return { match: false, percentage: 0, criteria: [] };
    }
    criteria.push("Regione");
  }
  
  // 3. DIMENSIONE - VINCOLANTE
  if (avviso.dimensione_azienda && avviso.dimensione_azienda.length > 0) {
    if (!matchDimensione(azienda.dimensione_azienda, avviso.dimensione_azienda)) {
      return { match: false, percentage: 0, criteria: [] };
    }
    criteria.push("Dimensione Azienda");
  }
  
  // 4. NUMERO DIPENDENTI - VINCOLANTE
  if (avviso.numero_dipendenti && avviso.numero_dipendenti.length > 0) {
    if (!matchDipendenti(azienda.numero_dipendenti, avviso.numero_dipendenti)) {
      return { match: false, percentage: 0, criteria: [] };
    }
    criteria.push("Numero Dipendenti");
  }
  
  // Tutti i criteri vincolanti sono passati → 100% compatibile
  return {
    match: true,
    percentage: 100,
    criteria
  };
};

// Hook to calculate matches for all aziende and avvisi
export const useFondiCompatibility = (
  aziende: Azienda[] | undefined,
  avvisi: Avviso[] | undefined,
  fondi: { id: string; nome: string }[] | undefined
) => {
  const matches = useMemo(() => {
    if (!aziende || !avvisi || !fondi) return [];
    
    const activeAvvisi = avvisi.filter(a => a.attivo !== false);
    const results: FondoMatch[] = [];
    
    aziende.forEach(azienda => {
      activeAvvisi.forEach(avviso => {
        const { match, percentage, criteria } = calculateFondoMatch(azienda, avviso);
        
        if (match) {
          const fondo = fondi.find(f => f.id === avviso.fondo_id);
          results.push({
            azienda,
            avviso,
            fondoNome: fondo?.nome || "N/A",
            match,
            percentage,
            criteria
          });
        }
      });
    });
    
    // Sort by percentage descending
    return results.sort((a, b) => b.percentage - a.percentage);
  }, [aziende, avvisi, fondi]);
  
  return matches;
};

export default useFondiCompatibility;
