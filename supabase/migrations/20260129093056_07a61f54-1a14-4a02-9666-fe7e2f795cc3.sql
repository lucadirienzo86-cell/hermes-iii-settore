-- Ensure foreign key exists between pratiche_messaggi.sender_id and profiles.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pratiche_messaggi_sender_id_fkey' 
    AND table_name = 'pratiche_messaggi'
  ) THEN
    ALTER TABLE public.pratiche_messaggi
    ADD CONSTRAINT pratiche_messaggi_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id);
  END IF;
END $$;