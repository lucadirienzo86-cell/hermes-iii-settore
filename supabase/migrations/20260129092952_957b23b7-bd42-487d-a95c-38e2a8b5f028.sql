-- RLS Policy: Gestore pratiche can view messages of assigned pratiche
CREATE POLICY "Gestore pratiche can view messaggi of assigned pratiche"
ON public.pratiche_messaggi
FOR SELECT
USING (
  pratica_id IN (
    SELECT public.get_pratiche_for_gestore_pratiche(auth.uid())
  )
);

-- RLS Policy: Gestore pratiche can insert messages in assigned pratiche
CREATE POLICY "Gestore pratiche can insert messaggi in assigned pratiche"
ON public.pratiche_messaggi
FOR INSERT
WITH CHECK (
  pratica_id IN (
    SELECT public.get_pratiche_for_gestore_pratiche(auth.uid())
  )
  AND sender_id = auth.uid()
);

-- RLS Policy: Gestore pratiche can update letto on assigned pratiche
CREATE POLICY "Gestore pratiche can update letto on assigned pratiche"
ON public.pratiche_messaggi
FOR UPDATE
USING (
  pratica_id IN (
    SELECT public.get_pratiche_for_gestore_pratiche(auth.uid())
  )
);