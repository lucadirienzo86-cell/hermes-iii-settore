-- Rimuove le policy problematiche che causano ricorsione
DROP POLICY IF EXISTS "Gestori can view assigned gestori_pratiche records" ON public.gestori_pratiche;
DROP POLICY IF EXISTS "Docenti can view assigned gestori_pratiche records" ON public.gestori_pratiche;

-- Crea funzione security definer per ottenere i gestori pratiche assegnati a un gestore
CREATE OR REPLACE FUNCTION public.get_gestori_pratiche_for_gestore(_profile_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gpa.gestore_pratiche_id 
  FROM gestori_pratiche_assegnazioni gpa
  JOIN gestori g ON gpa.gestore_id = g.id
  WHERE g.profile_id = _profile_id
$$;

-- Crea funzione security definer per ottenere i gestori pratiche assegnati a un docente
CREATE OR REPLACE FUNCTION public.get_gestori_pratiche_for_docente(_profile_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gpa.gestore_pratiche_id 
  FROM gestori_pratiche_assegnazioni gpa
  JOIN docenti d ON gpa.docente_id = d.id
  WHERE d.profile_id = _profile_id
$$;

-- Ricrea le policy usando le funzioni security definer
DO $$ BEGIN
  CREATE POLICY "Gestori can view assigned gestori_pratiche records"
  ON public.gestori_pratiche
  FOR SELECT
  USING (
    id IN (SELECT get_gestori_pratiche_for_gestore(auth.uid()))
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Docenti can view assigned gestori_pratiche records"
  ON public.gestori_pratiche
  FOR SELECT
  USING (
    id IN (SELECT get_gestori_pratiche_for_docente(auth.uid()))
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;