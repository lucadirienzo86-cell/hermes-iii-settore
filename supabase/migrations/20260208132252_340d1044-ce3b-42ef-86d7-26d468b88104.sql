-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Pro Loco table for entity data
CREATE TABLE public.pro_loco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  denominazione TEXT NOT NULL,
  codice_fiscale TEXT UNIQUE,
  partita_iva TEXT,
  indirizzo TEXT,
  comune TEXT,
  provincia TEXT,
  regione TEXT,
  telefono TEXT,
  email TEXT,
  pec TEXT,
  sito_web TEXT,
  presidente TEXT,
  data_costituzione DATE,
  numero_iscritti INTEGER DEFAULT 0,
  quota_associativa NUMERIC(10,2) DEFAULT 0,
  manu_pay_enabled BOOLEAN DEFAULT false,
  manu_pay_account_id TEXT,
  attiva BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table for Pro Loco -> Associations relationship
CREATE TABLE public.pro_loco_associazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE CASCADE NOT NULL,
  associazione_id UUID REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE NOT NULL,
  data_adesione DATE DEFAULT CURRENT_DATE,
  stato TEXT DEFAULT 'attiva' CHECK (stato IN ('attiva', 'sospesa', 'cessata', 'in_attesa')),
  quota_pagata BOOLEAN DEFAULT false,
  data_ultimo_pagamento DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pro_loco_id, associazione_id)
);

-- Invitations table for Pro Loco to invite associations
CREATE TABLE public.pro_loco_inviti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE CASCADE NOT NULL,
  email_destinatario TEXT NOT NULL,
  denominazione_associazione TEXT,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  stato TEXT DEFAULT 'inviato' CHECK (stato IN ('inviato', 'accettato', 'rifiutato', 'scaduto')),
  data_invio TIMESTAMPTZ DEFAULT now(),
  data_risposta TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add pro_loco_id reference to associations (optional affiliation)
ALTER TABLE public.associazioni_terzo_settore 
ADD COLUMN IF NOT EXISTS pro_loco_id UUID REFERENCES public.pro_loco(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.pro_loco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_loco_associazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_loco_inviti ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pro_loco table
CREATE POLICY "Pro Loco can view own data"
ON public.pro_loco FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Pro Loco can update own data"
ON public.pro_loco FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Pro Loco can insert own data"
ON public.pro_loco FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view all Pro Loco"
ON public.pro_loco FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Comune e Assessorato can view Pro Loco"
ON public.pro_loco FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'comune') OR public.has_role(auth.uid(), 'assessorato_terzo_settore'));

-- RLS Policies for pro_loco_associazioni
CREATE POLICY "Pro Loco can manage own associations"
ON public.pro_loco_associazioni FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pro_loco 
    WHERE id = pro_loco_id AND profile_id = auth.uid()
  )
);

CREATE POLICY "Associations can view own membership"
ON public.pro_loco_associazioni FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.associazioni_terzo_settore 
    WHERE id = associazione_id AND profile_id = auth.uid()
  )
);

CREATE POLICY "Comune e Assessorato can view all memberships"
ON public.pro_loco_associazioni FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'comune') OR public.has_role(auth.uid(), 'assessorato_terzo_settore') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pro_loco_inviti
CREATE POLICY "Pro Loco can manage own invitations"
ON public.pro_loco_inviti FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pro_loco 
    WHERE id = pro_loco_id AND profile_id = auth.uid()
  )
);

-- Update timestamp trigger for pro_loco
CREATE TRIGGER update_pro_loco_updated_at
BEFORE UPDATE ON public.pro_loco
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for pro_loco_associazioni
CREATE TRIGGER update_pro_loco_associazioni_updated_at
BEFORE UPDATE ON public.pro_loco_associazioni
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();