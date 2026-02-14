-- Add new columns to aziende table for additional visura data
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS codice_fiscale TEXT;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS sito_web TEXT;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS forma_giuridica TEXT;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS capitale_sociale NUMERIC;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS data_costituzione DATE;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS stato_attivita TEXT;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS descrizione_attivita TEXT;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS pec TEXT;