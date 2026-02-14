-- Aggiungi colonna attivo alle tabelle options
ALTER TABLE public.investimenti_finanziabili_options
ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;

ALTER TABLE public.spese_ammissibili_options
ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;

-- Aggiungi colonna messaggio (alias per message) ai messaggi pratiche
-- I file usano "messaggio" ma la tabella ha "message" - allineiamo al codice
-- Non possiamo rinominare facilmente, usiamo un alias con una view o aggiorniamo il codice