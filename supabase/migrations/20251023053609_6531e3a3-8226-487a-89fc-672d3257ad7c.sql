-- Correggi le policy RLS per la tabella aziende
-- Le policy devono essere PERMISSIVE (non RESTRICTIVE) per funzionare correttamente

-- Elimina le vecchie policy restrictive
DROP POLICY IF EXISTS "Admin possono creare aziende" ON public.aziende;
DROP POLICY IF EXISTS "Gestori possono inserire aziende" ON public.aziende;
DROP POLICY IF EXISTS "Collaboratori possono inserire aziende" ON public.aziende;
DROP POLICY IF EXISTS "Aziende possono auto-registrarsi" ON public.aziende;

-- Ricrea le policy come PERMISSIVE (default)
CREATE POLICY "Admin possono creare aziende" 
ON public.aziende 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gestori possono inserire aziende" 
ON public.aziende 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM gestori
    WHERE gestori.id = aziende.inserita_da_gestore_id 
      AND gestori.profile_id = auth.uid()
  )
);

CREATE POLICY "Collaboratori possono inserire aziende" 
ON public.aziende 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM collaboratori
    WHERE collaboratori.id = aziende.inserita_da_collaboratore_id 
      AND collaboratori.profile_id = auth.uid()
  )
);

CREATE POLICY "Aziende possono auto-registrarsi" 
ON public.aziende 
FOR INSERT 
TO authenticated
WITH CHECK (
  profile_id = auth.uid() 
  AND inserita_da_gestore_id IS NULL 
  AND inserita_da_collaboratore_id IS NULL
);