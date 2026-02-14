-- Permetti agli admin di aggiornare tutti i profili
CREATE POLICY "Admin possono aggiornare tutti i profili"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));