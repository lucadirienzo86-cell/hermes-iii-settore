-- Add zone_applicabilita column to bandi table for geographic matching
ALTER TABLE public.bandi ADD COLUMN IF NOT EXISTS zone_applicabilita text[] DEFAULT NULL;