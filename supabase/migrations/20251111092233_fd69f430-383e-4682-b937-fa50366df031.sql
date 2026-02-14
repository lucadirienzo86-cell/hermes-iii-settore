-- Enable realtime for pratiche_messaggi
ALTER TABLE pratiche_messaggi REPLICA IDENTITY FULL;

-- Add the table to the realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'pratiche_messaggi'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pratiche_messaggi;
  END IF;
END $$;