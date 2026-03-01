-- =============================================
-- RLS POLICIES PER GESTORI E DOCENTI
-- Permettono gestione completa di documenti e chat
-- =============================================

-- 1. PRATICHE_DOCUMENTI - SELECT per Gestori
DO $$ BEGIN
  CREATE POLICY "Gestori can view documenti of their aziende pratiche"
  ON public.pratiche_documenti
  FOR SELECT
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_gestore_id IN (
        SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. PRATICHE_DOCUMENTI - SELECT per Docenti
DO $$ BEGIN
  CREATE POLICY "Docenti can view documenti of their aziende pratiche"
  ON public.pratiche_documenti
  FOR SELECT
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_docente_id IN (
        SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. PRATICHE_DOCUMENTI - DELETE per Gestori
DO $$ BEGIN
  CREATE POLICY "Gestori can delete documenti of their aziende pratiche"
  ON public.pratiche_documenti
  FOR DELETE
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_gestore_id IN (
        SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. PRATICHE_DOCUMENTI - DELETE per Docenti
DO $$ BEGIN
  CREATE POLICY "Docenti can delete documenti of their aziende pratiche"
  ON public.pratiche_documenti
  FOR DELETE
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_docente_id IN (
        SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 5. PRATICHE_MESSAGGI - SELECT per Gestori
DO $$ BEGIN
  CREATE POLICY "Gestori can view messaggi of their aziende pratiche"
  ON public.pratiche_messaggi
  FOR SELECT
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_gestore_id IN (
        SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. PRATICHE_MESSAGGI - SELECT per Docenti
DO $$ BEGIN
  CREATE POLICY "Docenti can view messaggi of their aziende pratiche"
  ON public.pratiche_messaggi
  FOR SELECT
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_docente_id IN (
        SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. PRATICHE_MESSAGGI - INSERT per Gestori
DO $$ BEGIN
  CREATE POLICY "Gestori can insert messaggi in their aziende pratiche"
  ON public.pratiche_messaggi
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_gestore_id IN (
        SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. PRATICHE_MESSAGGI - INSERT per Docenti
DO $$ BEGIN
  CREATE POLICY "Docenti can insert messaggi in their aziende pratiche"
  ON public.pratiche_messaggi
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_docente_id IN (
        SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 9. PRATICHE_MESSAGGI - UPDATE per Gestori (segna come letti)
DO $$ BEGIN
  CREATE POLICY "Gestori can update letto on their aziende pratiche"
  ON public.pratiche_messaggi
  FOR UPDATE
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_gestore_id IN (
        SELECT g.id FROM gestori g WHERE g.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 10. PRATICHE_MESSAGGI - UPDATE per Docenti (segna come letti)
DO $$ BEGIN
  CREATE POLICY "Docenti can update letto on their aziende pratiche"
  ON public.pratiche_messaggi
  FOR UPDATE
  USING (
    pratica_id IN (
      SELECT p.id FROM pratiche p
      JOIN aziende a ON p.azienda_id = a.id
      WHERE a.inserita_da_docente_id IN (
        SELECT d.id FROM docenti d WHERE d.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;