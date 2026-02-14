-- Modifica la tabella aziende per supportare array di regioni/province
-- per sede legale e sede operativa

-- Converte i campi regione e sede_operativa da text a text[]
ALTER TABLE public.aziende 
  ALTER COLUMN regione TYPE text[] USING 
    CASE 
      WHEN regione IS NULL THEN NULL
      WHEN regione = '' THEN NULL
      ELSE ARRAY[regione]::text[]
    END;

ALTER TABLE public.aziende 
  ALTER COLUMN sede_operativa TYPE text[] USING 
    CASE 
      WHEN sede_operativa IS NULL THEN NULL
      WHEN sede_operativa = '' THEN NULL
      ELSE ARRAY[sede_operativa]::text[]
    END;