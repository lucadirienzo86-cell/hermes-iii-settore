-- Crea bucket per documenti bandi
INSERT INTO storage.buckets (id, name, public) VALUES ('bandi-documenti', 'bandi-documenti', false);

-- Policy per admin/editori per upload
CREATE POLICY "Admin ed editori possono caricare documenti bandi"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bandi-documenti' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'editore'::app_role)
  )
);

-- Policy per admin/editori per update
CREATE POLICY "Admin ed editori possono aggiornare documenti bandi"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bandi-documenti' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'editore'::app_role)
  )
);

-- Policy per admin/editori per delete
CREATE POLICY "Admin ed editori possono eliminare documenti bandi"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bandi-documenti' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'editore'::app_role)
  )
);

-- Policy per visualizzazione autenticati
CREATE POLICY "Utenti autenticati possono visualizzare documenti bandi"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'bandi-documenti');

-- Aggiungi colonna pdf_url alla tabella bandi
ALTER TABLE public.bandi ADD COLUMN pdf_url text;