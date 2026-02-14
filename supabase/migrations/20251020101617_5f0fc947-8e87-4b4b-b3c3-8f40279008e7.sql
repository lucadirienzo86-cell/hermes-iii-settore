-- Add percentage fields to bandi table
ALTER TABLE bandi 
ADD COLUMN agevolazione_percentuale_min numeric,
ADD COLUMN agevolazione_percentuale_max numeric;