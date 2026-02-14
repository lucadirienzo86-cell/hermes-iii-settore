-- Permetti agli admin di vedere tutti i ruoli
CREATE POLICY "Admin possono vedere tutti i ruoli"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));