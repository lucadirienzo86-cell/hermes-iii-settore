-- 1) Helper functions to avoid RLS recursion when a gestore_pratiche needs to read assigned gestori/docenti
CREATE OR REPLACE FUNCTION public.get_gestori_ids_for_gestore_pratiche(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT gpa.gestore_id
  FROM public.gestori_pratiche_assegnazioni gpa
  JOIN public.gestori_pratiche gp ON gp.id = gpa.gestore_pratiche_id
  WHERE gp.profile_id = _user_id
    AND gpa.gestore_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_docenti_ids_for_gestore_pratiche(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT gpa.docente_id
  FROM public.gestori_pratiche_assegnazioni gpa
  JOIN public.gestori_pratiche gp ON gp.id = gpa.gestore_pratiche_id
  WHERE gp.profile_id = _user_id
    AND gpa.docente_id IS NOT NULL;
$$;

-- 2) Replace the policies created earlier with versions that use the helper functions
DROP POLICY IF EXISTS "Gestori Pratiche can view assigned gestori" ON public.gestori;
CREATE POLICY "Gestori Pratiche can view assigned gestori"
ON public.gestori
FOR SELECT
USING (
  id IN (
    SELECT public.get_gestori_ids_for_gestore_pratiche(auth.uid())
  )
);

DROP POLICY IF EXISTS "Gestori Pratiche can view assigned docenti" ON public.docenti;
CREATE POLICY "Gestori Pratiche can view assigned docenti"
ON public.docenti
FOR SELECT
USING (
  id IN (
    SELECT public.get_docenti_ids_for_gestore_pratiche(auth.uid())
  )
);