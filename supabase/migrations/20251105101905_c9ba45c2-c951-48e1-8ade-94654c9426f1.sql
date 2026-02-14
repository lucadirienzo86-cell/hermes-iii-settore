-- Aggiungi campo gestore_id alla tabella pratiche
ALTER TABLE pratiche 
ADD COLUMN gestore_id uuid REFERENCES gestori(id) ON DELETE SET NULL;

-- Crea indici per performance
CREATE INDEX idx_pratiche_gestore ON pratiche(gestore_id);
CREATE INDEX idx_pratiche_stato ON pratiche(stato);

-- Rimuovi le vecchie policies
DROP POLICY IF EXISTS "Admin aggiornano pratiche" ON pratiche;
DROP POLICY IF EXISTS "Admin vedono tutte pratiche" ON pratiche;
DROP POLICY IF EXISTS "Aziende creano pratiche" ON pratiche;
DROP POLICY IF EXISTS "Aziende vedono proprie pratiche" ON pratiche;

-- Nuove policies
CREATE POLICY "Admin/Gestore/Editore vedono tutte le pratiche"
  ON pratiche FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'gestore'::app_role) OR 
    has_role(auth.uid(), 'editore'::app_role)
  );

CREATE POLICY "Collaboratori vedono tutte le pratiche"
  ON pratiche FOR SELECT
  USING (has_role(auth.uid(), 'collaboratore'::app_role));

CREATE POLICY "Admin/Gestore possono creare pratiche"
  ON pratiche FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'gestore'::app_role)
  );

CREATE POLICY "Admin/Gestore possono aggiornare pratiche"
  ON pratiche FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'gestore'::app_role)
  );

CREATE POLICY "Aziende vedono le proprie pratiche"
  ON pratiche FOR SELECT
  USING (azienda_id = auth.uid());

CREATE POLICY "Aziende possono creare pratiche"
  ON pratiche FOR INSERT
  WITH CHECK (azienda_id = auth.uid());