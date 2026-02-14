import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TerzoSettoreStats {
  // Panoramica Generale
  totaleAssociazioni: number;
  associazioniPerTipologia: Record<string, number>;
  associazioniAttive: number;
  associazioniInattive: number;
  statoRunts: Record<string, number>;
  
  // Bandi
  bandiAttivi: number;
  bandiInChiusura: number;
  bandiConclusi: number;
  bandiBozza: number;
  
  // Progetti
  progettiFinanziati: number;
  progettiInCorso: number;
  progettiCompletati: number;
  progettiPerStato: Record<string, number>;
  
  // Attività
  attivitaInCorso: number;
  eventiProgrammati: number;
  patrocinati: number;
  
  // Plafond
  plafondTotale: number;
  plafondImpegnato: number;
  plafondResiduo: number;
}

export const useTerzoSettoreStats = () => {
  return useQuery({
    queryKey: ['terzo-settore-stats'],
    queryFn: async (): Promise<TerzoSettoreStats> => {
      // Fetch associazioni
      const { data: associazioni } = await supabase
        .from('associazioni_terzo_settore')
        .select('tipologia, attiva, stato_runts');
      
      // Fetch bandi
      const { data: bandi } = await supabase
        .from('bandi_terzo_settore')
        .select('stato, plafond_totale, plafond_impegnato');
      
      // Fetch progetti
      const { data: progetti } = await supabase
        .from('progetti_terzo_settore')
        .select('stato, importo_approvato');
      
      // Fetch attività
      const { data: attivita } = await supabase
        .from('attivita_territorio')
        .select('stato, tipo, patrocinato_comune');
      
      // Calcola statistiche associazioni
      const associazioniPerTipologia: Record<string, number> = {};
      const statoRunts: Record<string, number> = {};
      let associazioniAttive = 0;
      let associazioniInattive = 0;
      
      (associazioni || []).forEach(a => {
        // Tipologia
        const tip = a.tipologia || 'Altro';
        associazioniPerTipologia[tip] = (associazioniPerTipologia[tip] || 0) + 1;
        
        // Stato RUNTS
        const runts = a.stato_runts || 'dichiarato';
        statoRunts[runts] = (statoRunts[runts] || 0) + 1;
        
        // Attive/Inattive
        if (a.attiva) {
          associazioniAttive++;
        } else {
          associazioniInattive++;
        }
      });
      
      // Calcola statistiche bandi e plafond
      let bandiAttivi = 0;
      let bandiInChiusura = 0;
      let bandiConclusi = 0;
      let bandiBozza = 0;
      let plafondTotale = 0;
      let plafondImpegnato = 0;
      
      (bandi || []).forEach(b => {
        switch (b.stato) {
          case 'attivo': bandiAttivi++; break;
          case 'in_chiusura': bandiInChiusura++; break;
          case 'concluso': bandiConclusi++; break;
          case 'bozza': bandiBozza++; break;
        }
        plafondTotale += Number(b.plafond_totale) || 0;
        plafondImpegnato += Number(b.plafond_impegnato) || 0;
      });
      
      // Calcola statistiche progetti
      const progettiPerStato: Record<string, number> = {};
      let progettiFinanziati = 0;
      let progettiInCorso = 0;
      let progettiCompletati = 0;
      
      (progetti || []).forEach(p => {
        const stato = p.stato || 'candidatura_inviata';
        progettiPerStato[stato] = (progettiPerStato[stato] || 0) + 1;
        
        if (['approvato', 'avviato', 'in_corso', 'completato'].includes(stato)) {
          progettiFinanziati++;
        }
        if (stato === 'in_corso') {
          progettiInCorso++;
        }
        if (stato === 'completato') {
          progettiCompletati++;
        }
      });
      
      // Calcola statistiche attività
      let attivitaInCorso = 0;
      let eventiProgrammati = 0;
      let patrocinati = 0;
      
      (attivita || []).forEach(a => {
        if (a.stato === 'in_corso') attivitaInCorso++;
        if (a.stato === 'programmato') eventiProgrammati++;
        if (a.patrocinato_comune) patrocinati++;
      });
      
      return {
        totaleAssociazioni: associazioni?.length || 0,
        associazioniPerTipologia,
        associazioniAttive,
        associazioniInattive,
        statoRunts,
        bandiAttivi,
        bandiInChiusura,
        bandiConclusi,
        bandiBozza,
        progettiFinanziati,
        progettiInCorso,
        progettiCompletati,
        progettiPerStato,
        attivitaInCorso,
        eventiProgrammati,
        patrocinati,
        plafondTotale,
        plafondImpegnato,
        plafondResiduo: plafondTotale - plafondImpegnato,
      };
    },
  });
};
