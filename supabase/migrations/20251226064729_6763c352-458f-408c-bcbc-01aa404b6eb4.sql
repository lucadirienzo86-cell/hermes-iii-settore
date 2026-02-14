-- Create tipi_agevolazione_options table
CREATE TABLE public.tipi_agevolazione_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ordine INTEGER DEFAULT 0,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tipi_agevolazione_options ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage tipi agevolazione options" 
ON public.tipi_agevolazione_options 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Editori can manage
CREATE POLICY "Editori can manage tipi agevolazione options" 
ON public.tipi_agevolazione_options 
FOR ALL 
USING (has_role(auth.uid(), 'editore'::app_role));

-- Anyone authenticated can view
CREATE POLICY "Anyone authenticated can view tipi agevolazione options" 
ON public.tipi_agevolazione_options 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert default values
INSERT INTO public.tipi_agevolazione_options (nome, ordine) VALUES 
  ('Fondo perduto', 1),
  ('Credito d''imposta', 2),
  ('Finanziamento agevolato', 3),
  ('Garanzia', 4),
  ('Misto', 5),
  ('Voucher', 6);