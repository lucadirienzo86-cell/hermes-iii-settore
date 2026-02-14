-- Crea bucket per i PDF dei bandi
INSERT INTO storage.buckets (id, name, public)
VALUES ('bandi-pdf', 'bandi-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- Policy per visualizzare i PDF (pubblici)
CREATE POLICY "I PDF dei bandi sono pubblicamente accessibili"
ON storage.objects FOR SELECT
USING (bucket_id = 'bandi-pdf');

-- Policy per caricare PDF (solo admin ed editore)
CREATE POLICY "Admin ed editore possono caricare PDF"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bandi-pdf' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'editore')
    )
  )
);

-- Policy per aggiornare PDF (solo admin ed editore)
CREATE POLICY "Admin ed editore possono aggiornare PDF"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bandi-pdf' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'editore')
    )
  )
);

-- Policy per eliminare PDF (solo admin)
CREATE POLICY "Admin può eliminare PDF"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bandi-pdf' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
);