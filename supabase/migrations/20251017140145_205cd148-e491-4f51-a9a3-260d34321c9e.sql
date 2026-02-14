-- Aggiungi policy DELETE per gestori (solo admin)
CREATE POLICY "Admin possono eliminare gestori"
ON public.gestori
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Aggiungi policy DELETE per collaboratori (solo admin)
CREATE POLICY "Admin possono eliminare collaboratori"
ON public.collaboratori
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Aggiungi policy DELETE per profiles (solo admin)
CREATE POLICY "Admin possono eliminare profili"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Aggiungi foreign key con CASCADE per gestori -> profiles
ALTER TABLE public.gestori
DROP CONSTRAINT IF EXISTS gestori_profile_id_fkey,
ADD CONSTRAINT gestori_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Aggiungi foreign key con CASCADE per collaboratori -> profiles
ALTER TABLE public.collaboratori
DROP CONSTRAINT IF EXISTS collaboratori_profile_id_fkey,
ADD CONSTRAINT collaboratori_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Aggiungi foreign key con CASCADE per aziende -> profiles
ALTER TABLE public.aziende
DROP CONSTRAINT IF EXISTS aziende_profile_id_fkey,
ADD CONSTRAINT aziende_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;