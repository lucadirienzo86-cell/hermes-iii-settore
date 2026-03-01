-- Rimuovi la policy esistente
DROP POLICY IF EXISTS "Admins can manage badge_assegnazioni" ON badge_assegnazioni;

-- Policy per INSERT/UPDATE/DELETE basata sulla proprietà
DO $$ BEGIN
  CREATE POLICY "Users can manage badge_assegnazioni for their entities"
  ON badge_assegnazioni
  FOR ALL
  TO authenticated
  USING (
    -- Admin può gestire tutto
    has_role(auth.uid(), 'admin'::app_role)
    OR
    -- Per aziende: l'utente può gestire i badge se ha inserito l'azienda
    (azienda_id IN (
      SELECT a.id FROM aziende a
      WHERE 
        -- Gestore che ha inserito l'azienda
        a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid())
        OR
        -- Docente che ha inserito l'azienda
        a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid())
        OR
        -- Collaboratore che ha inserito l'azienda
        a.inserita_da_collaboratore_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid())
        OR
        -- L'azienda stessa (profile_id)
        a.profile_id = auth.uid()
    ))
    OR
    -- Per docenti: il docente può gestire i propri badge
    (docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
    OR
    -- Per collaboratori: il collaboratore può gestire i propri badge
    (collaboratore_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid()))
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR
    (azienda_id IN (
      SELECT a.id FROM aziende a
      WHERE 
        a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid())
        OR
        a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid())
        OR
        a.inserita_da_collaboratore_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid())
        OR
        a.profile_id = auth.uid()
    ))
    OR
    (docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
    OR
    (collaboratore_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid()))
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;