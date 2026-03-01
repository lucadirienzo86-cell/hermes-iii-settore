-- Create pratiche_log table for tracking all actions
CREATE TABLE public.pratiche_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pratica_id UUID NOT NULL REFERENCES pratiche(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_type TEXT NOT NULL,
  azione TEXT NOT NULL,
  dettagli JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pratiche_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  CREATE POLICY "Admin can manage all logs" ON public.pratiche_log
    FOR ALL USING (has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view logs of their pratiche" ON public.pratiche_log
    FOR SELECT USING (
      pratica_id IN (
        SELECT p.id FROM pratiche p
        JOIN aziende a ON p.azienda_id = a.id
        WHERE a.profile_id = auth.uid()
          OR a.inserita_da_gestore_id IN (SELECT id FROM gestori WHERE profile_id = auth.uid())
          OR a.inserita_da_docente_id IN (SELECT id FROM docenti WHERE profile_id = auth.uid())
      )
      OR pratica_id IN (SELECT get_pratiche_for_gestore_pratiche(auth.uid()))
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert logs" ON public.pratiche_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create storage bucket for practice documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('pratiche-documenti', 'pratiche-documenti', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DO $$ BEGIN
  CREATE POLICY "Users can upload to pratiche-documenti"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pratiche-documenti' AND auth.uid() IS NOT NULL
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view pratiche-documenti"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pratiche-documenti' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete from pratiche-documenti"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pratiche-documenti' AND has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own uploads from pratiche-documenti"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pratiche-documenti' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN OTHERS THEN NULL; END $$;