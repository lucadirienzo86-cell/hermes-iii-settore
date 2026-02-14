-- Add missing columns to fondimpresa_aziende table
ALTER TABLE public.fondimpresa_aziende ADD COLUMN IF NOT EXISTS data_adesione date;
ALTER TABLE public.fondimpresa_aziende ADD COLUMN IF NOT EXISTS anno_adesione integer;
ALTER TABLE public.fondimpresa_aziende ADD COLUMN IF NOT EXISTS numero_dipendenti integer;
ALTER TABLE public.fondimpresa_aziende ADD COLUMN IF NOT EXISTS classe_dimensionale text;
ALTER TABLE public.fondimpresa_aziende ADD COLUMN IF NOT EXISTS stato_registrazione text;
ALTER TABLE public.fondimpresa_aziende ADD COLUMN IF NOT EXISTS data_estrazione date;