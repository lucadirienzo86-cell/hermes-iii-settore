-- Drop the existing foreign key constraint
ALTER TABLE public.badge_log 
DROP CONSTRAINT IF EXISTS badge_log_eseguito_da_fkey;

-- Re-add with ON DELETE SET NULL so deleting a profile sets eseguito_da to NULL instead of blocking
ALTER TABLE public.badge_log 
ADD CONSTRAINT badge_log_eseguito_da_fkey 
FOREIGN KEY (eseguito_da) REFERENCES public.profiles(id) ON DELETE SET NULL;