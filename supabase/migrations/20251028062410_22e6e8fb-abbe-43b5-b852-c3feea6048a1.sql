
-- Crea il record azienda per l'utente test se non esiste
-- (solo se il profilo esiste, altrimenti skip)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = '110da24a-5c47-481b-9b21-6b41030b8084')
     AND NOT EXISTS (SELECT 1 FROM aziende WHERE email = 'azienda@test.it') THEN
    INSERT INTO aziende (
      profile_id,
      email,
      ragione_sociale,
      partita_iva,
      regione,
      numero_dipendenti,
      costituzione_societa,
      dimensione_azienda
    ) VALUES (
      '110da24a-5c47-481b-9b21-6b41030b8084',
      'azienda@test.it',
      'Test Azienda S.r.l.',
      '12345678901',
      'Lombardia',
      '12',
      '2020',
      'PMI'
    );
  END IF;
END $$;

-- Inserisci valori KPI se l'azienda test esiste
-- La banca richiede: Fatturato >= 500000, ROE >= 5, Debt/Equity <= 2.5, EBITDA >= 100000, Liquidità >= 1.2, Capitale sociale >= 50000
DO $$
DECLARE
  v_azienda_id uuid;
BEGIN
  SELECT id INTO v_azienda_id FROM aziende WHERE email = 'azienda@test.it' LIMIT 1;
  IF v_azienda_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO aziende_kpi_valori (azienda_id, kpi_parametro_id, valore, anno_riferimento, fonte)
  SELECT
    v_azienda_id,
    kpi_parametro_id,
    valore,
    2024,
    'Bilancio 2024'
  FROM (
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'ricavi_operativi') as kpi_parametro_id, 850000::numeric as valore
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'ebitda'), 150000::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'patrimonio_netto'), 300000::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'totale_debiti'), 600000::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'roe'), 8.5::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'roi'), 12.3::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'debt_equity_ratio'), 2.0::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'indice_liquidita'), 1.5::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'capitale_sociale'), 100000::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'utile_netto'), 45000::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'totale_attivo'), 1200000::numeric
    UNION ALL
    SELECT (SELECT id FROM kpi_parametri_options WHERE codice = 'ebit'), 120000::numeric
  ) valori
  WHERE kpi_parametro_id IS NOT NULL
  ON CONFLICT (azienda_id, kpi_parametro_id, anno_riferimento)
  DO UPDATE SET
    valore = EXCLUDED.valore,
    fonte = EXCLUDED.fonte,
    updated_at = now();
END $$;
