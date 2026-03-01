-- =============================================
-- 1. ADD MISSING COLUMNS TO USER_ROLES
-- =============================================

ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS ente_id UUID NULL,
ADD COLUMN IF NOT EXISTS associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================
-- 2. PAYMENT TYPES ENUMS
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_link_type') THEN
    CREATE TYPE public.payment_link_type AS ENUM ('donazione', 'evento', 'prodotto', 'quota_associativa');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'expired', 'refunded');
  END IF;
END $$;

-- =============================================
-- 3. PAYMENT LINKS TABLE (Manu Pay Integration)
-- =============================================

CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
    pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE CASCADE,
    tipo payment_link_type NOT NULL,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    importo_fisso NUMERIC(10,2),
    importo_minimo NUMERIC(10,2) DEFAULT 1.00,
    importo_massimo NUMERIC(10,2),
    attivo BOOLEAN DEFAULT true,
    slug TEXT UNIQUE,
    scadenza TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    external_link_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. PAGAMENTI/TRANSACTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.pagamenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
    associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE SET NULL,
    pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE SET NULL,
    tipo payment_link_type NOT NULL,
    importo NUMERIC(10,2) NOT NULL,
    valuta TEXT DEFAULT 'EUR',
    stato payment_status DEFAULT 'pending',
    email_pagatore TEXT,
    nome_pagatore TEXT,
    external_transaction_id TEXT,
    external_status TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pagamenti ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. DONAZIONI TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.donazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pagamento_id UUID REFERENCES public.pagamenti(id) ON DELETE SET NULL,
    associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE NOT NULL,
    importo NUMERIC(10,2) NOT NULL,
    messaggio TEXT,
    anonima BOOLEAN DEFAULT false,
    email_donatore TEXT,
    nome_donatore TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.donazioni ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. EVENTI ASSOCIAZIONE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.eventi_associazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE NOT NULL,
    pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE SET NULL,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    luogo TEXT,
    data_inizio TIMESTAMPTZ NOT NULL,
    data_fine TIMESTAMPTZ,
    prezzo_biglietto NUMERIC(10,2),
    posti_disponibili INTEGER,
    posti_venduti INTEGER DEFAULT 0,
    immagine_url TEXT,
    payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.eventi_associazione ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. PRODOTTI ASSOCIAZIONE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.prodotti_associazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE NOT NULL,
    pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    descrizione TEXT,
    prezzo NUMERIC(10,2) NOT NULL,
    quantita_disponibile INTEGER,
    immagine_url TEXT,
    payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
    attivo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.prodotti_associazione ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. QUOTE ASSOCIATIVE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.quote_associative (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE CASCADE NOT NULL,
    associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE NOT NULL,
    anno INTEGER NOT NULL,
    importo NUMERIC(10,2) NOT NULL,
    pagamento_id UUID REFERENCES public.pagamenti(id) ON DELETE SET NULL,
    stato payment_status DEFAULT 'pending',
    data_scadenza DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (pro_loco_id, associazione_id, anno)
);

ALTER TABLE public.quote_associative ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. RLS POLICIES - Using profile_id approach
-- =============================================

-- Payment Links - based on associazione.profile_id
DO $$ BEGIN
  CREATE POLICY "Owners can manage their payment links"
  ON public.payment_links FOR ALL
  USING (
      EXISTS (
          SELECT 1 FROM public.associazioni_terzo_settore a 
          WHERE a.id = payment_links.associazione_id AND a.profile_id = auth.uid()
      )
      OR EXISTS (
          SELECT 1 FROM public.pro_loco p 
          WHERE p.id = payment_links.pro_loco_id AND p.profile_id = auth.uid()
      )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view active payment links"
  ON public.payment_links FOR SELECT
  USING (attivo = true AND (scadenza IS NULL OR scadenza > now()));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Pagamenti
DO $$ BEGIN
  CREATE POLICY "Owners can view their payments"
  ON public.pagamenti FOR SELECT
  USING (
      EXISTS (
          SELECT 1 FROM public.associazioni_terzo_settore a 
          WHERE a.id = pagamenti.associazione_id AND a.profile_id = auth.uid()
      )
      OR EXISTS (
          SELECT 1 FROM public.pro_loco p 
          WHERE p.id = pagamenti.pro_loco_id AND p.profile_id = auth.uid()
      )
      OR public.has_role(auth.uid(), 'admin')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Donazioni
DO $$ BEGIN
  CREATE POLICY "Associations can view their donations"
  ON public.donazioni FOR SELECT
  USING (
      EXISTS (
          SELECT 1 FROM public.associazioni_terzo_settore a 
          WHERE a.id = donazioni.associazione_id AND a.profile_id = auth.uid()
      )
      OR public.has_role(auth.uid(), 'admin')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Eventi
DO $$ BEGIN
  CREATE POLICY "Owners can manage their events"
  ON public.eventi_associazione FOR ALL
  USING (
      EXISTS (
          SELECT 1 FROM public.associazioni_terzo_settore a 
          WHERE a.id = eventi_associazione.associazione_id AND a.profile_id = auth.uid()
      )
      OR EXISTS (
          SELECT 1 FROM public.pro_loco p 
          WHERE p.id = eventi_associazione.pro_loco_id AND p.profile_id = auth.uid()
      )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view active events"
  ON public.eventi_associazione FOR SELECT
  USING (attivo = true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Prodotti
DO $$ BEGIN
  CREATE POLICY "Owners can manage their products"
  ON public.prodotti_associazione FOR ALL
  USING (
      EXISTS (
          SELECT 1 FROM public.associazioni_terzo_settore a 
          WHERE a.id = prodotti_associazione.associazione_id AND a.profile_id = auth.uid()
      )
      OR EXISTS (
          SELECT 1 FROM public.pro_loco p 
          WHERE p.id = prodotti_associazione.pro_loco_id AND p.profile_id = auth.uid()
      )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view active products"
  ON public.prodotti_associazione FOR SELECT
  USING (attivo = true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Quote
DO $$ BEGIN
  CREATE POLICY "Pro Loco can manage their quotes"
  ON public.quote_associative FOR ALL
  USING (
      EXISTS (
          SELECT 1 FROM public.pro_loco p 
          WHERE p.id = quote_associative.pro_loco_id AND p.profile_id = auth.uid()
      )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Associations can view their quotes"
  ON public.quote_associative FOR SELECT
  USING (
      EXISTS (
          SELECT 1 FROM public.associazioni_terzo_settore a 
          WHERE a.id = quote_associative.associazione_id AND a.profile_id = auth.uid()
      )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================
-- 10. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_roles_associazione ON public.user_roles(associazione_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_pro_loco ON public.user_roles(pro_loco_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_associazione ON public.payment_links(associazione_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_pro_loco ON public.payment_links(pro_loco_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON public.payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_pagamenti_associazione ON public.pagamenti(associazione_id);
CREATE INDEX IF NOT EXISTS idx_pagamenti_stato ON public.pagamenti(stato);
CREATE INDEX IF NOT EXISTS idx_donazioni_associazione ON public.donazioni(associazione_id);
CREATE INDEX IF NOT EXISTS idx_eventi_associazione ON public.eventi_associazione(associazione_id);
CREATE INDEX IF NOT EXISTS idx_prodotti_associazione ON public.prodotti_associazione(associazione_id);
CREATE INDEX IF NOT EXISTS idx_quote_pro_loco ON public.quote_associative(pro_loco_id);

-- =============================================
-- 11. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
DO $$ BEGIN
  CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_payment_links_updated_at ON public.payment_links;
DO $$ BEGIN
  CREATE TRIGGER update_payment_links_updated_at
  BEFORE UPDATE ON public.payment_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_pagamenti_updated_at ON public.pagamenti;
DO $$ BEGIN
  CREATE TRIGGER update_pagamenti_updated_at
  BEFORE UPDATE ON public.pagamenti
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_eventi_associazione_updated_at ON public.eventi_associazione;
DO $$ BEGIN
  CREATE TRIGGER update_eventi_associazione_updated_at
  BEFORE UPDATE ON public.eventi_associazione
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_prodotti_associazione_updated_at ON public.prodotti_associazione;
DO $$ BEGIN
  CREATE TRIGGER update_prodotti_associazione_updated_at
  BEFORE UPDATE ON public.prodotti_associazione
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_quote_associative_updated_at ON public.quote_associative;
DO $$ BEGIN
  CREATE TRIGGER update_quote_associative_updated_at
  BEFORE UPDATE ON public.quote_associative
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================
-- 12. HELPER FUNCTION FOR USER ROLE
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;