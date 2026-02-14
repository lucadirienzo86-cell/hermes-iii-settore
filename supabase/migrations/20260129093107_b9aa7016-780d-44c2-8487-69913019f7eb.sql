-- Drop constraint if exists and recreate
ALTER TABLE public.pratiche_messaggi
DROP CONSTRAINT IF EXISTS pratiche_messaggi_sender_id_fkey;

ALTER TABLE public.pratiche_messaggi
ADD CONSTRAINT pratiche_messaggi_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id);