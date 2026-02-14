-- Drop existing policies for aziende on pratiche table
DROP POLICY IF EXISTS "Aziende possono creare pratiche" ON pratiche;
DROP POLICY IF EXISTS "Aziende vedono le proprie pratiche" ON pratiche;

-- Create corrected policies that check through the aziende table
CREATE POLICY "Aziende possono creare pratiche"
ON pratiche
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM aziende
    WHERE aziende.id = pratiche.azienda_id
    AND aziende.profile_id = auth.uid()
  )
);

CREATE POLICY "Aziende vedono le proprie pratiche"
ON pratiche
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM aziende
    WHERE aziende.id = pratiche.azienda_id
    AND aziende.profile_id = auth.uid()
  )
);

-- Also update the pratiche_messaggi policies to use the correct relationship
DROP POLICY IF EXISTS "Aziende vedono messaggi proprie pratiche" ON pratiche_messaggi;
DROP POLICY IF EXISTS "Aziende inviano messaggi" ON pratiche_messaggi;
DROP POLICY IF EXISTS "Aziende aggiornano stato letto" ON pratiche_messaggi;

CREATE POLICY "Aziende vedono messaggi proprie pratiche"
ON pratiche_messaggi
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pratiche
    JOIN aziende ON aziende.id = pratiche.azienda_id
    WHERE pratiche.id = pratiche_messaggi.pratica_id
    AND aziende.profile_id = auth.uid()
  )
);

CREATE POLICY "Aziende inviano messaggi"
ON pratiche_messaggi
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM pratiche
    JOIN aziende ON aziende.id = pratiche.azienda_id
    WHERE pratiche.id = pratiche_messaggi.pratica_id
    AND aziende.profile_id = auth.uid()
  )
);

CREATE POLICY "Aziende aggiornano stato letto"
ON pratiche_messaggi
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pratiche
    JOIN aziende ON aziende.id = pratiche.azienda_id
    WHERE pratiche.id = pratiche_messaggi.pratica_id
    AND aziende.profile_id = auth.uid()
  )
);