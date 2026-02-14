-- Assicuriamoci che tutte le aziende abbiano un'email
-- Per le aziende con profile_id, usa l'email del profilo
UPDATE public.aziende
SET email = profiles.email
FROM public.profiles
WHERE aziende.profile_id = profiles.id 
  AND (aziende.email IS NULL OR aziende.email LIKE '%@placeholder.com');

-- Per le aziende senza profile_id o ancora senza email, genera email fittizie
UPDATE public.aziende
SET email = 'azienda_' || SUBSTRING(id::text, 1, 8) || '@sofabis-placeholder.com'
WHERE email IS NULL OR email LIKE '%@placeholder.com';