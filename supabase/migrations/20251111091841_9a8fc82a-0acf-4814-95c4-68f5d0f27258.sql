-- Drop existing policy
DROP POLICY IF EXISTS "Aziende vedono messaggi proprie pratiche" ON pratiche_messaggi;

-- Create corrected policy for aziende to view their own practice messages
CREATE POLICY "Aziende vedono messaggi proprie pratiche" 
ON pratiche_messaggi 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM pratiche p
    JOIN aziende a ON a.id = p.azienda_id
    WHERE p.id = pratiche_messaggi.pratica_id
    AND a.profile_id = auth.uid()
  )
);