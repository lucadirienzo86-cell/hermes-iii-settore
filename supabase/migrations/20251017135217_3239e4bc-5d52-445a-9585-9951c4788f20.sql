-- Aggiungi campi nome e cognome alla tabella profiles per gli editori
ALTER TABLE public.profiles
ADD COLUMN nome TEXT,
ADD COLUMN cognome TEXT;