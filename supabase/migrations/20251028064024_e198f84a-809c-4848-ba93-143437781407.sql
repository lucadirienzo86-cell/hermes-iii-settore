
-- Inserisci valori KPI per l'anno 2025 (stessi valori del 2024)
WITH azienda_id AS (
  SELECT id FROM aziende WHERE email = 'azienda@test.it' LIMIT 1
),
kpi_ids AS (
  SELECT 
    (SELECT id FROM kpi_parametri_options WHERE codice = 'ricavi_operativi') as ricavi,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'ebitda') as ebitda,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'patrimonio_netto') as patrimonio,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'totale_debiti') as debiti,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'roe') as roe,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'roi') as roi,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'debt_equity_ratio') as debt_equity,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'indice_liquidita') as liquidita,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'capitale_sociale') as capitale_sociale,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'utile_netto') as utile_netto,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'totale_attivo') as totale_attivo,
    (SELECT id FROM kpi_parametri_options WHERE codice = 'ebit') as ebit
)
INSERT INTO aziende_kpi_valori (azienda_id, kpi_parametro_id, valore, anno_riferimento, fonte)
SELECT 
  (SELECT id FROM azienda_id),
  kpi_parametro_id,
  valore,
  2025,
  'Bilancio 2025'
FROM (
  SELECT (SELECT ricavi FROM kpi_ids) as kpi_parametro_id, 850000::numeric as valore
  UNION ALL
  SELECT (SELECT ebitda FROM kpi_ids), 150000::numeric
  UNION ALL
  SELECT (SELECT patrimonio FROM kpi_ids), 300000::numeric
  UNION ALL
  SELECT (SELECT debiti FROM kpi_ids), 600000::numeric
  UNION ALL
  SELECT (SELECT roe FROM kpi_ids), 8.5::numeric
  UNION ALL
  SELECT (SELECT roi FROM kpi_ids), 12.3::numeric
  UNION ALL
  SELECT (SELECT debt_equity FROM kpi_ids), 2.0::numeric
  UNION ALL
  SELECT (SELECT liquidita FROM kpi_ids), 1.5::numeric
  UNION ALL
  SELECT (SELECT capitale_sociale FROM kpi_ids), 100000::numeric
  UNION ALL
  SELECT (SELECT utile_netto FROM kpi_ids), 45000::numeric
  UNION ALL
  SELECT (SELECT totale_attivo FROM kpi_ids), 1200000::numeric
  UNION ALL
  SELECT (SELECT ebit FROM kpi_ids), 120000::numeric
) valori
ON CONFLICT (azienda_id, kpi_parametro_id, anno_riferimento) 
DO UPDATE SET 
  valore = EXCLUDED.valore,
  fonte = EXCLUDED.fonte,
  updated_at = now();
