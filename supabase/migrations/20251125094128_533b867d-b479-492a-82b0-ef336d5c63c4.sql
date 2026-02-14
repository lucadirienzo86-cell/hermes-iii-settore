-- Aggiungi policy UPDATE per admin/gestore/editore sulla tabella pratiche_messaggi
CREATE POLICY "Admin/Gestore/Editore aggiornano stato letto"
ON public.pratiche_messaggi
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'gestore'::app_role, 'editore'::app_role])
  )
);