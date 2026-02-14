-- Rimuovi la policy problematica che causa ricorsione infinita
DROP POLICY IF EXISTS "Users can view aziende through pratiche" ON aziende;

-- Soluzione corretta: Gestori/Collaboratori/Editore possono vedere tutte le aziende
-- (necessario perché vedono tutte le pratiche)
CREATE POLICY "Gestori/Collaboratori/Editore vedono tutte aziende"
ON aziende
FOR SELECT
USING (
  has_role(auth.uid(), 'gestore') OR 
  has_role(auth.uid(), 'collaboratore') OR 
  has_role(auth.uid(), 'editore')
);