-- Add RLS policy for gestori table to allow Gestori Pratiche to view assigned gestori
CREATE POLICY "Gestori Pratiche can view assigned gestori"
ON public.gestori
FOR SELECT
USING (
  id IN (
    SELECT gpa.gestore_id 
    FROM gestori_pratiche_assegnazioni gpa
    JOIN gestori_pratiche gp ON gp.id = gpa.gestore_pratiche_id
    WHERE gp.profile_id = auth.uid()
  )
);

-- Add RLS policy for docenti table to allow Gestori Pratiche to view assigned docenti
CREATE POLICY "Gestori Pratiche can view assigned docenti"
ON public.docenti
FOR SELECT
USING (
  id IN (
    SELECT gpa.docente_id 
    FROM gestori_pratiche_assegnazioni gpa
    JOIN gestori_pratiche gp ON gp.id = gpa.gestore_pratiche_id
    WHERE gp.profile_id = auth.uid()
  )
);