-- Aggiungi campo email alla tabella aziende
-- Prima aggiungi il campo come nullable
ALTER TABLE public.aziende ADD COLUMN email TEXT;

-- Popola le aziende esistenti con l'email dal profilo (se esiste)
UPDATE public.aziende
SET email = profiles.email
FROM public.profiles
WHERE aziende.profile_id = profiles.id AND aziende.email IS NULL;

-- Per le aziende senza profile_id o email, metti un placeholder
UPDATE public.aziende
SET email = 'azienda' || id::text || '@placeholder.com'
WHERE email IS NULL;

-- Ora rendi il campo obbligatorio
ALTER TABLE public.aziende ALTER COLUMN email SET NOT NULL;