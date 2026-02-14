-- Aggiungi colonne per contributo minimo e massimo
ALTER TABLE bandi 
ADD COLUMN contributo_minimo numeric,
ADD COLUMN contributo_massimo numeric;