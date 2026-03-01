-- Tabella per log delle modifiche ai badge
CREATE TABLE public.badge_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_assegnazione_id UUID,
  badge_tipo_id UUID NOT NULL REFERENCES badge_tipi(id),
  entity_type TEXT NOT NULL, -- 'azienda', 'docente', 'collaboratore'
  entity_id UUID NOT NULL,
  azione TEXT NOT NULL, -- 'assegnato', 'rimosso'
  eseguito_da UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT
);

-- Abilita RLS
ALTER TABLE public.badge_log ENABLE ROW LEVEL SECURITY;

-- Policy: admin può vedere tutto
DO $$ BEGIN
  CREATE POLICY "Admins can manage badge_log"
  ON badge_log
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy: gli utenti possono vedere i log delle proprie entità
DO $$ BEGIN
  CREATE POLICY "Users can view badge_log for their entities"
  ON badge_log
  FOR SELECT
  TO authenticated
  USING (
    -- Per aziende
    (entity_type = 'azienda' AND entity_id IN (
      SELECT a.id FROM aziende a
      WHERE 
        a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid())
        OR a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid())
        OR a.inserita_da_collaboratore_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid())
        OR a.profile_id = auth.uid()
    ))
    OR
    -- Per docenti
    (entity_type = 'docente' AND entity_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
    OR
    -- Per collaboratori
    (entity_type = 'collaboratore' AND entity_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid()))
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy: gli utenti possono inserire log per le proprie entità
DO $$ BEGIN
  CREATE POLICY "Users can insert badge_log for their entities"
  ON badge_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR
    (entity_type = 'azienda' AND entity_id IN (
      SELECT a.id FROM aziende a
      WHERE 
        a.inserita_da_gestore_id IN (SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid())
        OR a.inserita_da_docente_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid())
        OR a.inserita_da_collaboratore_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid())
        OR a.profile_id = auth.uid()
    ))
    OR
    (entity_type = 'docente' AND entity_id IN (SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()))
    OR
    (entity_type = 'collaboratore' AND entity_id IN (SELECT c.id FROM collaboratori c WHERE c.profile_id = auth.uid()))
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;