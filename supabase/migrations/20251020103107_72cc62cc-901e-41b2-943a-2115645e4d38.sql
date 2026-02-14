-- Rimuovi le policy esistenti
DROP POLICY IF EXISTS "I PDF dei bandi sono pubblicamente accessibili" ON storage.objects;
DROP POLICY IF EXISTS "Admin ed editore possono caricare PDF" ON storage.objects;
DROP POLICY IF EXISTS "Admin ed editore possono aggiornare PDF" ON storage.objects;
DROP POLICY IF EXISTS "Admin può eliminare PDF" ON storage.objects;

-- Policy per visualizzare i PDF (pubblici)
CREATE POLICY "Tutti possono vedere PDF bandi"
ON storage.objects FOR SELECT
USING (bucket_id = 'bandi-pdf');

-- Policy per caricare PDF (solo utenti autenticati con ruolo admin o editore)
CREATE POLICY "Admin ed editore possono caricare PDF bandi"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bandi-pdf' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editore')
  )
);

-- Policy per aggiornare PDF (solo utenti autenticati con ruolo admin o editore)
CREATE POLICY "Admin ed editore possono aggiornare PDF bandi"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bandi-pdf' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editore')
  )
);

-- Policy per eliminare PDF (solo admin)
CREATE POLICY "Admin può eliminare PDF bandi"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bandi-pdf' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);