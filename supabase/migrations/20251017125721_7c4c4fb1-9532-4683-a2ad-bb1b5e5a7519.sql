-- Migrazione: Nuovo Schema Livelli Utente SOFABIS
-- Drop tabelle esistenti
DROP TABLE IF EXISTS public.imprese CASCADE;
DROP TABLE IF EXISTS public.professionisti CASCADE;

-- Converti temporaneamente la colonna role a TEXT prima di droppare l'enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE TEXT;

-- Drop e ricrea ENUM app_role con nuovi valori
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'editore', 'gestore', 'collaboratore', 'azienda');

-- Riconverti la colonna role al nuovo enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Ricrea la funzione has_role con il nuovo enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Tabella gestori
CREATE TABLE public.gestori (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  ragione_sociale TEXT,
  partita_iva TEXT,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella collaboratori
CREATE TABLE public.collaboratori (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  gestore_id UUID NOT NULL REFERENCES public.gestori(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella aziende
CREATE TABLE public.aziende (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  inserita_da_gestore_id UUID REFERENCES public.gestori(id) ON DELETE SET NULL,
  inserita_da_collaboratore_id UUID REFERENCES public.collaboratori(id) ON DELETE SET NULL,
  ragione_sociale TEXT NOT NULL,
  partita_iva TEXT NOT NULL UNIQUE,
  codice_ateco TEXT,
  regione TEXT,
  settore TEXT,
  fabbisogni TEXT[],
  dimensione_azienda TEXT,
  fatturato_annuo NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT azienda_source_check CHECK (
    (profile_id IS NOT NULL) OR 
    (inserita_da_gestore_id IS NOT NULL OR inserita_da_collaboratore_id IS NOT NULL)
  )
);

-- Indici per performance
CREATE INDEX idx_gestori_profile_id ON public.gestori(profile_id);
CREATE INDEX idx_collaboratori_profile_id ON public.collaboratori(profile_id);
CREATE INDEX idx_collaboratori_gestore_id ON public.collaboratori(gestore_id);
CREATE INDEX idx_aziende_profile_id ON public.aziende(profile_id);
CREATE INDEX idx_aziende_gestore_id ON public.aziende(inserita_da_gestore_id);
CREATE INDEX idx_aziende_collaboratore_id ON public.aziende(inserita_da_collaboratore_id);

-- Abilita RLS
ALTER TABLE public.gestori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboratori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aziende ENABLE ROW LEVEL SECURITY;

-- POLICIES per gestori
CREATE POLICY "Gestori possono vedere i propri dati"
  ON public.gestori FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Admin possono vedere tutti i gestori"
  ON public.gestori FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestori possono aggiornare i propri dati"
  ON public.gestori FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Admin possono creare gestori"
  ON public.gestori FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- POLICIES per collaboratori
CREATE POLICY "Collaboratori possono vedere i propri dati"
  ON public.collaboratori FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Gestori possono vedere i propri collaboratori"
  ON public.collaboratori FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gestori
      WHERE gestori.id = collaboratori.gestore_id
        AND gestori.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admin possono vedere tutti i collaboratori"
  ON public.collaboratori FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Collaboratori possono aggiornare i propri dati"
  ON public.collaboratori FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Gestori possono creare collaboratori"
  ON public.collaboratori FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gestori
      WHERE gestori.id = gestore_id
        AND gestori.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admin possono creare collaboratori"
  ON public.collaboratori FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- POLICIES per aziende
CREATE POLICY "Aziende possono vedere i propri dati"
  ON public.aziende FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Gestori possono vedere aziende inserite da loro o dai loro collaboratori"
  ON public.aziende FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gestori
      WHERE gestori.id = aziende.inserita_da_gestore_id
        AND gestori.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.collaboratori
      JOIN public.gestori ON gestori.id = collaboratori.gestore_id
      WHERE collaboratori.id = aziende.inserita_da_collaboratore_id
        AND gestori.profile_id = auth.uid()
    )
  );

CREATE POLICY "Collaboratori possono vedere aziende inserite da loro"
  ON public.aziende FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collaboratori
      WHERE collaboratori.id = aziende.inserita_da_collaboratore_id
        AND collaboratori.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admin possono vedere tutte le aziende"
  ON public.aziende FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Aziende possono aggiornare i propri dati"
  ON public.aziende FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Gestori possono aggiornare aziende inserite da loro o dai loro collaboratori"
  ON public.aziende FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.gestori
      WHERE gestori.id = aziende.inserita_da_gestore_id
        AND gestori.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.collaboratori
      JOIN public.gestori ON gestori.id = collaboratori.gestore_id
      WHERE collaboratori.id = aziende.inserita_da_collaboratore_id
        AND gestori.profile_id = auth.uid()
    )
  );

CREATE POLICY "Aziende possono auto-registrarsi"
  ON public.aziende FOR INSERT
  WITH CHECK (
    profile_id = auth.uid() 
    AND inserita_da_gestore_id IS NULL 
    AND inserita_da_collaboratore_id IS NULL
  );

CREATE POLICY "Gestori possono inserire aziende"
  ON public.aziende FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gestori
      WHERE gestori.id = inserita_da_gestore_id
        AND gestori.profile_id = auth.uid()
    )
  );

CREATE POLICY "Collaboratori possono inserire aziende"
  ON public.aziende FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collaboratori
      WHERE collaboratori.id = inserita_da_collaboratore_id
        AND collaboratori.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admin possono creare aziende"
  ON public.aziende FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Aggiorna la funzione handle_new_user per supportare i nuovi ruoli
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserisce il profilo
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Inserisce il ruolo se specificato nei metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;