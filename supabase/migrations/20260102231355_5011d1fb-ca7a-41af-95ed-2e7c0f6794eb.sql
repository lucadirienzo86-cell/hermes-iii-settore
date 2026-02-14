-- Add sempre_disponibile flag to avvisi_fondi
ALTER TABLE public.avvisi_fondi 
ADD COLUMN IF NOT EXISTS sempre_disponibile BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.avvisi_fondi.sempre_disponibile IS 'Se true, avviso sempre aperto con incroci automatici visibili. Se false, avviso a progetto con sistema alert.';