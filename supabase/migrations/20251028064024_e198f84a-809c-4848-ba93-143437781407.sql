
-- Inserisci valori KPI per l'anno 2025 (solo se l'azienda test esiste)
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
    2025,
    'Bilancio 2025'
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
