-- Create storage bucket for docenti documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('docenti-documenti', 'docenti-documenti', false)
ON CONFLICT (id) DO NOTHING;

-- Create table for docenti documents
CREATE TABLE public.docenti_documenti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL, -- 'cv', 'certificazione', 'altro'
  titolo TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.docenti_documenti ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$ BEGIN
  CREATE POLICY "Docenti can manage their own documents"
  ON public.docenti_documenti FOR ALL
  USING (docente_id IN (
    SELECT id FROM public.docenti WHERE profile_id = auth.uid()
  ));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all docenti documents"
  ON public.docenti_documenti FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Storage policies for docenti-documenti bucket
DO $$ BEGIN
  CREATE POLICY "Docenti can upload their documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'docenti-documenti' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Docenti can view their documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'docenti-documenti' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Docenti can delete their documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'docenti-documenti' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all docenti documents storage"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'docenti-documenti' 
    AND public.has_role(auth.uid(), 'admin')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;