-- Aggiunge nuove colonne per il nuovo formato JSON RNA
ALTER TABLE public.aziende_aiuti_rna 
ADD COLUMN IF NOT EXISTS titolo_misura TEXT,
ADD COLUMN IF NOT EXISTS autorita_concedente TEXT;