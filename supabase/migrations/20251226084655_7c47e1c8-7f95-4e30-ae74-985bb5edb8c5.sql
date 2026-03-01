-- Aggiungere zone di disponibilità geografica alla tabella docenti
ALTER TABLE public.docenti ADD COLUMN IF NOT EXISTS zone_disponibilita TEXT[] DEFAULT '{}';

-- Aggiungere campo per aziende inserite dal docente
ALTER TABLE public.aziende ADD COLUMN IF NOT EXISTS inserita_da_docente_id UUID REFERENCES public.docenti(id);

-- Creare index per performance
CREATE INDEX IF NOT EXISTS idx_aziende_docente ON public.aziende(inserita_da_docente_id);

-- RLS Policy: Docenti possono gestire le proprie aziende (ALL operations)
DO $$ BEGIN
  CREATE POLICY "Docenti can manage aziende they inserted"
  ON public.aziende
  FOR ALL
  USING (inserita_da_docente_id IN (
    SELECT id FROM public.docenti WHERE profile_id = auth.uid()
  ));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS Policy: Docenti possono vedere le proprie aziende
DO $$ BEGIN
  CREATE POLICY "Docenti can view aziende they manage"
  ON public.aziende
  FOR SELECT
  USING (inserita_da_docente_id IN (
    SELECT id FROM public.docenti WHERE profile_id = auth.uid()
  ));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS Policy: Docenti possono gestire aiuti RNA delle loro aziende
DO $$ BEGIN
  CREATE POLICY "Docenti can manage aiuti of their aziende"
  ON public.aziende_aiuti_rna
  FOR ALL
  USING (azienda_id IN (
    SELECT id FROM public.aziende
    WHERE inserita_da_docente_id IN (
      SELECT id FROM public.docenti WHERE profile_id = auth.uid()
    )
  ));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS Policy: Docenti possono gestire fondi delle loro aziende
DO $$ BEGIN
  CREATE POLICY "Docenti can manage their aziende fondi"
  ON public.aziende_fondi
  FOR ALL
  USING (azienda_id IN (
    SELECT id FROM public.aziende
    WHERE inserita_da_docente_id IN (
      SELECT id FROM public.docenti WHERE profile_id = auth.uid()
    )
  ));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS Policy: Docenti possono vedere pratiche delle loro aziende
DO $$ BEGIN
  CREATE POLICY "Docenti can view pratiche of their aziende"
  ON public.pratiche
  FOR SELECT
  USING (azienda_id IN (
    SELECT id FROM public.aziende
    WHERE inserita_da_docente_id IN (
      SELECT id FROM public.docenti WHERE profile_id = auth.uid()
    )
  ));
EXCEPTION WHEN OTHERS THEN NULL; END $$;