-- Permetti agli admin di vedere tutti i profili
CREATE POLICY "Admin possono vedere tutti i profili"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);