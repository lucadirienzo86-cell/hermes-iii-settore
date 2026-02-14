-- Permetti agli admin di aggiornare tutti i collaboratori
CREATE POLICY "Admin possono aggiornare collaboratori"
ON public.collaboratori
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Permetti agli admin di aggiornare tutti i gestori
CREATE POLICY "Admin possono aggiornare gestori"
ON public.gestori
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));