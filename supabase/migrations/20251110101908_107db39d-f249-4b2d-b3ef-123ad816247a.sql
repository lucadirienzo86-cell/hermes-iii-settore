-- Crea tabella per documenti pratiche
CREATE TABLE public.pratiche_documenti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pratica_id uuid NOT NULL REFERENCES public.pratiche(id) ON DELETE CASCADE,
  nome_file text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  caricato_da uuid NOT NULL,
  tipo_utente text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pratiche_documenti_pratica ON public.pratiche_documenti(pratica_id);
CREATE INDEX idx_pratiche_documenti_caricato_da ON public.pratiche_documenti(caricato_da);

-- Abilita RLS
ALTER TABLE public.pratiche_documenti ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Admin/Gestore/Editore vedono tutti i documenti
CREATE POLICY "Admin/Gestore/Editore vedono tutti documenti"
ON public.pratiche_documenti
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'gestore'::app_role) OR 
  has_role(auth.uid(), 'editore'::app_role)
);

-- Policy SELECT: Collaboratori vedono tutti i documenti
CREATE POLICY "Collaboratori vedono tutti documenti"
ON public.pratiche_documenti
FOR SELECT
USING (has_role(auth.uid(), 'collaboratore'::app_role));

-- Policy SELECT: Aziende vedono documenti delle proprie pratiche
CREATE POLICY "Aziende vedono documenti proprie pratiche"
ON public.pratiche_documenti
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pratiche p
    JOIN public.aziende a ON a.id = p.azienda_id
    WHERE p.id = pratiche_documenti.pratica_id
    AND a.profile_id = auth.uid()
  )
);

-- Policy INSERT: Tutti possono caricare documenti per pratiche accessibili
CREATE POLICY "Admin/Gestore possono caricare documenti"
ON public.pratiche_documenti
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'gestore'::app_role) OR 
  has_role(auth.uid(), 'editore'::app_role)
);

CREATE POLICY "Collaboratori possono caricare documenti"
ON public.pratiche_documenti
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'collaboratore'::app_role));

CREATE POLICY "Aziende possono caricare documenti proprie pratiche"
ON public.pratiche_documenti
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pratiche p
    JOIN public.aziende a ON a.id = p.azienda_id
    WHERE p.id = pratiche_documenti.pratica_id
    AND a.profile_id = auth.uid()
  )
);

-- Policy DELETE: Admin/Gestore possono eliminare
CREATE POLICY "Admin/Gestore possono eliminare documenti"
ON public.pratiche_documenti
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'gestore'::app_role)
);

-- Policy DELETE: Chi ha caricato può eliminare i propri documenti entro 24h
CREATE POLICY "Utenti eliminano propri documenti entro 24h"
ON public.pratiche_documenti
FOR DELETE
USING (
  caricato_da = auth.uid() AND 
  created_at > now() - interval '24 hours'
);

-- Crea bucket storage privato per documenti pratiche
INSERT INTO storage.buckets (id, name, public)
VALUES ('pratiche-documenti', 'pratiche-documenti', false);

-- Storage Policy UPLOAD: Utenti autenticati caricano in pratiche accessibili
CREATE POLICY "Admin/Gestore possono caricare file"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pratiche-documenti' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'gestore'::app_role) OR 
   has_role(auth.uid(), 'editore'::app_role) OR
   has_role(auth.uid(), 'collaboratore'::app_role))
);

CREATE POLICY "Aziende possono caricare file proprie pratiche"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pratiche-documenti' AND
  EXISTS (
    SELECT 1 FROM public.pratiche p
    JOIN public.aziende a ON a.id = p.azienda_id
    WHERE (storage.foldername(name))[1] = p.id::text
    AND a.profile_id = auth.uid()
  )
);

-- Storage Policy SELECT: Admin/Gestore/Editore accesso completo
CREATE POLICY "Admin/Gestore/Editore vedono tutti file"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pratiche-documenti' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'gestore'::app_role) OR 
   has_role(auth.uid(), 'editore'::app_role))
);

-- Storage Policy SELECT: Collaboratori vedono tutti i file
CREATE POLICY "Collaboratori vedono tutti file"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pratiche-documenti' AND
  has_role(auth.uid(), 'collaboratore'::app_role)
);

-- Storage Policy SELECT: Aziende vedono file proprie pratiche
CREATE POLICY "Aziende vedono file proprie pratiche"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pratiche-documenti' AND
  EXISTS (
    SELECT 1 FROM public.pratiche p
    JOIN public.aziende a ON a.id = p.azienda_id
    WHERE (storage.foldername(name))[1] = p.id::text
    AND a.profile_id = auth.uid()
  )
);

-- Storage Policy DELETE: Admin/Gestore possono eliminare
CREATE POLICY "Admin/Gestore possono eliminare file"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pratiche-documenti' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'gestore'::app_role))
);