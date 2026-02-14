-- Aggiunta campi Camera di Commercio e dati aggiuntivi
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS numero_rea TEXT;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS cciaa TEXT;
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS dati_aggiuntivi JSONB DEFAULT '{}';