-- Step 1: Drop ALL RLS policies referencing collaboratori

-- aziende table policies
DROP POLICY IF EXISTS "Gestori can view aziende they manage" ON public.aziende;
DROP POLICY IF EXISTS "Collaboratori can view aziende they manage" ON public.aziende;
DROP POLICY IF EXISTS "Collaboratori can manage aziende they inserted" ON public.aziende;

-- pratiche table policies
DROP POLICY IF EXISTS "Collaboratori can view pratiche of their aziende" ON public.pratiche;

-- aziende_fondi table policies
DROP POLICY IF EXISTS "Collaboratori can manage their aziende fondi" ON public.aziende_fondi;

-- aziende_aiuti_rna table policies
DROP POLICY IF EXISTS "Collaboratori can manage aiuti of their aziende" ON public.aziende_aiuti_rna;

-- avvisi_alert table policies
DROP POLICY IF EXISTS "Collaboratori can view alerts for their aziende" ON public.avvisi_alert;

-- badge_log table policies
DROP POLICY IF EXISTS "Users can insert badge_log for their entities" ON public.badge_log;
DROP POLICY IF EXISTS "Users can view badge_log for their entities" ON public.badge_log;

-- badge_assegnazioni table policies
DROP POLICY IF EXISTS "Users can manage badge_assegnazioni for their entities" ON public.badge_assegnazioni;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.badge_assegnazioni;

-- Step 2: Drop the foreign key column from aziende
ALTER TABLE public.aziende DROP COLUMN IF EXISTS inserita_da_collaboratore_id;

-- Step 3: Drop the collaboratori table
DROP TABLE IF EXISTS public.collaboratori CASCADE;

-- Step 4: Recreate clean RLS policies without collaboratori references

-- Recreate aziende policy for gestori (without collaboratori reference)
CREATE POLICY "Gestori can view aziende they manage" 
ON public.aziende FOR SELECT 
USING (
  inserita_da_gestore_id IN (
    SELECT gestori.id FROM gestori WHERE gestori.profile_id = auth.uid()
  )
);

-- badge_log policies (without collaboratori)
CREATE POLICY "Users can insert badge_log for their entities" 
ON public.badge_log FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    (entity_type = 'azienda'::text) AND (entity_id IN (
      SELECT a.id FROM aziende a
      WHERE (
        (a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()))
        OR (a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
        OR (a.profile_id = auth.uid())
      )
    ))
  ) 
  OR (
    (entity_type = 'docente'::text) AND (entity_id IN (
      SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can view badge_log for their entities" 
ON public.badge_log FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    (entity_type = 'azienda'::text) AND (entity_id IN (
      SELECT a.id FROM aziende a
      WHERE (
        (a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()))
        OR (a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
        OR (a.profile_id = auth.uid())
      )
    ))
  ) 
  OR (
    (entity_type = 'docente'::text) AND (entity_id IN (
      SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()
    ))
  )
);

-- badge_assegnazioni policies (without collaboratori)
CREATE POLICY "Users can manage badge_assegnazioni for their entities" 
ON public.badge_assegnazioni FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (azienda_id IN (
    SELECT a.id FROM aziende a
    WHERE (
      (a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()))
      OR (a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
      OR (a.profile_id = auth.uid())
    )
  ))
  OR (docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (azienda_id IN (
    SELECT a.id FROM aziende a
    WHERE (
      (a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()))
      OR (a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
      OR (a.profile_id = auth.uid())
    )
  ))
  OR (docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
);

CREATE POLICY "Users can view their own badges" 
ON public.badge_assegnazioni FOR SELECT 
USING (
  (docente_id IN (SELECT docenti.id FROM docenti WHERE docenti.profile_id = auth.uid()))
  OR (azienda_id IN (SELECT aziende.id FROM aziende WHERE aziende.profile_id = auth.uid()))
);