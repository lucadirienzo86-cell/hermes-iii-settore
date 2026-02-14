-- Aggiungi colonna fornitore_qualificato alla tabella bandi
ALTER TABLE public.bandi 
ADD COLUMN fornitore_qualificato boolean DEFAULT false;