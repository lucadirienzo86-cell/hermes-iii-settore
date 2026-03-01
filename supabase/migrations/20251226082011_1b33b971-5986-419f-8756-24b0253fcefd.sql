-- Tabella per salvare gli aiuti di stato RNA delle aziende
CREATE TABLE public.aziende_aiuti_rna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID NOT NULL REFERENCES public.aziende(id) ON DELETE CASCADE,
  data_concessione DATE,
  titolo_progetto TEXT,
  importo_agevolazione NUMERIC,
  ente_erogante TEXT,
  tipologia TEXT,
  strumento TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Constraint per evitare duplicati
  UNIQUE(azienda_id, data_concessione, titolo_progetto, importo_agevolazione)
);

-- Abilita RLS
ALTER TABLE public.aziende_aiuti_rna ENABLE ROW LEVEL SECURITY;

-- Policy per admin
DO $$ BEGIN
  CREATE POLICY "Admins can manage aziende_aiuti_rna"
  ON public.aziende_aiuti_rna
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy per aziende (visualizzare i propri aiuti)
DO $$ BEGIN
  CREATE POLICY "Aziende can view their own aiuti"
  ON public.aziende_aiuti_rna
  FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM public.aziende WHERE profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy per gestori (gestire aiuti delle loro aziende)
DO $$ BEGIN
  CREATE POLICY "Gestori can manage aiuti of their aziende"
  ON public.aziende_aiuti_rna
  FOR ALL
  USING (
    azienda_id IN (
      SELECT id FROM public.aziende 
      WHERE inserita_da_gestore_id IN (
        SELECT id FROM public.gestori WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy per collaboratori (gestire aiuti delle loro aziende)
DO $$ BEGIN
  CREATE POLICY "Collaboratori can manage aiuti of their aziende"
  ON public.aziende_aiuti_rna
  FOR ALL
  USING (
    azienda_id IN (
      SELECT id FROM public.aziende 
      WHERE inserita_da_collaboratore_id IN (
        SELECT id FROM public.collaboratori WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger per aggiornare updated_at
DO $$ BEGIN
  CREATE TRIGGER update_aziende_aiuti_rna_updated_at
  BEFORE UPDATE ON public.aziende_aiuti_rna
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;