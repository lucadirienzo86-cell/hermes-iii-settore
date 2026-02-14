-- Pulisce i record che hanno ancora "Da completare" come nome
UPDATE public.collaboratori 
SET nome = '', 
    updated_at = now()
WHERE nome = 'Da completare';

UPDATE public.gestori 
SET nome = '', 
    updated_at = now()
WHERE nome = 'Da completare';