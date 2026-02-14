-- Add fiscal data columns to docenti table
ALTER TABLE public.docenti
ADD COLUMN IF NOT EXISTS codice_fiscale TEXT,
ADD COLUMN IF NOT EXISTS partita_iva TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS ragione_sociale TEXT,
ADD COLUMN IF NOT EXISTS indirizzo_fatturazione TEXT;