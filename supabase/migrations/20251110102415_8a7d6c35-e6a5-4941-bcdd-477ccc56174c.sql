-- Policy per permettere a gestori/admin/editore/collaboratori di vedere aziende tramite pratiche
CREATE POLICY "Users can view aziende through pratiche"
ON aziende
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM pratiche
    WHERE pratiche.azienda_id = aziende.id
    AND (
      -- Admin/Gestore/Editore vedono tutte le pratiche
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'gestore') OR 
      has_role(auth.uid(), 'editore') OR
      has_role(auth.uid(), 'collaboratore')
    )
  )
);