-- Rimuovo il campo esistente sede_interesse
ALTER TABLE public.bandi DROP COLUMN sede_interesse;

-- Aggiungo tre nuovi campi per distinguere le sedi
ALTER TABLE public.bandi 
  ADD COLUMN sede_legale text[] DEFAULT '{}',
  ADD COLUMN sede_operativa text[] DEFAULT '{}',
  ADD COLUMN entrambe_sedi text[] DEFAULT '{}';

-- Commento per chiarezza
COMMENT ON COLUMN public.bandi.sede_legale IS 'Regioni per sede legale';
COMMENT ON COLUMN public.bandi.sede_operativa IS 'Regioni per sede operativa';
COMMENT ON COLUMN public.bandi.entrambe_sedi IS 'Regioni che richiedono entrambe le sedi';