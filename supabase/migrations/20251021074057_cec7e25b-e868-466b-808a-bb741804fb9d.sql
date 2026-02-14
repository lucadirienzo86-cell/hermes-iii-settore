-- Modificare il campo numero_dipendenti da text a text[]
ALTER TABLE bandi 
ALTER COLUMN numero_dipendenti TYPE text[] 
USING CASE 
  WHEN numero_dipendenti IS NULL THEN '{}'::text[]
  WHEN numero_dipendenti = '' THEN '{}'::text[]
  ELSE ARRAY[numero_dipendenti]::text[]
END;

-- Modificare il campo costituzione_societa da text a text[]
ALTER TABLE bandi 
ALTER COLUMN costituzione_societa TYPE text[] 
USING CASE 
  WHEN costituzione_societa IS NULL THEN '{}'::text[]
  WHEN costituzione_societa = '' THEN '{}'::text[]
  ELSE ARRAY[costituzione_societa]::text[]
END;

-- Impostare default per i nuovi record
ALTER TABLE bandi ALTER COLUMN numero_dipendenti SET DEFAULT '{}';
ALTER TABLE bandi ALTER COLUMN costituzione_societa SET DEFAULT '{}';

COMMENT ON COLUMN bandi.numero_dipendenti IS 'Array di fasce di dipendenti ammesse per questo bando';
COMMENT ON COLUMN bandi.costituzione_societa IS 'Array di anzianità societarie ammesse per questo bando';