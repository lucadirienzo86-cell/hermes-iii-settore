-- Ensure codice_fiscale can be used as upsert conflict target
ALTER TABLE public.fondimpresa_aziende
  ALTER COLUMN codice_fiscale SET NOT NULL;

-- Add unique constraint for upsert(onConflict: 'codice_fiscale')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fondimpresa_aziende_codice_fiscale_key'
      AND conrelid = 'public.fondimpresa_aziende'::regclass
  ) THEN
    ALTER TABLE public.fondimpresa_aziende
      ADD CONSTRAINT fondimpresa_aziende_codice_fiscale_key UNIQUE (codice_fiscale);
  END IF;
END $$;