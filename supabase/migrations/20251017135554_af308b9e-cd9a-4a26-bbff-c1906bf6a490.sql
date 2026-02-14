-- Rimuovi il ruolo admin da tutti gli utenti tranne paolo.baldassare@gmail.com
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id != (
    SELECT id FROM auth.users 
    WHERE email = 'paolo.baldassare@gmail.com'
    LIMIT 1
  );