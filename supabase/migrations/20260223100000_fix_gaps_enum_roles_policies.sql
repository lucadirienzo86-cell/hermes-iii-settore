-- ============================================================
-- FIX GAP 1: Estende app_role ENUM con i ruoli mancanti
-- (comune, assessorato_terzo_settore, pro_loco, associazione, docente)
-- ============================================================

DO $$
BEGIN
  -- Aggiunge i valori mancanti all'ENUM solo se non esistono già
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'comune'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'comune';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'assessorato_terzo_settore'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'assessorato_terzo_settore';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'pro_loco'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'pro_loco';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'associazione'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'associazione';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'docente'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'docente';
  END IF;
END $$;

-- ============================================================
-- FIX GAP 2: Aggiunge policy INSERT/UPDATE su user_roles
-- (solo admin può gestire i ruoli altrui)
-- ============================================================

-- Admin può inserire ruoli
DROP POLICY IF EXISTS "Admin può inserire ruoli" ON public.user_roles;
CREATE POLICY "Admin può inserire ruoli"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin può aggiornare ruoli
DROP POLICY IF EXISTS "Admin può aggiornare ruoli" ON public.user_roles;
CREATE POLICY "Admin può aggiornare ruoli"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admin può eliminare ruoli
DROP POLICY IF EXISTS "Admin può eliminare ruoli" ON public.user_roles;
CREATE POLICY "Admin può eliminare ruoli"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX GAP 3: Funzione SECURITY DEFINER per auto-assegnazione ruolo
-- Permette a un utente appena registrato di assegnarsi un ruolo
-- SOLO se non ne ha ancora uno (protezione da escalation)
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_initial_role(p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Blocca se l'utente ha già un ruolo
  IF EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Ruolo già assegnato. Contatta l''amministratore.';
  END IF;

  -- Blocca ruoli privilegiati
  IF p_role IN ('admin', 'editore') THEN
    RAISE EXCEPTION 'Ruolo non assegnabile autonomamente.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), p_role::app_role);
END;
$$;

-- Revoca accesso public, concede solo agli autenticati
REVOKE ALL ON FUNCTION public.assign_initial_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_initial_role(text) TO authenticated;

-- ============================================================
-- FIX GAP 4: Aggiunge colonna inserita_da_docente_id ad aziende
-- (referenziata nelle RLS policies ma non presente nella tabella)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aziende'
    AND column_name = 'inserita_da_docente_id'
  ) THEN
    ALTER TABLE public.aziende
    ADD COLUMN inserita_da_docente_id UUID REFERENCES public.docenti(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_aziende_docente_id
    ON public.aziende(inserita_da_docente_id);
  END IF;
END $$;

-- ============================================================
-- FIX GAP 5: Policy user_roles per i ruoli terzo settore
-- (comune/assessorato/pro_loco/associazione possono vedere i propri ruoli)
-- Era già coperto dalla policy esistente SELECT self - conferma
-- ============================================================

-- Nessuna modifica necessaria (policy esistente copre già SELECT self)

-- ============================================================
-- INFO: Come usare assign_initial_role dal frontend
-- dopo supabase.auth.signUp():
--
--   await supabase.rpc('assign_initial_role', { p_role: 'comune' })
--
-- ============================================================
