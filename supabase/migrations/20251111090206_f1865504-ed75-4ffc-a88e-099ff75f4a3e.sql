-- Crea bucket per documenti pratiche se non esiste
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pratiche-documenti', 'pratiche-documenti', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Policy per permettere alle aziende di caricare file nelle proprie pratiche
CREATE POLICY "Aziende possono caricare documenti proprie pratiche"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pratiche-documenti' AND
  EXISTS (
    SELECT 1 FROM pratiche p
    JOIN aziende a ON a.id = p.azienda_id
    WHERE p.id::text = (string_to_array(name, '/'))[1]
    AND a.profile_id = auth.uid()
  )
);

-- Policy per permettere alle aziende di vedere i documenti delle proprie pratiche
CREATE POLICY "Aziende vedono documenti proprie pratiche"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pratiche-documenti' AND
  EXISTS (
    SELECT 1 FROM pratiche p
    JOIN aziende a ON a.id = p.azienda_id
    WHERE p.id::text = (string_to_array(name, '/'))[1]
    AND a.profile_id = auth.uid()
  )
);

-- Policy per admin/gestori/editore per vedere tutti i documenti
CREATE POLICY "Admin/Gestore/Editore vedono tutti documenti storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pratiche-documenti' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'gestore'::app_role) OR
    has_role(auth.uid(), 'editore'::app_role)
  )
);

-- Policy per admin/gestori per caricare documenti
CREATE POLICY "Admin/Gestore possono caricare documenti storage"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pratiche-documenti' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'gestore'::app_role) OR
    has_role(auth.uid(), 'editore'::app_role)
  )
);