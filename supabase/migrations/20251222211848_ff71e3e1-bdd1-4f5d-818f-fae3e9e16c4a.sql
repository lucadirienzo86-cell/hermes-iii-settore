-- =============================================
-- FASE 3: Sistema Badge
-- =============================================

-- Tabella tipi di badge
CREATE TABLE public.badge_tipi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descrizione TEXT,
  icona TEXT,
  colore TEXT DEFAULT '#3B82F6',
  categoria TEXT NOT NULL DEFAULT 'generale',
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella assegnazioni badge
CREATE TABLE public.badge_assegnazioni (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_tipo_id UUID NOT NULL REFERENCES public.badge_tipi(id) ON DELETE CASCADE,
  -- Riferimenti polimorfici (uno solo sarà valorizzato)
  docente_id UUID REFERENCES public.docenti(id) ON DELETE CASCADE,
  collaboratore_id UUID REFERENCES public.collaboratori(id) ON DELETE CASCADE,
  azienda_id UUID REFERENCES public.aziende(id) ON DELETE CASCADE,
  -- Metadata
  assegnato_da UUID REFERENCES auth.users(id),
  note TEXT,
  data_scadenza DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Vincolo: almeno un riferimento deve essere valorizzato
  CONSTRAINT badge_assegnazione_target CHECK (
    (docente_id IS NOT NULL)::int + 
    (collaboratore_id IS NOT NULL)::int + 
    (azienda_id IS NOT NULL)::int = 1
  )
);

-- Indici per performance
CREATE INDEX idx_badge_assegnazioni_docente ON public.badge_assegnazioni(docente_id) WHERE docente_id IS NOT NULL;
CREATE INDEX idx_badge_assegnazioni_collaboratore ON public.badge_assegnazioni(collaboratore_id) WHERE collaboratore_id IS NOT NULL;
CREATE INDEX idx_badge_assegnazioni_azienda ON public.badge_assegnazioni(azienda_id) WHERE azienda_id IS NOT NULL;
CREATE INDEX idx_badge_assegnazioni_tipo ON public.badge_assegnazioni(badge_tipo_id);

-- RLS per badge_tipi
ALTER TABLE public.badge_tipi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage badge_tipi"
ON public.badge_tipi FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone authenticated can view active badge_tipi"
ON public.badge_tipi FOR SELECT
USING (auth.uid() IS NOT NULL AND attivo = true);

-- RLS per badge_assegnazioni
ALTER TABLE public.badge_assegnazioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage badge_assegnazioni"
ON public.badge_assegnazioni FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own badges"
ON public.badge_assegnazioni FOR SELECT
USING (
  -- Docenti vedono i propri badge
  (docente_id IN (SELECT id FROM public.docenti WHERE profile_id = auth.uid()))
  OR
  -- Collaboratori vedono i propri badge
  (collaboratore_id IN (SELECT id FROM public.collaboratori WHERE profile_id = auth.uid()))
  OR
  -- Aziende vedono i propri badge
  (azienda_id IN (SELECT id FROM public.aziende WHERE profile_id = auth.uid()))
);

-- Trigger per updated_at
CREATE TRIGGER update_badge_tipi_updated_at
BEFORE UPDATE ON public.badge_tipi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- FASE 4: Fondi Interprofessionali
-- =============================================

-- Tabella fondi interprofessionali
CREATE TABLE public.fondi_interprofessionali (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codice TEXT UNIQUE,
  descrizione TEXT,
  sito_web TEXT,
  email_contatto TEXT,
  telefono TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella avvisi dei fondi
CREATE TABLE public.avvisi_fondi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fondo_id UUID NOT NULL REFERENCES public.fondi_interprofessionali(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  numero_avviso TEXT,
  importo_minimo NUMERIC,
  importo_massimo NUMERIC,
  data_apertura DATE,
  data_chiusura DATE,
  -- Criteri di eleggibilità (simili ai bandi)
  settore_ateco TEXT[],
  regioni TEXT[],
  dimensione_azienda TEXT[],
  numero_dipendenti TEXT[],
  tematiche TEXT[],
  -- Metadata
  link_avviso TEXT,
  note TEXT,
  attivo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella adesioni aziende ai fondi
CREATE TABLE public.aziende_fondi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES public.aziende(id) ON DELETE CASCADE,
  fondo_id UUID NOT NULL REFERENCES public.fondi_interprofessionali(id) ON DELETE CASCADE,
  data_adesione DATE,
  matricola_inps TEXT,
  note TEXT,
  verificato BOOLEAN DEFAULT false,
  verificato_da UUID REFERENCES auth.users(id),
  data_verifica TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(azienda_id, fondo_id)
);

-- Indici per performance
CREATE INDEX idx_avvisi_fondi_fondo ON public.avvisi_fondi(fondo_id);
CREATE INDEX idx_avvisi_fondi_date ON public.avvisi_fondi(data_apertura, data_chiusura);
CREATE INDEX idx_aziende_fondi_azienda ON public.aziende_fondi(azienda_id);
CREATE INDEX idx_aziende_fondi_fondo ON public.aziende_fondi(fondo_id);

-- RLS per fondi_interprofessionali
ALTER TABLE public.fondi_interprofessionali ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fondi"
ON public.fondi_interprofessionali FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone authenticated can view active fondi"
ON public.fondi_interprofessionali FOR SELECT
USING (auth.uid() IS NOT NULL AND attivo = true);

-- RLS per avvisi_fondi
ALTER TABLE public.avvisi_fondi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editori can manage avvisi"
ON public.avvisi_fondi FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editore'));

CREATE POLICY "Anyone authenticated can view active avvisi"
ON public.avvisi_fondi FOR SELECT
USING (auth.uid() IS NOT NULL AND attivo = true);

-- RLS per aziende_fondi
ALTER TABLE public.aziende_fondi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage aziende_fondi"
ON public.aziende_fondi FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestori can manage their aziende fondi"
ON public.aziende_fondi FOR ALL
USING (
  azienda_id IN (
    SELECT id FROM public.aziende 
    WHERE inserita_da_gestore_id IN (
      SELECT id FROM public.gestori WHERE profile_id = auth.uid()
    )
  )
);

CREATE POLICY "Collaboratori can manage their aziende fondi"
ON public.aziende_fondi FOR ALL
USING (
  azienda_id IN (
    SELECT id FROM public.aziende 
    WHERE inserita_da_collaboratore_id IN (
      SELECT id FROM public.collaboratori WHERE profile_id = auth.uid()
    )
  )
);

CREATE POLICY "Aziende can view their own fondi"
ON public.aziende_fondi FOR SELECT
USING (
  azienda_id IN (
    SELECT id FROM public.aziende WHERE profile_id = auth.uid()
  )
);

-- Triggers per updated_at
CREATE TRIGGER update_fondi_interprofessionali_updated_at
BEFORE UPDATE ON public.fondi_interprofessionali
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_avvisi_fondi_updated_at
BEFORE UPDATE ON public.avvisi_fondi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_aziende_fondi_updated_at
BEFORE UPDATE ON public.aziende_fondi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Inserisco alcuni fondi interprofessionali di esempio
INSERT INTO public.fondi_interprofessionali (nome, codice, descrizione, sito_web, attivo) VALUES
('Fondimpresa', 'FIMP', 'Fondo interprofessionale per la formazione continua nelle imprese', 'https://www.fondimpresa.it', true),
('Fondirigenti', 'FDIR', 'Fondo interprofessionale per la formazione dei dirigenti', 'https://www.fondirigenti.it', true),
('Fondo Artigianato Formazione', 'FAF', 'Fondo interprofessionale per la formazione nelle imprese artigiane', 'https://www.fondartigianato.it', true),
('For.Te', 'FORT', 'Fondo per la formazione continua del terziario', 'https://www.forte.it', true),
('FonCoop', 'FCOO', 'Fondo per la formazione nelle imprese cooperative', 'https://www.foncoop.coop', true)
ON CONFLICT DO NOTHING;

-- Inserisco alcuni tipi di badge di esempio
INSERT INTO public.badge_tipi (nome, descrizione, icona, colore, categoria, attivo) VALUES
('Esperto Fondimpresa', 'Docente con esperienza comprovata su Fondimpresa', 'Award', '#10B981', 'competenza', true),
('Specialista Digitale', 'Competenze certificate in trasformazione digitale', 'Cpu', '#3B82F6', 'competenza', true),
('Formatore Certificato', 'Certificazione come formatore professionale', 'GraduationCap', '#8B5CF6', 'certificazione', true),
('Top Performer', 'Risultati eccellenti nelle pratiche gestite', 'Star', '#F59E0B', 'merito', true),
('Partner Affidabile', 'Collaboratore o azienda con storico positivo', 'Shield', '#059669', 'affidabilita', true)
ON CONFLICT DO NOTHING;