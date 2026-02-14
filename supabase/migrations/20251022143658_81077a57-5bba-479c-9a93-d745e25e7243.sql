-- Aggiorna la funzione handle_new_user per salvare anche il telefono
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Inserisce il profilo con email, nome e telefono
  INSERT INTO public.profiles (id, email, nome, telefono)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'telefono'
  );
  
  -- Inserisce il ruolo se specificato nei metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  
  RETURN NEW;
END;
$function$;