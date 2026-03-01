-- Add new columns for onboarding flow
ALTER TABLE public.associazioni_terzo_settore 
ADD COLUMN IF NOT EXISTS stato_registrazione text DEFAULT 'in_attesa';

ALTER TABLE public.associazioni_terzo_settore 
ADD COLUMN IF NOT EXISTS onboarding_completato boolean DEFAULT false;

ALTER TABLE public.associazioni_terzo_settore 
ADD COLUMN IF NOT EXISTS iscrizione_albo_comunale boolean DEFAULT false;

-- Update the SELECT policy to include pro_loco
DROP POLICY IF EXISTS "ts_assoc_comune_select" ON public.associazioni_terzo_settore;

DO $$ BEGIN
  CREATE POLICY "ts_assoc_comune_select"
  ON public.associazioni_terzo_settore
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'comune')
    OR public.has_role(auth.uid(), 'assessorato_terzo_settore')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'pro_loco')
    OR (profile_id = auth.uid())
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Update the INSERT policy to include pro_loco
DROP POLICY IF EXISTS "ts_assoc_insert_comune" ON public.associazioni_terzo_settore;

DO $$ BEGIN
  CREATE POLICY "ts_assoc_insert_comune"
  ON public.associazioni_terzo_settore
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'comune')
    OR public.has_role(auth.uid(), 'assessorato_terzo_settore')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'pro_loco')
    OR (profile_id = auth.uid())
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;