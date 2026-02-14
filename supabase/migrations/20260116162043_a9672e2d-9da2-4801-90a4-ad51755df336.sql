-- Create table for contact requests from non-company users
CREATE TABLE public.richieste_contatto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  ruolo_richiesto TEXT NOT NULL, -- 'docente', 'gestore', 'collaboratore'
  messaggio TEXT,
  stato TEXT DEFAULT 'in_attesa', -- 'in_attesa', 'contattato', 'completato', 'rifiutato'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.richieste_contatto ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public form)
CREATE POLICY "Anyone can submit contact requests"
ON public.richieste_contatto
FOR INSERT
WITH CHECK (true);

-- Policy: Only admins can view all requests
CREATE POLICY "Admins can view all contact requests"
ON public.richieste_contatto
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can update requests
CREATE POLICY "Admins can update contact requests"
ON public.richieste_contatto
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can delete requests
CREATE POLICY "Admins can delete contact requests"
ON public.richieste_contatto
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));