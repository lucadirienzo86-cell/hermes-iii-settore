-- Aggiungi tabelle mancanti per le opzioni e fix dello schema

-- Tabella per opzioni investimenti finanziabili
CREATE TABLE IF NOT EXISTS public.investimenti_finanziabili_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.investimenti_finanziabili_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view investimenti options"
  ON public.investimenti_finanziabili_options FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage investimenti options"
  ON public.investimenti_finanziabili_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabella per opzioni spese ammissibili
CREATE TABLE IF NOT EXISTS public.spese_ammissibili_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.spese_ammissibili_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view spese options"
  ON public.spese_ammissibili_options FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage spese options"
  ON public.spese_ammissibili_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix update_updated_at function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aggiungi colonna letto ai messaggi pratiche
ALTER TABLE public.pratiche_messaggi
ADD COLUMN IF NOT EXISTS letto BOOLEAN DEFAULT false;