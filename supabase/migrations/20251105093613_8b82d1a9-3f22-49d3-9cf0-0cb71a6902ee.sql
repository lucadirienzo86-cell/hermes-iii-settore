
-- Rimuovi la policy restrittiva per le aziende
DROP POLICY IF EXISTS "Utenti vedono bandi assegnati" ON public.bandi;

-- Crea nuova policy che permette alle aziende di vedere tutti i bandi attivi
CREATE POLICY "Aziende vedono tutti i bandi attivi"
ON public.bandi
FOR SELECT
USING (
  -- Le aziende possono vedere tutti i bandi attivi
  (attivo = true AND has_role(auth.uid(), 'azienda'::app_role))
  OR
  -- Gestori/collaboratori vedono i bandi assegnati
  (EXISTS (
    SELECT 1
    FROM bandi_assegnazioni
    WHERE bandi_assegnazioni.bando_id = bandi.id
      AND bandi_assegnazioni.profile_id = auth.uid()
  ))
  OR
  -- Admin/editore vedono tutto
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role))
);
