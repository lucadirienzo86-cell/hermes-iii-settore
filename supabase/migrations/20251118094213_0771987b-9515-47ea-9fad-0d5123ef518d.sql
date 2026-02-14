-- Crea tabella per le pratiche di finanziamento bancario
CREATE TABLE public.pratiche_finanziamenti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES public.aziende(id) ON DELETE CASCADE,
  banca_id UUID NOT NULL REFERENCES public.banche(id) ON DELETE CASCADE,
  stato TEXT NOT NULL DEFAULT 'richiesta_inviata',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilita RLS
ALTER TABLE public.pratiche_finanziamenti ENABLE ROW LEVEL SECURITY;

-- Policy: Aziende possono creare richieste per i propri dati
CREATE POLICY "Aziende possono creare richieste finanziamento"
ON public.pratiche_finanziamenti
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.aziende
    WHERE aziende.id = pratiche_finanziamenti.azienda_id
    AND aziende.profile_id = auth.uid()
  )
);

-- Policy: Aziende vedono le proprie richieste
CREATE POLICY "Aziende vedono proprie richieste finanziamento"
ON public.pratiche_finanziamenti
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.aziende
    WHERE aziende.id = pratiche_finanziamenti.azienda_id
    AND aziende.profile_id = auth.uid()
  )
);

-- Policy: Admin/Gestore/Editore vedono tutte le richieste
CREATE POLICY "Admin/Gestore/Editore vedono tutte richieste finanziamento"
ON public.pratiche_finanziamenti
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'gestore'::app_role) OR
  has_role(auth.uid(), 'editore'::app_role)
);

-- Policy: Admin/Gestore possono aggiornare le richieste
CREATE POLICY "Admin/Gestore possono aggiornare richieste finanziamento"
ON public.pratiche_finanziamenti
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'gestore'::app_role)
);

-- Policy: Collaboratori vedono tutte le richieste
CREATE POLICY "Collaboratori vedono tutte richieste finanziamento"
ON public.pratiche_finanziamenti
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'collaboratore'::app_role)
);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_pratiche_finanziamenti_updated_at
BEFORE UPDATE ON public.pratiche_finanziamenti
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Indici per performance
CREATE INDEX idx_pratiche_finanziamenti_azienda_id ON public.pratiche_finanziamenti(azienda_id);
CREATE INDEX idx_pratiche_finanziamenti_banca_id ON public.pratiche_finanziamenti(banca_id);
CREATE INDEX idx_pratiche_finanziamenti_stato ON public.pratiche_finanziamenti(stato);