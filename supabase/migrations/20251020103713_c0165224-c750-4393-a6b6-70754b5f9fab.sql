-- Crea tabella per assegnazioni bandi
CREATE TABLE public.bandi_assegnazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bando_id UUID NOT NULL REFERENCES public.bandi(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assegnato_da UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bando_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.bandi_assegnazioni ENABLE ROW LEVEL SECURITY;

-- Policy: Admin ed editore possono vedere tutte le assegnazioni
CREATE POLICY "Admin ed editore possono vedere tutte le assegnazioni"
ON public.bandi_assegnazioni FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'editore')
);

-- Policy: Admin ed editore possono creare assegnazioni
CREATE POLICY "Admin ed editore possono creare assegnazioni"
ON public.bandi_assegnazioni FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'editore')
);

-- Policy: Admin ed editore possono eliminare assegnazioni
CREATE POLICY "Admin ed editore possono eliminare assegnazioni"
ON public.bandi_assegnazioni FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'editore')
);

-- Policy: Gli utenti possono vedere le proprie assegnazioni
CREATE POLICY "Gli utenti possono vedere le proprie assegnazioni"
ON public.bandi_assegnazioni FOR SELECT
USING (profile_id = auth.uid());

-- Aggiorna le policy dei bandi per includere le assegnazioni
DROP POLICY IF EXISTS "Tutti possono vedere bandi" ON public.bandi;

-- Admin ed editore vedono tutti i bandi
CREATE POLICY "Admin ed editore possono vedere tutti i bandi"
ON public.bandi FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'editore')
);

-- Gestori e collaboratori vedono solo i bandi assegnati
CREATE POLICY "Utenti vedono bandi assegnati"
ON public.bandi FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bandi_assegnazioni
    WHERE bandi_assegnazioni.bando_id = bandi.id
    AND bandi_assegnazioni.profile_id = auth.uid()
  )
);