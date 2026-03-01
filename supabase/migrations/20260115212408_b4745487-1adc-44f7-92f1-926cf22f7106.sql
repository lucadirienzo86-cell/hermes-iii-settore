-- Add in_apertura flag to bandi and avvisi_fondi
ALTER TABLE public.bandi
ADD COLUMN IF NOT EXISTS in_apertura BOOLEAN DEFAULT false;

ALTER TABLE public.avvisi_fondi
ADD COLUMN IF NOT EXISTS in_apertura BOOLEAN DEFAULT false;

-- Create requisiti_bando master table
CREATE TABLE public.requisiti_bando (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  icona TEXT,
  obbligatorio_default BOOLEAN DEFAULT false,
  attivo BOOLEAN DEFAULT true,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requisiti_bando ENABLE ROW LEVEL SECURITY;

-- RLS policies for requisiti_bando
DO $$ BEGIN
  CREATE POLICY "Requisiti visibili a tutti gli utenti autenticati"
    ON public.requisiti_bando FOR SELECT
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin e editori possono gestire requisiti"
    ON public.requisiti_bando FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create bandi_requisiti pivot table
CREATE TABLE public.bandi_requisiti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bando_id UUID NOT NULL REFERENCES public.bandi(id) ON DELETE CASCADE,
  requisito_id UUID NOT NULL REFERENCES public.requisiti_bando(id) ON DELETE CASCADE,
  obbligatorio BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bando_id, requisito_id)
);

-- Enable RLS
ALTER TABLE public.bandi_requisiti ENABLE ROW LEVEL SECURITY;

-- RLS policies for bandi_requisiti
DO $$ BEGIN
  CREATE POLICY "Bandi requisiti visibili a tutti gli autenticati"
    ON public.bandi_requisiti FOR SELECT
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin e editori possono gestire bandi_requisiti"
    ON public.bandi_requisiti FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create avvisi_requisiti pivot table
CREATE TABLE public.avvisi_requisiti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avviso_id UUID NOT NULL REFERENCES public.avvisi_fondi(id) ON DELETE CASCADE,
  requisito_id UUID NOT NULL REFERENCES public.requisiti_bando(id) ON DELETE CASCADE,
  obbligatorio BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(avviso_id, requisito_id)
);

-- Enable RLS
ALTER TABLE public.avvisi_requisiti ENABLE ROW LEVEL SECURITY;

-- RLS policies for avvisi_requisiti
DO $$ BEGIN
  CREATE POLICY "Avvisi requisiti visibili a tutti gli autenticati"
    ON public.avvisi_requisiti FOR SELECT
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin e editori possono gestire avvisi_requisiti"
    ON public.avvisi_requisiti FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Insert default requisiti
INSERT INTO public.requisiti_bando (nome, descrizione, icona, obbligatorio_default, ordine) VALUES
('Obbligo assicurazione catastrofale', 'Richiesta polizza assicurativa contro eventi catastrofali', '🛡️', true, 1),
('Certificazione ambientale ISO 14001', 'Sistema di gestione ambientale certificato', '🌱', false, 2),
('DURC regolare', 'Documento Unico di Regolarità Contributiva in corso di validità', '📋', true, 3),
('Iscrizione Camera di Commercio', 'Iscrizione attiva alla CCIAA', '🏛️', false, 4),
('Rating di legalità', 'Possesso del rating di legalità AGCM', '⭐', false, 5),
('Certificazione qualità ISO 9001', 'Sistema di gestione qualità certificato', '✅', false, 6),
('Regolarità contributiva', 'Assenza di irregolarità nei versamenti contributivi', '💰', true, 7),
('Nessun procedimento penale', 'Assenza di procedimenti penali in corso a carico dei legali rappresentanti', '⚖️', true, 8);

-- Trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_requisiti_bando_updated_at
    BEFORE UPDATE ON public.requisiti_bando
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;