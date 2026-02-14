
-- Drop the incorrect foreign key constraint
ALTER TABLE pratiche DROP CONSTRAINT IF EXISTS pratiche_azienda_id_fkey;

-- Add the correct foreign key constraint pointing to aziende table
ALTER TABLE pratiche ADD CONSTRAINT pratiche_azienda_id_fkey 
  FOREIGN KEY (azienda_id) REFERENCES aziende(id) ON DELETE CASCADE;
