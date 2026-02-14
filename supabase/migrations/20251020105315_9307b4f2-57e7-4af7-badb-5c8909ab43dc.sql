-- Elimina la policy esistente che permetteva solo agli admin di eliminare bandi
DROP POLICY IF EXISTS "Admin può eliminare bandi" ON public.bandi;

-- Crea nuova policy che permette sia ad admin che ad editori di eliminare bandi
CREATE POLICY "Admin ed editore possono eliminare bandi"
  ON public.bandi
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'editore'::app_role)
  );