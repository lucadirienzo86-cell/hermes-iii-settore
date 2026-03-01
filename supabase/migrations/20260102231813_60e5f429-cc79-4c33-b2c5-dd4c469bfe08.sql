-- Tabella per gestire alert per avvisi a progetto
CREATE TABLE IF NOT EXISTS public.avvisi_alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avviso_id UUID NOT NULL REFERENCES public.avvisi_fondi(id) ON DELETE CASCADE,
  azienda_id UUID NOT NULL REFERENCES public.aziende(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  letto BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(avviso_id, azienda_id)
);

-- Enable RLS
ALTER TABLE public.avvisi_alert ENABLE ROW LEVEL SECURITY;

-- Admins can manage all alerts
DO $$ BEGIN
  CREATE POLICY "Admins can manage avvisi_alert"
  ON public.avvisi_alert
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Editori can manage all alerts
DO $$ BEGIN
  CREATE POLICY "Editori can manage avvisi_alert"
  ON public.avvisi_alert
  FOR ALL
  USING (has_role(auth.uid(), 'editore'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Gestori can view alerts for their aziende
DO $$ BEGIN
  CREATE POLICY "Gestori can view alerts for their aziende"
  ON public.avvisi_alert
  FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM aziende 
      WHERE inserita_da_gestore_id IN (
        SELECT id FROM gestori WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Collaboratori can view alerts for their aziende
DO $$ BEGIN
  CREATE POLICY "Collaboratori can view alerts for their aziende"
  ON public.avvisi_alert
  FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM aziende 
      WHERE inserita_da_collaboratore_id IN (
        SELECT id FROM collaboratori WHERE profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Aziende can view their own alerts
DO $$ BEGIN
  CREATE POLICY "Aziende can view their own alerts"
  ON public.avvisi_alert
  FOR SELECT
  USING (
    azienda_id IN (
      SELECT id FROM aziende WHERE profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_avvisi_alert_updated_at
  BEFORE UPDATE ON public.avvisi_alert
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;