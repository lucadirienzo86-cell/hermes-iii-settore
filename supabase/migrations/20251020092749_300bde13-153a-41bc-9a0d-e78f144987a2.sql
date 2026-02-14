-- Modifica le colonne sede_interesse e tipo_azienda da text a text[]
-- per supportare selezioni multiple

-- Converti sede_interesse da text a text[]
ALTER TABLE public.bandi 
  ALTER COLUMN sede_interesse TYPE text[] 
  USING CASE 
    WHEN sede_interesse IS NULL OR sede_interesse = '' THEN '{}'::text[]
    ELSE ARRAY[sede_interesse]::text[]
  END;

-- Converti tipo_azienda da text a text[]
ALTER TABLE public.bandi 
  ALTER COLUMN tipo_azienda TYPE text[] 
  USING CASE 
    WHEN tipo_azienda IS NULL OR tipo_azienda = '' THEN '{}'::text[]
    ELSE ARRAY[tipo_azienda]::text[]
  END;

-- Imposta i default per i nuovi array
ALTER TABLE public.bandi 
  ALTER COLUMN sede_interesse SET DEFAULT '{}'::text[],
  ALTER COLUMN tipo_azienda SET DEFAULT '{}'::text[];