-- =====================================================
-- CATEGORIE ASSOCIAZIONI (settori)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categorie_associazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descrizione TEXT,
  colore TEXT DEFAULT '#3498db',
  icona TEXT DEFAULT 'tag',
  ordine INTEGER DEFAULT 0,
  attiva BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default categories
INSERT INTO public.categorie_associazioni (nome, descrizione, colore, icona, ordine) VALUES
  ('Longevity', 'Associazioni che si occupano di terza età e invecchiamento attivo', '#22c55e', 'heart-handshake', 1),
  ('Hospitality', 'Associazioni nel settore accoglienza e turismo sociale', '#3b82f6', 'hotel', 2),
  ('Eventi', 'Associazioni che organizzano eventi culturali e sociali', '#f59e0b', 'calendar', 3),
  ('Sport', 'Associazioni sportive dilettantistiche', '#ef4444', 'trophy', 4),
  ('Cultura', 'Associazioni culturali e artistiche', '#8b5cf6', 'book-open', 5),
  ('Ambiente', 'Associazioni ambientaliste e protezione territorio', '#10b981', 'leaf', 6),
  ('Sociale', 'Associazioni di assistenza sociale e volontariato', '#ec4899', 'users', 7),
  ('Giovani', 'Associazioni giovanili e scolastiche', '#06b6d4', 'graduation-cap', 8),
  ('Disabilità', 'Associazioni per persone con disabilità', '#6366f1', 'accessibility', 9),
  ('Altro', 'Altre tipologie non classificate', '#64748b', 'folder', 99)
ON CONFLICT (nome) DO NOTHING;

-- Add category reference to associazioni
ALTER TABLE public.associazioni_terzo_settore 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorie_associazioni(id);

-- RLS
ALTER TABLE public.categorie_associazioni ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Categorie visibili a tutti" 
  ON public.categorie_associazioni FOR SELECT 
  TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Solo admin modifica categorie"
  ON public.categorie_associazioni FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =====================================================
-- RASSEGNA STAMPA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rassegna_stampa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  fonte TEXT,
  url TEXT,
  data_pubblicazione DATE,
  tipo TEXT CHECK (tipo IN ('articolo', 'comunicato', 'determina', 'delibera', 'altro')) DEFAULT 'articolo',
  contenuto TEXT,
  allegato_url TEXT,
  associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE SET NULL,
  bando_id UUID REFERENCES public.bandi_terzo_settore(id) ON DELETE SET NULL,
  visibilita TEXT CHECK (visibilita IN ('pubblico', 'interno', 'riservato')) DEFAULT 'interno',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.rassegna_stampa ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Rassegna stampa pubblica visibile a tutti"
  ON public.rassegna_stampa FOR SELECT
  TO authenticated
  USING (visibilita = 'pubblico' OR public.has_role(auth.uid(), 'comune') OR public.has_role(auth.uid(), 'assessorato_terzo_settore') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Istituzionali gestiscono rassegna"
  ON public.rassegna_stampa FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'comune') OR public.has_role(auth.uid(), 'assessorato_terzo_settore') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'comune') OR public.has_role(auth.uid(), 'assessorato_terzo_settore') OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =====================================================
-- NOTIFICHE ISTITUZIONALI
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifiche_istituzionali (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'nuova_associazione', 
    'scadenza_bando', 
    'scadenza_progetto', 
    'scadenza_rendiconto',
    'partecipazione_bando',
    'documento_mancante',
    'gara_pubblicazione',
    'determina_pubblicazione',
    'registrazione_anomala',
    'altro'
  )),
  titolo TEXT NOT NULL,
  messaggio TEXT,
  priorita TEXT CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente')) DEFAULT 'media',
  letta BOOLEAN DEFAULT false,
  data_scadenza DATE,
  link_azione TEXT,
  entity_type TEXT,
  entity_id UUID,
  destinatario_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.notifiche_istituzionali ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Utenti vedono proprie notifiche"
  ON public.notifiche_istituzionali FOR SELECT
  TO authenticated
  USING (
    destinatario_id = auth.uid() 
    OR destinatario_id IS NULL 
    OR public.has_role(auth.uid(), 'admin')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Sistema crea notifiche"
  ON public.notifiche_istituzionali FOR INSERT
  TO authenticated
  WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Utenti aggiornano proprie notifiche"
  ON public.notifiche_istituzionali FOR UPDATE
  TO authenticated
  USING (destinatario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rassegna_stampa_tipo ON public.rassegna_stampa(tipo);
CREATE INDEX IF NOT EXISTS idx_rassegna_stampa_data ON public.rassegna_stampa(data_pubblicazione DESC);
CREATE INDEX IF NOT EXISTS idx_notifiche_istituzionali_destinatario ON public.notifiche_istituzionali(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notifiche_istituzionali_tipo ON public.notifiche_istituzionali(tipo);
CREATE INDEX IF NOT EXISTS idx_notifiche_istituzionali_letta ON public.notifiche_istituzionali(letta);
CREATE INDEX IF NOT EXISTS idx_categorie_associazioni_ordine ON public.categorie_associazioni(ordine);