-- Aggiunge nuovi campi alla tabella avvisi_fondi

-- 1. Campo data "Manifestazione di interesse entro il"
ALTER TABLE public.avvisi_fondi 
ADD COLUMN IF NOT EXISTS data_manifestazione_interesse date;

-- 2. Campo "Costo" (categorizzato)
ALTER TABLE public.avvisi_fondi 
ADD COLUMN IF NOT EXISTS costo text;

-- 3. Campo "Anticipo azienda" (categorizzato)
ALTER TABLE public.avvisi_fondi 
ADD COLUMN IF NOT EXISTS anticipo_azienda text;

-- 4. Modifica pdf_urls per supportare nomi personalizzati
-- La colonna pdf_urls rimane text[] per retrocompatibilità
-- Aggiungiamo una nuova colonna per i documenti con nomi
ALTER TABLE public.avvisi_fondi 
ADD COLUMN IF NOT EXISTS documenti_pdf jsonb DEFAULT '[]'::jsonb;

-- Commento esplicativo sui nuovi campi
COMMENT ON COLUMN public.avvisi_fondi.data_manifestazione_interesse IS 'Data entro cui manifestare interesse';
COMMENT ON COLUMN public.avvisi_fondi.costo IS 'Tipo di costo: Gratuito, A pagamento, Parzialmente a carico, Da definire';
COMMENT ON COLUMN public.avvisi_fondi.anticipo_azienda IS 'Anticipo richiesto: Sì, No, Parziale';
COMMENT ON COLUMN public.avvisi_fondi.documenti_pdf IS 'Array di documenti PDF con nome personalizzato: [{url: string, nome: string}]';