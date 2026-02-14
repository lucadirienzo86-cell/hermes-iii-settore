-- Rimuovere i vecchi campi sede_legale e sede_operativa
ALTER TABLE bandi DROP COLUMN IF EXISTS sede_legale;
ALTER TABLE bandi DROP COLUMN IF EXISTS sede_operativa;

-- Aggiungere il nuovo campo sede_interesse
ALTER TABLE bandi ADD COLUMN sede_interesse text[] DEFAULT '{}';