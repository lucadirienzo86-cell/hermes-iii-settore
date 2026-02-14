-- Permetti agli admin di aggiornare qualsiasi azienda
CREATE POLICY "Admin possono aggiornare tutte le aziende"
ON aziende
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));