-- Fix RLS policies for aziende to allow admin full access
-- Drop the existing restrictive admin policy and create a permissive one
DROP POLICY IF EXISTS "Admins can manage aziende" ON public.aziende;

-- Create permissive policy for admins
CREATE POLICY "Admins have full access to aziende" 
ON public.aziende 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));