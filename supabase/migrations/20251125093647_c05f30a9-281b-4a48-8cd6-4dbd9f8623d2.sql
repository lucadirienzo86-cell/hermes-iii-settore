-- Abilita REPLICA IDENTITY FULL per le tabelle dei messaggi
-- Questo permette a Supabase Realtime di catturare correttamente gli eventi UPDATE

ALTER TABLE public.pratiche_messaggi REPLICA IDENTITY FULL;
ALTER TABLE public.pratiche_finanziamenti_messaggi REPLICA IDENTITY FULL;