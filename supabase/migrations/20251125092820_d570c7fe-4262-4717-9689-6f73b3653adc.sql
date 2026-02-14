-- Create table for pratiche_finanziamenti_messaggi
CREATE TABLE public.pratiche_finanziamenti_messaggi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pratica_finanziamento_id UUID NOT NULL REFERENCES public.pratiche_finanziamenti(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('azienda', 'admin', 'gestore', 'editore')),
  messaggio TEXT NOT NULL,
  letto BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pratiche_finanziamenti_messaggi ENABLE ROW LEVEL SECURITY;

-- Admin/Gestore/Editore possono vedere tutti i messaggi
CREATE POLICY "Admin/Gestore/Editore vedono tutti messaggi finanziamenti"
ON public.pratiche_finanziamenti_messaggi
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestore', 'editore')
  )
);

-- Aziende vedono messaggi delle proprie pratiche finanziamenti
CREATE POLICY "Aziende vedono messaggi proprie pratiche finanziamenti"
ON public.pratiche_finanziamenti_messaggi
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.pratiche_finanziamenti pf
    JOIN public.aziende a ON a.id = pf.azienda_id
    WHERE pf.id = pratiche_finanziamenti_messaggi.pratica_finanziamento_id
    AND a.profile_id = auth.uid()
  )
);

-- Admin/Gestore/Editore possono inviare messaggi
CREATE POLICY "Admin/Gestore/Editore inviano messaggi finanziamenti"
ON public.pratiche_finanziamenti_messaggi
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestore', 'editore')
  )
);

-- Aziende possono inviare messaggi sulle proprie pratiche finanziamenti
CREATE POLICY "Aziende inviano messaggi finanziamenti"
ON public.pratiche_finanziamenti_messaggi
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.pratiche_finanziamenti pf
    JOIN public.aziende a ON a.id = pf.azienda_id
    WHERE pf.id = pratiche_finanziamenti_messaggi.pratica_finanziamento_id
    AND a.profile_id = auth.uid()
  )
);

-- Admin/Gestore/Editore possono aggiornare stato letto
CREATE POLICY "Admin/Gestore/Editore aggiornano stato letto finanziamenti"
ON public.pratiche_finanziamenti_messaggi
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestore', 'editore')
  )
);

-- Aziende possono aggiornare stato letto dei messaggi delle proprie pratiche
CREATE POLICY "Aziende aggiornano stato letto finanziamenti"
ON public.pratiche_finanziamenti_messaggi
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.pratiche_finanziamenti pf
    JOIN public.aziende a ON a.id = pf.azienda_id
    WHERE pf.id = pratiche_finanziamenti_messaggi.pratica_finanziamento_id
    AND a.profile_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_pratiche_finanziamenti_messaggi_pratica_id 
ON public.pratiche_finanziamenti_messaggi(pratica_finanziamento_id);

CREATE INDEX idx_pratiche_finanziamenti_messaggi_sender 
ON public.pratiche_finanziamenti_messaggi(sender_id);

CREATE INDEX idx_pratiche_finanziamenti_messaggi_created_at 
ON public.pratiche_finanziamenti_messaggi(created_at);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pratiche_finanziamenti_messaggi;