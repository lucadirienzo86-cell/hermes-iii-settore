-- =====================================================
-- SCHEMA BASE + FASE 1 + FASE 2
-- Creazione completa del database
-- =====================================================

-- ENUM per ruoli utente (incluso docente)
CREATE TYPE public.app_role AS ENUM ('admin', 'editore', 'gestore', 'collaboratore', 'azienda', 'docente');

-- Tabella user_roles (CRITICA per sicurezza - ruoli separati)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Tabella profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT,
  cognome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Funzione security definer per verificare ruoli
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

-- Funzione per updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

ALTER TABLE public.gestori ENABLE ROW LEVEL SECURITY;

-- Tabella collaboratori (CON FASE 1: approvazione + campi extra)
CREATE TABLE public.collaboratori (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  gestore_id UUID REFERENCES public.gestori(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  telefono TEXT,
  -- FASE 1: Sistema approvazione
  approvato BOOLEAN NOT NULL DEFAULT false,
  data_approvazione TIMESTAMP WITH TIME ZONE,
  approvato_da UUID REFERENCES auth.users(id),
  attivita_svolta TEXT,
  settore_competenza TEXT[],
  note_admin TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.collaboratori ENABLE ROW LEVEL SECURITY;

-- FASE 2: Tabella docenti
CREATE TABLE public.docenti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  telefono TEXT,
  bio TEXT,
  competenze TEXT[],
  settori TEXT[],
  specializzazioni TEXT[],
  disponibilita TEXT,
  approvato BOOLEAN NOT NULL DEFAULT false,
  data_approvazione TIMESTAMP WITH TIME ZONE,
  approvato_da UUID REFERENCES auth.users(id),
  note_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.docenti ENABLE ROW LEVEL SECURITY;

-- Tabella aziende
CREATE TABLE public.aziende (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  ragione_sociale TEXT NOT NULL,
  partita_iva TEXT NOT NULL,
  codice_ateco TEXT,
  codici_ateco TEXT[],
  regione TEXT,
  sede_operativa TEXT,
  settore TEXT,
  dimensione_azienda TEXT,
  numero_dipendenti TEXT,
  costituzione_societa TEXT,
  investimenti_interesse TEXT[],
  spese_interesse TEXT[],
  inserita_da_gestore_id UUID REFERENCES public.gestori(id),
  inserita_da_collaboratore_id UUID REFERENCES public.collaboratori(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.aziende ENABLE ROW LEVEL SECURITY;

-- Tabella bandi
CREATE TABLE public.bandi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  ente TEXT,
  tipo_agevolazione TEXT,
  importo_minimo NUMERIC,
  importo_massimo NUMERIC,
  data_apertura DATE,
  data_chiusura DATE,
  attivo BOOLEAN DEFAULT true,
  settore_ateco TEXT[],
  sede_interesse TEXT[],
  tipo_azienda TEXT[],
  numero_dipendenti TEXT[],
  costituzione_societa TEXT[],
  investimenti_finanziabili TEXT[],
  spese_ammissibili TEXT[],
  link_bando TEXT,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bandi ENABLE ROW LEVEL SECURITY;

-- Tabella bandi_assegnazioni
CREATE TABLE public.bandi_assegnazioni (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bando_id UUID NOT NULL REFERENCES public.bandi(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bando_id, profile_id)
);

ALTER TABLE public.bandi_assegnazioni ENABLE ROW LEVEL SECURITY;

-- Tabella pratiche
CREATE TABLE public.pratiche (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES public.aziende(id) ON DELETE CASCADE,
  bando_id UUID REFERENCES public.bandi(id),
  titolo TEXT NOT NULL,
  stato TEXT DEFAULT 'bozza',
  descrizione TEXT,
  importo_richiesto NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pratiche ENABLE ROW LEVEL SECURITY;

-- Tabella pratiche_documenti
CREATE TABLE public.pratiche_documenti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pratica_id UUID NOT NULL REFERENCES public.pratiche(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  user_type TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pratiche_documenti ENABLE ROW LEVEL SECURITY;

-- Tabella pratiche_messaggi
CREATE TABLE public.pratiche_messaggi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pratica_id UUID NOT NULL REFERENCES public.pratiche(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pratiche_messaggi ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Gestori policies
CREATE POLICY "Gestori can view their own record"
  ON public.gestori FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Gestori can update their own record"
  ON public.gestori FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage gestori"
  ON public.gestori FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Collaboratori policies
CREATE POLICY "Collaboratori can view their own record"
  ON public.collaboratori FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Collaboratori can update their own record"
  ON public.collaboratori FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Gestori can view their collaboratori"
  ON public.collaboratori FOR SELECT
  USING (gestore_id IN (SELECT id FROM public.gestori WHERE profile_id = auth.uid()));

CREATE POLICY "Gestori can manage their collaboratori"
  ON public.collaboratori FOR ALL
  USING (gestore_id IN (SELECT id FROM public.gestori WHERE profile_id = auth.uid()));

CREATE POLICY "Admins can manage collaboratori"
  ON public.collaboratori FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Docenti policies
CREATE POLICY "Docenti can view their own record"
  ON public.docenti FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Docenti can update their own record"
  ON public.docenti FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage docenti"
  ON public.docenti FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Aziende policies
CREATE POLICY "Aziende can view their own record"
  ON public.aziende FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Aziende can update their own record"
  ON public.aziende FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Gestori can view aziende they manage"
  ON public.aziende FOR SELECT
  USING (
    inserita_da_gestore_id IN (SELECT id FROM public.gestori WHERE profile_id = auth.uid())
    OR inserita_da_collaboratore_id IN (SELECT id FROM public.collaboratori WHERE gestore_id IN (SELECT id FROM public.gestori WHERE profile_id = auth.uid()))
  );

CREATE POLICY "Gestori can manage aziende they inserted"
  ON public.aziende FOR ALL
  USING (inserita_da_gestore_id IN (SELECT id FROM public.gestori WHERE profile_id = auth.uid()));

CREATE POLICY "Collaboratori can view aziende they manage"
  ON public.aziende FOR SELECT
  USING (inserita_da_collaboratore_id IN (SELECT id FROM public.collaboratori WHERE profile_id = auth.uid()));

CREATE POLICY "Collaboratori can manage aziende they inserted"
  ON public.aziende FOR ALL
  USING (inserita_da_collaboratore_id IN (SELECT id FROM public.collaboratori WHERE profile_id = auth.uid()));

CREATE POLICY "Admins can manage aziende"
  ON public.aziende FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Bandi policies
CREATE POLICY "Anyone authenticated can view active bandi"
  ON public.bandi FOR SELECT
  USING (auth.uid() IS NOT NULL AND attivo = true);

CREATE POLICY "Admins and editori can manage bandi"
  ON public.bandi FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editore'));

-- Bandi assegnazioni policies
CREATE POLICY "Users can view their bandi assignments"
  ON public.bandi_assegnazioni FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage bandi assignments"
  ON public.bandi_assegnazioni FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Pratiche policies
CREATE POLICY "Users can view pratiche for their aziende"
  ON public.pratiche FOR SELECT
  USING (
    azienda_id IN (SELECT id FROM public.aziende WHERE profile_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Gestori can view pratiche of their aziende"
  ON public.pratiche FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM public.aziende 
      WHERE inserita_da_gestore_id IN (SELECT id FROM public.gestori WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Collaboratori can view pratiche of their aziende"
  ON public.pratiche FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM public.aziende 
      WHERE inserita_da_collaboratore_id IN (SELECT id FROM public.collaboratori WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage pratiche"
  ON public.pratiche FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Pratiche documenti policies
CREATE POLICY "Users can view documenti of their pratiche"
  ON public.pratiche_documenti FOR SELECT
  USING (
    pratica_id IN (
      SELECT id FROM public.pratiche WHERE azienda_id IN (
        SELECT id FROM public.aziende WHERE profile_id = auth.uid()
      )
    )
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "Users can upload documenti"
  ON public.pratiche_documenti FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage documenti"
  ON public.pratiche_documenti FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Pratiche messaggi policies
CREATE POLICY "Users can view messaggi of their pratiche"
  ON public.pratiche_messaggi FOR SELECT
  USING (
    pratica_id IN (
      SELECT id FROM public.pratiche WHERE azienda_id IN (
        SELECT id FROM public.aziende WHERE profile_id = auth.uid()
      )
    )
    OR sender_id = auth.uid()
  );

CREATE POLICY "Users can insert messaggi"
  ON public.pratiche_messaggi FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage messaggi"
  ON public.pratiche_messaggi FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_gestori_updated_at
BEFORE UPDATE ON public.gestori
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_collaboratori_updated_at
BEFORE UPDATE ON public.collaboratori
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_docenti_updated_at
BEFORE UPDATE ON public.docenti
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_aziende_updated_at
BEFORE UPDATE ON public.aziende
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bandi_updated_at
BEFORE UPDATE ON public.bandi
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pratiche_updated_at
BEFORE UPDATE ON public.pratiche
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- FUNZIONE per creare profilo e ruolo automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Estrai il ruolo dai metadata o usa 'collaboratore' come default
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'collaboratore'::app_role
  );
  
  -- Crea il profilo
  INSERT INTO public.profiles (id, email, nome, cognome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', '')
  );
  
  -- Assegna il ruolo
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Trigger per nuovi utenti
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();