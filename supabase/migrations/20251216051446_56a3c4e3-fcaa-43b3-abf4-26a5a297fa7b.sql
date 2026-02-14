-- Tabella per memorizzare i dati delle aziende aderenti a Fondimpresa
CREATE TABLE public.fondimpresa_aziende (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_fiscale TEXT NOT NULL UNIQUE,
  denominazione_azienda TEXT,
  provincia TEXT,
  regione TEXT,
  data_adesione DATE,
  anno_adesione INTEGER,
  numero_dipendenti INTEGER,
  classe_dimensionale TEXT,
  stato_registrazione TEXT,
  data_estrazione DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indice per ricerche veloci sulla partita IVA/codice fiscale
CREATE INDEX idx_fondimpresa_codice_fiscale ON public.fondimpresa_aziende(codice_fiscale);

-- Indice per ricerche per regione
CREATE INDEX idx_fondimpresa_regione ON public.fondimpresa_aziende(regione);

-- Enable RLS
ALTER TABLE public.fondimpresa_aziende ENABLE ROW LEVEL SECURITY;

-- Policy: Admin ed editore possono gestire tutto
CREATE POLICY "Admin/editore can manage fondimpresa_aziende"
ON public.fondimpresa_aziende
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

-- Policy: Utenti autenticati possono leggere (per la verifica)
CREATE POLICY "Authenticated users can view fondimpresa_aziende"
ON public.fondimpresa_aziende
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger per updated_at
CREATE TRIGGER update_fondimpresa_aziende_updated_at
BEFORE UPDATE ON public.fondimpresa_aziende
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();