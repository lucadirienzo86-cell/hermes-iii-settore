-- Add ordine column to badge_tipi table for ordering
ALTER TABLE public.badge_tipi ADD COLUMN IF NOT EXISTS ordine INTEGER DEFAULT 0;

-- Update existing records with sequential order based on creation date
WITH ordered_badges AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_ordine
  FROM public.badge_tipi
)
UPDATE public.badge_tipi 
SET ordine = ordered_badges.new_ordine
FROM ordered_badges
WHERE public.badge_tipi.id = ordered_badges.id;