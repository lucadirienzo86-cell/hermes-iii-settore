
-- Drop the old stato check constraint
ALTER TABLE pratiche DROP CONSTRAINT IF EXISTS pratiche_stato_check;

-- Add new check constraint with all 14 new states
ALTER TABLE pratiche ADD CONSTRAINT pratiche_stato_check 
CHECK (stato = ANY (ARRAY[
  'Generata',
  'In attesa di documentazione dal cliente',
  'In revisione',
  'Protocollata',
  'Esito Positivo',
  'Esito negativo',
  'Documentazione mancante',
  'In attesa di Rendicontazione',
  'Erogata',
  'Archiviata',
  'Contattato',
  'Pratica in valutazione dal cliente',
  'Pratica in attesa di doc per avvio pratica',
  'In attesa di raggiungimento plafond spesa per avvio pratica'
]::text[]));
