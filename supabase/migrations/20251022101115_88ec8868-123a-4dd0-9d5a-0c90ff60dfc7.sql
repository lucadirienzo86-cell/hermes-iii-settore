-- Tabella pratiche
CREATE TABLE public.pratiche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bando_id UUID REFERENCES public.bandi(id) ON DELETE CASCADE NOT NULL,
  stato TEXT DEFAULT 'in_valutazione' CHECK (stato IN ('in_valutazione', 'approvata', 'respinta', 'in_corso', 'completata')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indici per performance
CREATE INDEX pratiche_azienda_id_idx ON public.pratiche(azienda_id);
CREATE INDEX pratiche_bando_id_idx ON public.pratiche(bando_id);
CREATE INDEX pratiche_stato_idx ON public.pratiche(stato);

-- RLS
ALTER TABLE public.pratiche ENABLE ROW LEVEL SECURITY;

-- Aziende vedono solo le proprie pratiche
CREATE POLICY "Aziende vedono proprie pratiche"
  ON public.pratiche FOR SELECT
  USING (azienda_id = auth.uid());

-- Aziende possono creare pratiche
CREATE POLICY "Aziende creano pratiche"
  ON public.pratiche FOR INSERT
  WITH CHECK (azienda_id = auth.uid());

-- Admin/Gestori vedono tutte le pratiche
CREATE POLICY "Admin vedono tutte pratiche"
  ON public.pratiche FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'gestore', 'editore')
    )
  );

-- Admin possono aggiornare pratiche
CREATE POLICY "Admin aggiornano pratiche"
  ON public.pratiche FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'gestore', 'editore')
    )
  );

-- Tabella pratiche_messaggi (Chat)
CREATE TABLE public.pratiche_messaggi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pratica_id UUID REFERENCES public.pratiche(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('azienda', 'admin', 'gestore')),
  messaggio TEXT NOT NULL,
  letto BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indici
CREATE INDEX pratiche_messaggi_pratica_id_idx ON public.pratiche_messaggi(pratica_id);
CREATE INDEX pratiche_messaggi_letto_idx ON public.pratiche_messaggi(letto);

-- RLS
ALTER TABLE public.pratiche_messaggi ENABLE ROW LEVEL SECURITY;

-- Aziende vedono messaggi delle proprie pratiche
CREATE POLICY "Aziende vedono messaggi proprie pratiche"
  ON public.pratiche_messaggi FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pratiche 
      WHERE pratiche.id = pratica_id 
      AND pratiche.azienda_id = auth.uid()
    )
  );

-- Aziende possono inviare messaggi
CREATE POLICY "Aziende inviano messaggi"
  ON public.pratiche_messaggi FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.pratiche 
      WHERE pratiche.id = pratica_id 
      AND pratiche.azienda_id = auth.uid()
    )
  );

-- Aziende possono aggiornare stato letto dei propri messaggi
CREATE POLICY "Aziende aggiornano stato letto"
  ON public.pratiche_messaggi FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pratiche 
      WHERE pratiche.id = pratica_id 
      AND pratiche.azienda_id = auth.uid()
    )
  );

-- Admin vedono tutti i messaggi
CREATE POLICY "Admin vedono tutti messaggi"
  ON public.pratiche_messaggi FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'gestore', 'editore')
    )
  );

-- Admin possono inviare messaggi
CREATE POLICY "Admin inviano messaggi"
  ON public.pratiche_messaggi FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'gestore', 'editore')
    )
  );

-- Tabella richieste_modifica_dati
CREATE TABLE public.richieste_modifica_dati (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tipo_modifica TEXT NOT NULL CHECK (tipo_modifica IN ('dati_personali', 'dati_azienda')),
  dati_originali JSONB NOT NULL,
  dati_modificati JSONB NOT NULL,
  stato TEXT DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'approvata', 'respinta')),
  motivazione_rifiuto TEXT,
  gestita_da UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indici
CREATE INDEX richieste_modifica_azienda_id_idx ON public.richieste_modifica_dati(azienda_id);
CREATE INDEX richieste_modifica_stato_idx ON public.richieste_modifica_dati(stato);

-- RLS
ALTER TABLE public.richieste_modifica_dati ENABLE ROW LEVEL SECURITY;

-- Aziende vedono proprie richieste
CREATE POLICY "Aziende vedono proprie richieste"
  ON public.richieste_modifica_dati FOR SELECT
  USING (azienda_id = auth.uid());

-- Aziende creano richieste
CREATE POLICY "Aziende creano richieste"
  ON public.richieste_modifica_dati FOR INSERT
  WITH CHECK (azienda_id = auth.uid());

-- Admin vedono tutte le richieste
CREATE POLICY "Admin vedono richieste"
  ON public.richieste_modifica_dati FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'gestore')
    )
  );

-- Admin gestiscono richieste
CREATE POLICY "Admin gestiscono richieste"
  ON public.richieste_modifica_dati FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'gestore')
    )
  );