-- Aggiunta colonna qualifiche_azienda alla tabella aziende
ALTER TABLE public.aziende 
ADD COLUMN IF NOT EXISTS qualifiche_azienda text[] DEFAULT '{}';

COMMENT ON COLUMN public.aziende.qualifiche_azienda IS 
'Qualifiche opzionali: Startup / Impresa innovativa, Impresa in rete / Aggregazione, Ditta individuale';