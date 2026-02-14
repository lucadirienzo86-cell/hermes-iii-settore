-- Rimuovere campi vecchi min/max
ALTER TABLE bandi 
DROP COLUMN IF EXISTS contributo_minimo,
DROP COLUMN IF EXISTS contributo_massimo,
DROP COLUMN IF EXISTS agevolazione_percentuale_min,
DROP COLUMN IF EXISTS agevolazione_percentuale_max;

-- Aggiungere nuovi campi singoli
ALTER TABLE bandi 
ADD COLUMN agevolazione_percentuale numeric,
ADD COLUMN agevolazione_euro numeric;