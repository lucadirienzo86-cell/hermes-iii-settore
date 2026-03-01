-- Create ENTI table for institutional entities
CREATE TABLE public.enti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_ente TEXT NOT NULL,
  tipo_ente TEXT NOT NULL DEFAULT 'Comune', -- Comune, APS, ETS, ODV, Cooperativa
  stato_runts TEXT DEFAULT 'dichiarato', -- dichiarato, verificato, non_iscritto
  logo_url TEXT,
  indirizzo TEXT,
  email TEXT,
  telefono TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add institutional fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS cognome TEXT,
ADD COLUMN IF NOT EXISTS ente_id UUID REFERENCES public.enti(id),
ADD COLUMN IF NOT EXISTS ruolo_istituzionale TEXT, -- Assessore, Dirigente, Funzionario
ADD COLUMN IF NOT EXISTS ultimo_accesso TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;

-- Enable RLS on enti
ALTER TABLE public.enti ENABLE ROW LEVEL SECURITY;

-- RLS policies for enti
DO $$ BEGIN
  CREATE POLICY "enti_select_authenticated" ON public.enti
  FOR SELECT TO authenticated
  USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "enti_manage_admin" ON public.enti
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "enti_manage_comune" ON public.enti
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'comune'::app_role) OR has_role(auth.uid(), 'assessorato_terzo_settore'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Insert default Comune di Cassino entity
INSERT INTO public.enti (nome_ente, tipo_ente, stato_runts, attivo)
VALUES ('Comune di Cassino', 'Comune', 'verificato', true)
ON CONFLICT DO NOTHING;

-- Function to update ultimo_accesso on login
CREATE OR REPLACE FUNCTION public.update_ultimo_accesso()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET ultimo_accesso = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add update trigger for profiles
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DO $$ BEGIN
  CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add update trigger for enti
DROP TRIGGER IF EXISTS update_enti_updated_at ON public.enti;
DO $$ BEGIN
  CREATE TRIGGER update_enti_updated_at
  BEFORE UPDATE ON public.enti
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;