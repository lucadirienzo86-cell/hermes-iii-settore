-- Aggiungi campi OBBLIGATORI per matching con bandi
ALTER TABLE public.aziende 
ADD COLUMN numero_dipendenti text;

ALTER TABLE public.aziende 
ADD COLUMN costituzione_societa text;

ALTER TABLE public.aziende 
ADD COLUMN sede_operativa text;

-- Array di codici ATECO (supporta più codici invece del singolo codice_ateco)
ALTER TABLE public.aziende 
ADD COLUMN codici_ateco text[];

-- Aggiungi campi OPZIONALI
ALTER TABLE public.aziende 
ADD COLUMN investimenti_interesse text[];

ALTER TABLE public.aziende 
ADD COLUMN spese_interesse text[];

-- Commenti per chiarezza
COMMENT ON COLUMN public.aziende.numero_dipendenti IS 'Range numero dipendenti (0, 1/6, 7/9, 10/19, 20/49, 50/99, 100/250, +250)';
COMMENT ON COLUMN public.aziende.costituzione_societa IS 'Range costituzione società (Da costituire, Fino a 12 mesi, Da 12 a 24 mesi, Da 24 a 60 mesi, Oltre 60 mesi)';
COMMENT ON COLUMN public.aziende.sede_operativa IS 'Regione sede operativa (può differire dalla sede legale)';
COMMENT ON COLUMN public.aziende.codici_ateco IS 'Array di codici ATECO - supporta selezione multipla';
COMMENT ON COLUMN public.aziende.investimenti_interesse IS 'Array degli investimenti di interesse per l''azienda - OPZIONALE';
COMMENT ON COLUMN public.aziende.spese_interesse IS 'Array delle tipologie di spese di interesse - OPZIONALE';