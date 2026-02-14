-- Aggiungi policy per permettere ai gestori di vedere collaboratori non assegnati
CREATE POLICY "Gestori possono vedere collaboratori non assegnati"
  ON public.collaboratori
  FOR SELECT
  USING (
    gestore_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.gestori
      WHERE gestori.profile_id = auth.uid()
    )
  );