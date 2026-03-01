-- 1. Creare funzione SECURITY DEFINER per ottenere gli ID delle aziende assegnate ai gestori pratiche
-- Questa funzione bypassa le RLS policies, rompendo il ciclo di ricorsione
CREATE OR REPLACE FUNCTION public.get_aziende_ids_for_gestore_pratiche(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT az.id 
  FROM aziende az
  JOIN gestori_pratiche_assegnazioni gpa 
    ON gpa.gestore_id = az.inserita_da_gestore_id 
    OR gpa.docente_id = az.inserita_da_docente_id
  JOIN gestori_pratiche gp 
    ON gp.id = gpa.gestore_pratiche_id
  WHERE gp.profile_id = _user_id
$$;

-- 2. Rimuovere la policy ricorsiva esistente
DROP POLICY IF EXISTS "Gestori pratiche can view assigned aziende" ON public.aziende;

-- 3. Creare nuova policy che usa la funzione security definer
DO $$ BEGIN
  CREATE POLICY "Gestori pratiche can view assigned aziende"
  ON public.aziende
  FOR SELECT
  USING (id IN (SELECT public.get_aziende_ids_for_gestore_pratiche(auth.uid())));
EXCEPTION WHEN OTHERS THEN NULL; END $$;