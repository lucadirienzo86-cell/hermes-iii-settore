-- Tipologie associazioni Terzo Settore
CREATE TYPE public.tipologia_associazione AS ENUM ('APS', 'ETS', 'ODV', 'Cooperativa', 'Altro');

-- Stato RUNTS
CREATE TYPE public.stato_runts AS ENUM ('dichiarato', 'verificato', 'non_iscritto');

-- Stato progetto Terzo Settore
CREATE TYPE public.stato_progetto_ts AS ENUM (
  'candidatura_inviata', 
  'in_valutazione', 
  'approvato', 
  'respinto', 
  'avviato', 
  'in_corso', 
  'completato'
);

-- Stato bando Terzo Settore
CREATE TYPE public.stato_bando_ts AS ENUM ('bozza', 'attivo', 'in_chiusura', 'concluso');

-- Tabella Associazioni Terzo Settore
CREATE TABLE public.associazioni_terzo_settore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  denominazione TEXT NOT NULL,
  tipologia public.tipologia_associazione NOT NULL DEFAULT 'Altro',
  codice_fiscale TEXT,
  partita_iva TEXT,
  stato_runts public.stato_runts DEFAULT 'dichiarato',
  numero_iscritti INTEGER DEFAULT 0,
  attiva BOOLEAN DEFAULT true,
  logo_url TEXT,
  email TEXT,
  pec TEXT,
  telefono TEXT,
  indirizzo TEXT,
  comune TEXT DEFAULT 'Cassino',
  descrizione TEXT,
  data_costituzione DATE,
  settori_intervento TEXT[],
  invitata_da UUID REFERENCES auth.users(id),
  token_invito TEXT UNIQUE,
  data_invito TIMESTAMPTZ,
  data_registrazione TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella Bandi Terzo Settore
CREATE TABLE public.bandi_terzo_settore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  descrizione TEXT,
  ambito TEXT,
  data_apertura DATE,
  data_chiusura DATE,
  stato public.stato_bando_ts DEFAULT 'bozza',
  plafond_totale NUMERIC(12,2) DEFAULT 0,
  plafond_impegnato NUMERIC(12,2) DEFAULT 0,
  requisiti_tipologia public.tipologia_associazione[],
  requisiti_runts public.stato_runts[],
  documenti_richiesti TEXT[],
  link_documentazione TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella Progetti Terzo Settore
CREATE TABLE public.progetti_terzo_settore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bando_id UUID REFERENCES public.bandi_terzo_settore(id) ON DELETE CASCADE,
  associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  stato public.stato_progetto_ts DEFAULT 'candidatura_inviata',
  importo_richiesto NUMERIC(12,2),
  importo_approvato NUMERIC(12,2),
  data_candidatura TIMESTAMPTZ DEFAULT now(),
  data_valutazione TIMESTAMPTZ,
  data_avvio DATE,
  data_completamento DATE,
  note_valutazione TEXT,
  valutato_da UUID REFERENCES auth.users(id),
  documenti_allegati JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella Attività Territorio
CREATE TABLE public.attivita_territorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  tipo TEXT,
  data_inizio DATE,
  data_fine DATE,
  luogo TEXT,
  patrocinato_comune BOOLEAN DEFAULT false,
  stato TEXT DEFAULT 'programmato',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella Comunicazioni Comune-Associazioni
CREATE TABLE public.comunicazioni_terzo_settore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mittente_id UUID REFERENCES auth.users(id),
  destinatario_associazione_id UUID REFERENCES public.associazioni_terzo_settore(id),
  destinatario_tutti BOOLEAN DEFAULT false,
  oggetto TEXT NOT NULL,
  corpo TEXT NOT NULL,
  letta BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.associazioni_terzo_settore ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bandi_terzo_settore ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progetti_terzo_settore ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attivita_territorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicazioni_terzo_settore ENABLE ROW LEVEL SECURITY;

-- RLS Policies per Associazioni Terzo Settore
CREATE POLICY "ts_assoc_comune_select"
ON public.associazioni_terzo_settore FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin') OR
  profile_id = auth.uid()
);

CREATE POLICY "ts_assoc_update_own"
ON public.associazioni_terzo_settore FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "ts_assoc_insert_comune"
ON public.associazioni_terzo_settore FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies per Bandi Terzo Settore
CREATE POLICY "ts_bandi_select"
ON public.bandi_terzo_settore FOR SELECT
TO authenticated
USING (
  stato IN ('attivo', 'in_chiusura', 'concluso') OR
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "ts_bandi_insert"
ON public.bandi_terzo_settore FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "ts_bandi_update"
ON public.bandi_terzo_settore FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "ts_bandi_delete"
ON public.bandi_terzo_settore FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies per Progetti Terzo Settore
CREATE POLICY "ts_progetti_select"
ON public.progetti_terzo_settore FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin') OR
  associazione_id IN (
    SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "ts_progetti_insert"
ON public.progetti_terzo_settore FOR INSERT
TO authenticated
WITH CHECK (
  associazione_id IN (
    SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "ts_progetti_update_comune"
ON public.progetti_terzo_settore FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies per Attività Territorio
CREATE POLICY "ts_attivita_select"
ON public.attivita_territorio FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'associazione')
);

CREATE POLICY "ts_attivita_insert"
ON public.attivita_territorio FOR INSERT
TO authenticated
WITH CHECK (
  associazione_id IN (
    SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "ts_attivita_update"
ON public.attivita_territorio FOR UPDATE
TO authenticated
USING (
  associazione_id IN (
    SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  associazione_id IN (
    SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "ts_attivita_delete"
ON public.attivita_territorio FOR DELETE
TO authenticated
USING (
  associazione_id IN (
    SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies per Comunicazioni
CREATE POLICY "ts_comunicazioni_select"
ON public.comunicazioni_terzo_settore FOR SELECT
TO authenticated
USING (
  mittente_id = auth.uid() OR
  destinatario_associazione_id IN (
    SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid()
  ) OR
  (destinatario_tutti = true AND public.has_role(auth.uid(), 'associazione')) OR
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "ts_comunicazioni_insert"
ON public.comunicazioni_terzo_settore FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'comune') OR 
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'admin')
);

-- Triggers per updated_at
CREATE TRIGGER update_associazioni_ts_updated_at
BEFORE UPDATE ON public.associazioni_terzo_settore
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bandi_ts_updated_at
BEFORE UPDATE ON public.bandi_terzo_settore
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_progetti_ts_updated_at
BEFORE UPDATE ON public.progetti_terzo_settore
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_attivita_territorio_updated_at
BEFORE UPDATE ON public.attivita_territorio
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();