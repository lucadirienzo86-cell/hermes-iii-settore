-- Fix overly permissive INSERT policy for notifiche_istituzionali
DROP POLICY IF EXISTS "Sistema crea notifiche" ON public.notifiche_istituzionali;

CREATE POLICY "Sistema crea notifiche"
ON public.notifiche_istituzionali FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'comune') 
  OR public.has_role(auth.uid(), 'assessorato_terzo_settore') 
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'pro_loco')
);