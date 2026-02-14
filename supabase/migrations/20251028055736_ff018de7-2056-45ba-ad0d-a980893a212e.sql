-- Inserisci banca di esempio "BANCA CF+ PR"
INSERT INTO public.banche (nome_banca, descrizione, attivo)
VALUES (
  'BANCA CF+ PR',
  'Banca specializzata in finanziamenti per PMI con focus su innovazione e crescita',
  true
);

-- Inserisci requisiti KPI per la banca
DO $$
DECLARE
  v_banca_id UUID;
  v_ricavi_id UUID;
  v_ebitda_id UUID;
  v_totale_attivo_id UUID;
  v_totale_passivo_id UUID;
  v_patrimonio_netto_id UUID;
  v_totale_debiti_id UUID;
  v_oneri_finanziari_id UUID;
BEGIN
  -- Recupera ID banca
  SELECT id INTO v_banca_id FROM public.banche WHERE nome_banca = 'BANCA CF+ PR' LIMIT 1;

  -- Recupera ID dei parametri KPI
  SELECT id INTO v_ricavi_id FROM public.kpi_parametri_options WHERE codice = 'ricavi_operativi';
  SELECT id INTO v_ebitda_id FROM public.kpi_parametri_options WHERE codice = 'ebitda';
  SELECT id INTO v_totale_attivo_id FROM public.kpi_parametri_options WHERE codice = 'totale_attivo';
  SELECT id INTO v_totale_passivo_id FROM public.kpi_parametri_options WHERE codice = 'totale_passivo';
  SELECT id INTO v_patrimonio_netto_id FROM public.kpi_parametri_options WHERE codice = 'patrimonio_netto';
  SELECT id INTO v_totale_debiti_id FROM public.kpi_parametri_options WHERE codice = 'totale_debiti';
  SELECT id INTO v_oneri_finanziari_id FROM public.kpi_parametri_options WHERE codice = 'oneri_finanziari';

  -- 1. Ricavi operativi >= 1.000.000 € (OBBLIGATORIO)
  INSERT INTO public.banche_kpi_requisiti (
    banca_id, kpi_parametro_id, operatore, valore_minimo, obbligatorio, ordine_visualizzazione
  ) VALUES (
    v_banca_id, v_ricavi_id, 'maggiore_uguale', 1000000, true, 1
  );

  -- 2. EBITDA >= 100.000 € (OBBLIGATORIO)
  INSERT INTO public.banche_kpi_requisiti (
    banca_id, kpi_parametro_id, operatore, valore_minimo, obbligatorio, ordine_visualizzazione
  ) VALUES (
    v_banca_id, v_ebitda_id, 'maggiore_uguale', 100000, true, 2
  );

  -- 3. Totale attivo >= 500.000 €
  INSERT INTO public.banche_kpi_requisiti (
    banca_id, kpi_parametro_id, operatore, valore_minimo, obbligatorio, ordine_visualizzazione
  ) VALUES (
    v_banca_id, v_totale_attivo_id, 'maggiore_uguale', 500000, false, 3
  );

  -- 4. Totale passivo <= 800.000 €
  INSERT INTO public.banche_kpi_requisiti (
    banca_id, kpi_parametro_id, operatore, valore_minimo, obbligatorio, ordine_visualizzazione
  ) VALUES (
    v_banca_id, v_totale_passivo_id, 'minore_uguale', 800000, false, 4
  );

  -- 5. Patrimonio netto >= 200.000 € (OBBLIGATORIO)
  INSERT INTO public.banche_kpi_requisiti (
    banca_id, kpi_parametro_id, operatore, valore_minimo, obbligatorio, ordine_visualizzazione
  ) VALUES (
    v_banca_id, v_patrimonio_netto_id, 'maggiore_uguale', 200000, true, 5
  );

  -- 6. Totale debiti <= 600.000 €
  INSERT INTO public.banche_kpi_requisiti (
    banca_id, kpi_parametro_id, operatore, valore_minimo, obbligatorio, ordine_visualizzazione
  ) VALUES (
    v_banca_id, v_totale_debiti_id, 'minore_uguale', 600000, false, 6
  );

  -- 7. Oneri finanziari <= 50.000 €
  INSERT INTO public.banche_kpi_requisiti (
    banca_id, kpi_parametro_id, operatore, valore_minimo, obbligatorio, ordine_visualizzazione
  ) VALUES (
    v_banca_id, v_oneri_finanziari_id, 'minore_uguale', 50000, false, 7
  );

END $$;