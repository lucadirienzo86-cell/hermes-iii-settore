-- Riporta i campi regione e sede_operativa da array a stringa singola
-- Prende il primo elemento dell'array se esiste, altrimenti NULL

ALTER TABLE public.aziende 
  ALTER COLUMN regione TYPE text USING 
    CASE 
      WHEN regione IS NULL OR array_length(regione, 1) IS NULL THEN NULL
      ELSE regione[1]
    END;

ALTER TABLE public.aziende 
  ALTER COLUMN sede_operativa TYPE text USING 
    CASE 
      WHEN sede_operativa IS NULL OR array_length(sede_operativa, 1) IS NULL THEN NULL
      ELSE sede_operativa[1]
    END;