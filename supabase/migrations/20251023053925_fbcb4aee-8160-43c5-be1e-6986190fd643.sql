-- Correggi la policy per permettere ai gestori di assegnare aziende ai collaboratori
DROP POLICY IF EXISTS "Collaboratori possono inserire aziende" ON public.aziende;

-- Policy che permette sia ai collaboratori che ai gestori (dei collaboratori) di inserire
CREATE POLICY "Collaboratori possono inserire aziende" 
ON public.aziende 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM collaboratori
    WHERE collaboratori.id = aziende.inserita_da_collaboratore_id 
      AND (
        -- Il collaboratore stesso può inserire
        collaboratori.profile_id = auth.uid()
        OR
        -- Oppure il gestore del collaboratore può inserire
        EXISTS (
          SELECT 1 
          FROM gestori 
          WHERE gestori.id = collaboratori.gestore_id 
            AND gestori.profile_id = auth.uid()
        )
      )
  )
);