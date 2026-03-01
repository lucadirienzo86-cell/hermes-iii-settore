-- Policy per permettere INSERT pubblico per registrazione autonoma associazioni
-- Questa policy permette a chiunque (anche non autenticati) di registrare una nuova associazione
DO $$ BEGIN
  CREATE POLICY "Registrazione pubblica associazioni"
  ON associazioni_terzo_settore
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Solo se fonte_dato è 'registrazione_autonoma' e stato_albo è 'non_iscritta'
    fonte_dato = 'registrazione_autonoma' AND
    stato_albo = 'non_iscritta' AND
    profile_id IS NULL
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;