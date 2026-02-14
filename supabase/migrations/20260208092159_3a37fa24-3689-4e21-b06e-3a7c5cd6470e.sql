-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_ultimo_accesso()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET ultimo_accesso = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop overly permissive policy and replace with proper one
DROP POLICY IF EXISTS "enti_manage_admin" ON public.enti;
DROP POLICY IF EXISTS "enti_manage_comune" ON public.enti;

-- Create proper INSERT policy
CREATE POLICY "enti_insert_institutional" ON public.enti
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'comune'::app_role) OR has_role(auth.uid(), 'assessorato_terzo_settore'::app_role));

-- Create proper UPDATE policy
CREATE POLICY "enti_update_institutional" ON public.enti
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'comune'::app_role) OR has_role(auth.uid(), 'assessorato_terzo_settore'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'comune'::app_role) OR has_role(auth.uid(), 'assessorato_terzo_settore'::app_role));

-- Create proper DELETE policy
CREATE POLICY "enti_delete_admin" ON public.enti
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));