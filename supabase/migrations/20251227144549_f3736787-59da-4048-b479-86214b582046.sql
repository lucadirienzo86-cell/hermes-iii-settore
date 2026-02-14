-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage fondi" ON public.fondi_interprofessionali;

-- Create new policy that includes both admins and editori
CREATE POLICY "Admins and editori can manage fondi" 
ON public.fondi_interprofessionali 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));