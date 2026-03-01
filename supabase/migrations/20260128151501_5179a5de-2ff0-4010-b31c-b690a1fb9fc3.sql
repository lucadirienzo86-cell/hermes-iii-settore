-- 1. Aggiungere colonna gestore_pratiche_id alla tabella pratiche
ALTER TABLE public.pratiche 
ADD COLUMN IF NOT EXISTS gestore_pratiche_id uuid REFERENCES public.gestori_pratiche(id);

-- 2. Creare funzione security definer per pratiche del gestore pratiche
CREATE OR REPLACE FUNCTION public.get_pratiche_for_gestore_pratiche(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id 
  FROM pratiche p
  JOIN gestori_pratiche gp ON p.gestore_pratiche_id = gp.id
  WHERE gp.profile_id = _user_id
$$;

-- 3. Creare funzione per pratiche non assegnate (stato richiesta)
CREATE OR REPLACE FUNCTION public.get_pratiche_non_assegnate()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id 
  FROM pratiche p
  WHERE p.stato = 'richiesta' AND p.gestore_pratiche_id IS NULL
$$;

-- 4. Rimuovere le policy esistenti sulla tabella pratiche
DROP POLICY IF EXISTS "Admins can manage pratiche" ON public.pratiche;
DROP POLICY IF EXISTS "Users can view pratiche for their aziende" ON public.pratiche;
DROP POLICY IF EXISTS "Gestori can view pratiche of their aziende" ON public.pratiche;
DROP POLICY IF EXISTS "Docenti can view pratiche of their aziende" ON public.pratiche;
DROP POLICY IF EXISTS "Gestori pratiche can view assigned pratiche" ON public.pratiche;

-- 5. Creare nuove policy RLS per pratiche

-- Admin: accesso completo
DO $$ BEGIN
  CREATE POLICY "Admin full access to pratiche"
  ON public.pratiche
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Azienda: può vedere solo le proprie pratiche
DO $$ BEGIN
  CREATE POLICY "Aziende can view own pratiche"
  ON public.pratiche
  FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM aziende WHERE profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Azienda: può inserire pratiche per la propria azienda
DO $$ BEGIN
  CREATE POLICY "Aziende can insert own pratiche"
  ON public.pratiche
  FOR INSERT
  WITH CHECK (
    azienda_id IN (
      SELECT id FROM aziende WHERE profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Gestori (professionisti): possono vedere pratiche delle proprie aziende
DO $$ BEGIN
  CREATE POLICY "Gestori can view their aziende pratiche"
  ON public.pratiche
  FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM aziende 
      WHERE inserita_da_gestore_id IN (
        SELECT id FROM gestori WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Gestori: possono inserire pratiche per le proprie aziende
DO $$ BEGIN
  CREATE POLICY "Gestori can insert pratiche for their aziende"
  ON public.pratiche
  FOR INSERT
  WITH CHECK (
    azienda_id IN (
      SELECT id FROM aziende 
      WHERE inserita_da_gestore_id IN (
        SELECT id FROM gestori WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Docenti: possono vedere pratiche delle proprie aziende
DO $$ BEGIN
  CREATE POLICY "Docenti can view their aziende pratiche"
  ON public.pratiche
  FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM aziende 
      WHERE inserita_da_docente_id IN (
        SELECT id FROM docenti WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Docenti: possono inserire pratiche per le proprie aziende
DO $$ BEGIN
  CREATE POLICY "Docenti can insert pratiche for their aziende"
  ON public.pratiche
  FOR INSERT
  WITH CHECK (
    azienda_id IN (
      SELECT id FROM aziende 
      WHERE inserita_da_docente_id IN (
        SELECT id FROM docenti WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Gestore Pratiche: può vedere pratiche "richiesta" non assegnate
DO $$ BEGIN
  CREATE POLICY "Gestore pratiche can view unassigned pratiche"
  ON public.pratiche
  FOR SELECT
  USING (
    has_role(auth.uid(), 'gestore_pratiche'::app_role) 
    AND id IN (SELECT get_pratiche_non_assegnate())
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Gestore Pratiche: può vedere le pratiche che ha preso in carico
DO $$ BEGIN
  CREATE POLICY "Gestore pratiche can view assigned pratiche"
  ON public.pratiche
  FOR SELECT
  USING (
    id IN (SELECT get_pratiche_for_gestore_pratiche(auth.uid()))
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Gestore Pratiche: può aggiornare solo le pratiche che ha preso in carico o prendere in carico nuove
DO $$ BEGIN
  CREATE POLICY "Gestore pratiche can update pratiche"
  ON public.pratiche
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'gestore_pratiche'::app_role) 
    AND (
      -- Può aggiornare le proprie pratiche assegnate
      id IN (SELECT get_pratiche_for_gestore_pratiche(auth.uid()))
      OR
      -- Può prendere in carico pratiche non assegnate
      (stato = 'richiesta' AND gestore_pratiche_id IS NULL)
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'gestore_pratiche'::app_role)
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;