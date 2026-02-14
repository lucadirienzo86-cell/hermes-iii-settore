-- Rendi la colonna gestore_id nullable nella tabella collaboratori
-- per permettere collaboratori non ancora assegnati a un gestore
ALTER TABLE public.collaboratori 
ALTER COLUMN gestore_id DROP NOT NULL;