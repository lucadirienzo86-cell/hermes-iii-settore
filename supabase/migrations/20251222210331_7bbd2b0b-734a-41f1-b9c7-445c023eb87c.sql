-- Crea tabella fondimpresa_aziende mancante
CREATE TABLE IF NOT EXISTS public.fondimpresa_aziende (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codice_fiscale TEXT,
  ragione_sociale TEXT,
  partita_iva TEXT,
  codice_ateco TEXT,
  regione TEXT,
  provincia TEXT,
  comune TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fondimpresa_aziende ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view fondimpresa_aziende"
    ON public.fondimpresa_aziende FOR SELECT
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage fondimpresa_aziende"
    ON public.fondimpresa_aziende FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;