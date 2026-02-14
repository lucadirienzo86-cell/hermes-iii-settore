-- Update handle_new_user to properly support pro_loco and associazione roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  role_from_metadata text;
BEGIN
  -- Extract role from metadata
  role_from_metadata := NEW.raw_user_meta_data->>'role';
  
  -- Map role string to app_role enum (default to 'collaboratore' if not valid)
  CASE role_from_metadata
    WHEN 'admin' THEN user_role := 'admin'::app_role;
    WHEN 'editore' THEN user_role := 'editore'::app_role;
    WHEN 'gestore' THEN user_role := 'gestore'::app_role;
    WHEN 'docente' THEN user_role := 'docente'::app_role;
    WHEN 'azienda' THEN user_role := 'azienda'::app_role;
    WHEN 'gestore_pratiche' THEN user_role := 'gestore_pratiche'::app_role;
    WHEN 'comune' THEN user_role := 'comune'::app_role;
    WHEN 'assessorato_terzo_settore' THEN user_role := 'assessorato_terzo_settore'::app_role;
    WHEN 'associazione' THEN user_role := 'associazione'::app_role;
    WHEN 'pro_loco' THEN user_role := 'pro_loco'::app_role;
    ELSE user_role := 'collaboratore'::app_role;
  END CASE;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, nome, cognome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', '')
  );
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;