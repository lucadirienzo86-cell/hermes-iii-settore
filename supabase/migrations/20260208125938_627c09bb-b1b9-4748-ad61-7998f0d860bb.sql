-- Extend bandi table with source tracking fields
ALTER TABLE public.bandi 
ADD COLUMN IF NOT EXISTS fonte text DEFAULT 'MANUALE',
ADD COLUMN IF NOT EXISTS livello text DEFAULT 'REGIONALE',
ADD COLUMN IF NOT EXISTS beneficiari text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metodo_acquisizione text DEFAULT 'UPLOAD',
ADD COLUMN IF NOT EXISTS data_sync timestamp with time zone,
ADD COLUMN IF NOT EXISTS stato text DEFAULT 'attivo',
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS hash_dedup text;

-- Create index for deduplication
CREATE INDEX IF NOT EXISTS idx_bandi_dedup ON public.bandi (hash_dedup);
CREATE INDEX IF NOT EXISTS idx_bandi_fonte ON public.bandi (fonte);
CREATE INDEX IF NOT EXISTS idx_bandi_livello ON public.bandi (livello);

-- Create table for tracking sync logs
CREATE TABLE IF NOT EXISTS public.bandi_sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fonte text NOT NULL,
  metodo text NOT NULL,
  bandi_trovati integer DEFAULT 0,
  bandi_nuovi integer DEFAULT 0,
  bandi_aggiornati integer DEFAULT 0,
  errori integer DEFAULT 0,
  dettagli_errori jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status text DEFAULT 'running'
);

-- Enable RLS on sync log
ALTER TABLE public.bandi_sync_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view sync logs (using user_roles table)
DO $$ BEGIN
  CREATE POLICY "Admin can view sync logs"
  ON public.bandi_sync_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create function to generate deduplication hash
CREATE OR REPLACE FUNCTION public.generate_bando_hash(
  p_titolo text,
  p_ente text,
  p_link text
) RETURNS text AS $$
BEGIN
  RETURN md5(COALESCE(lower(trim(p_titolo)), '') || '|' || COALESCE(lower(trim(p_ente)), '') || '|' || COALESCE(lower(trim(p_link)), ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-generate hash on insert/update
CREATE OR REPLACE FUNCTION public.set_bando_hash() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_dedup := public.generate_bando_hash(NEW.titolo, NEW.ente, NEW.link_bando);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_bando_hash ON public.bandi;
DO $$ BEGIN
  CREATE TRIGGER trigger_set_bando_hash
  BEFORE INSERT OR UPDATE ON public.bandi
  FOR EACH ROW
  EXECUTE FUNCTION public.set_bando_hash();
EXCEPTION WHEN OTHERS THEN NULL; END $$;