-- Permetti agli admin di inserire ruoli per qualsiasi utente
CREATE POLICY "Admin possono inserire ruoli"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Permetti agli admin di aggiornare ruoli
CREATE POLICY "Admin possono aggiornare ruoli"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Permetti agli admin di eliminare ruoli
CREATE POLICY "Admin possono eliminare ruoli"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);