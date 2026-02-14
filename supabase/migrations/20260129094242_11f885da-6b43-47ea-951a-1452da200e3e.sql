-- Add column to track aziende created by gestori_pratiche
ALTER TABLE public.aziende 
ADD COLUMN inserita_da_gestore_pratiche_id uuid REFERENCES public.gestori_pratiche(id);

-- Update the helper function to also include aziende created directly by the gestore_pratiche
CREATE OR REPLACE FUNCTION public.get_aziende_ids_for_gestore_pratiche(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Aziende linked to assigned gestori or docenti
  SELECT az.id 
  FROM aziende az
  JOIN gestori_pratiche_assegnazioni gpa 
    ON gpa.gestore_id = az.inserita_da_gestore_id 
    OR gpa.docente_id = az.inserita_da_docente_id
  JOIN gestori_pratiche gp 
    ON gp.id = gpa.gestore_pratiche_id
  WHERE gp.profile_id = _user_id
  
  UNION
  
  -- Aziende created directly by this gestore_pratiche
  SELECT az.id
  FROM aziende az
  JOIN gestori_pratiche gp ON az.inserita_da_gestore_pratiche_id = gp.id
  WHERE gp.profile_id = _user_id
$$;