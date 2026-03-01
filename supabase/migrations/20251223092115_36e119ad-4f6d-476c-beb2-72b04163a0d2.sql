-- Crea bucket per documenti bandi
INSERT INTO storage.buckets (id, name, public) VALUES ('bandi-documenti', 'bandi-documenti', false);

-- Policy per admin/editori per upload
DO $$ BEGIN
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
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy per admin/editori per update
DO $$ BEGIN
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
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy per admin/editori per delete
DO $$ BEGIN
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
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy per visualizzazione autenticati
DO $$ BEGIN
  CREATE POLICY "Utenti autenticati possono visualizzare documenti bandi"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'bandi-documenti');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Aggiungi colonna pdf_url alla tabella bandi
ALTER TABLE public.bandi ADD COLUMN pdf_url text;