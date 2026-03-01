-- Aggiungi colonna pdf_urls per avvisi_fondi (multipli PDF)
ALTER TABLE public.avvisi_fondi ADD COLUMN pdf_urls text[] DEFAULT '{}';

-- Aggiungi colonna pdf_urls per bandi (multipli PDF - mantieni pdf_url per backward compatibility)
ALTER TABLE public.bandi ADD COLUMN pdf_urls text[] DEFAULT '{}';

-- Rendi il bucket pubblico per permettere la visualizzazione dei PDF
UPDATE storage.buckets SET public = true WHERE id = 'bandi-documenti';

-- Crea policy per upload da utenti autenticati
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bandi-documenti' 
    AND auth.uid() IS NOT NULL
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Crea policy per lettura pubblica
DO $$ BEGIN
  CREATE POLICY "Public can view documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bandi-documenti');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Crea policy per delete da admin/editore
DO $$ BEGIN
  CREATE POLICY "Admins can delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bandi-documenti' 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editore'))
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;