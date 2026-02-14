-- Allow Gestori Pratiche to insert new aziende
CREATE POLICY "Gestori Pratiche can insert aziende"
ON public.aziende
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'gestore_pratiche'::app_role)
);

-- Allow Gestori Pratiche to update aziende they can see (assigned ones)
CREATE POLICY "Gestori Pratiche can update assigned aziende"
ON public.aziende
FOR UPDATE
USING (
  id IN (SELECT public.get_aziende_ids_for_gestore_pratiche(auth.uid()))
);