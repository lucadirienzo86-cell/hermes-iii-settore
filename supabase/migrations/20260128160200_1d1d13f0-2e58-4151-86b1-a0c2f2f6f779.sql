-- Aggiunge policy per permettere ai gestori di vedere i gestori pratiche assegnati a loro
CREATE POLICY "Gestori can view their assigned gestori_pratiche"
ON public.gestori_pratiche_assegnazioni
FOR SELECT
USING (
  gestore_id IN (
    SELECT id FROM gestori WHERE profile_id = auth.uid()
  )
);

-- Aggiunge policy per permettere ai docenti di vedere i gestori pratiche assegnati a loro
CREATE POLICY "Docenti can view their assigned gestori_pratiche"
ON public.gestori_pratiche_assegnazioni
FOR SELECT
USING (
  docente_id IN (
    SELECT id FROM docenti WHERE profile_id = auth.uid()
  )
);

-- Aggiunge policy per permettere ai gestori di vedere i record dei gestori pratiche attivi a loro assegnati
CREATE POLICY "Gestori can view assigned gestori_pratiche records"
ON public.gestori_pratiche
FOR SELECT
USING (
  id IN (
    SELECT gpa.gestore_pratiche_id 
    FROM gestori_pratiche_assegnazioni gpa
    JOIN gestori g ON gpa.gestore_id = g.id
    WHERE g.profile_id = auth.uid()
  )
);

-- Aggiunge policy per permettere ai docenti di vedere i record dei gestori pratiche attivi a loro assegnati
CREATE POLICY "Docenti can view assigned gestori_pratiche records"
ON public.gestori_pratiche
FOR SELECT
USING (
  id IN (
    SELECT gpa.gestore_pratiche_id 
    FROM gestori_pratiche_assegnazioni gpa
    JOIN docenti d ON gpa.docente_id = d.id
    WHERE d.profile_id = auth.uid()
  )
);