-- Creazione trigger function per updated_at se non esiste
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creazione tabella bandi
CREATE TABLE public.bandi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dati generali
  nome_bando text NOT NULL,
  attivo boolean DEFAULT true NOT NULL,
  testo_bando text,
  data_inizio date NOT NULL,
  data_fine date NOT NULL,
  
  -- Criteri azienda
  settore_ateco text[] DEFAULT '{}',
  aree_interesse text[] DEFAULT '{}',
  sede_interesse text,
  tipo_azienda text,
  numero_dipendenti text,
  costituzione_societa text,
  
  -- Finanziamenti
  tipi_finanziamento text[] DEFAULT '{}',
  investimenti_finanziabili text[] DEFAULT '{}',
  spese_ammissibili text[] DEFAULT '{}',
  contributo_minimo numeric DEFAULT 0,
  contributo_massimo numeric DEFAULT 0,
  testo_esito_positivo text,
  dettagli_commissione_pratica text,
  allegati text[] DEFAULT '{}',
  
  -- Sistema
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Trigger per updated_at
CREATE TRIGGER set_bandi_updated_at
  BEFORE UPDATE ON public.bandi
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indici per performance
CREATE INDEX idx_bandi_attivo ON public.bandi(attivo);
CREATE INDEX idx_bandi_data_fine ON public.bandi(data_fine);
CREATE INDEX idx_bandi_created_by ON public.bandi(created_by);

-- Enable RLS
ALTER TABLE public.bandi ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti possono vedere i bandi
CREATE POLICY "Tutti possono vedere bandi"
  ON public.bandi FOR SELECT
  USING (true);

-- Policy: Solo admin ed editore possono inserire
CREATE POLICY "Admin ed editore possono creare bandi"
  ON public.bandi FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'editore')
  );

-- Policy: Solo admin ed editore possono aggiornare
CREATE POLICY "Admin ed editore possono aggiornare bandi"
  ON public.bandi FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'editore')
  );

-- Policy: Solo admin può eliminare
CREATE POLICY "Admin può eliminare bandi"
  ON public.bandi FOR DELETE
  USING (has_role(auth.uid(), 'admin'));