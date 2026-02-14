-- Aggiunta colonne per claim commerciale e aree di competenza
ALTER TABLE public.avvisi_fondi 
ADD COLUMN IF NOT EXISTS claim_commerciale text,
ADD COLUMN IF NOT EXISTS aree_competenza text[];