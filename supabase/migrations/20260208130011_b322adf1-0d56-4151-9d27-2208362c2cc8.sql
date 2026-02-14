-- Fix function search path for the new functions
CREATE OR REPLACE FUNCTION public.generate_bando_hash(
  p_titolo text,
  p_ente text,
  p_link text
) RETURNS text 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN md5(COALESCE(lower(trim(p_titolo)), '') || '|' || COALESCE(lower(trim(p_ente)), '') || '|' || COALESCE(lower(trim(p_link)), ''));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_bando_hash() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.hash_dedup := public.generate_bando_hash(NEW.titolo, NEW.ente, NEW.link_bando);
  RETURN NEW;
END;
$$;