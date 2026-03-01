-- Aggiunge policy per permettere ai gestori di aggiornare gestore_pratiche_id sulle loro pratiche
DO $$ BEGIN
  CREATE POLICY "Gestori can update gestore_pratiche_id on their aziende pratiche"
  ON public.pratiche
  FOR UPDATE
  USING (
    azienda_id IN (
      SELECT aziende.id
      FROM aziende
      WHERE aziende.inserita_da_gestore_id IN (
        SELECT gestori.id
        FROM gestori
        WHERE gestori.profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    azienda_id IN (
      SELECT aziende.id
      FROM aziende
      WHERE aziende.inserita_da_gestore_id IN (
        SELECT gestori.id
        FROM gestori
        WHERE gestori.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Aggiunge policy per permettere ai docenti di aggiornare gestore_pratiche_id sulle loro pratiche
DO $$ BEGIN
  CREATE POLICY "Docenti can update gestore_pratiche_id on their aziende pratiche"
  ON public.pratiche
  FOR UPDATE
  USING (
    azienda_id IN (
      SELECT aziende.id
      FROM aziende
      WHERE aziende.inserita_da_docente_id IN (
        SELECT docenti.id
        FROM docenti
        WHERE docenti.profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    azienda_id IN (
      SELECT aziende.id
      FROM aziende
      WHERE aziende.inserita_da_docente_id IN (
        SELECT docenti.id
        FROM docenti
        WHERE docenti.profile_id = auth.uid()
      )
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;