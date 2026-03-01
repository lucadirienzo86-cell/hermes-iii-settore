-- Enum per stato albo associazioni
DO $$ BEGIN
  CREATE TYPE stato_albo AS ENUM ('precaricata', 'attiva', 'non_iscritta', 'invitata', 'in_revisione');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum per fonte dato
DO $$ BEGIN
  CREATE TYPE fonte_dato_associazione AS ENUM ('albo_comunale', 'registrazione_autonoma');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum per stato comunicazione
DO $$ BEGIN
  CREATE TYPE stato_comunicazione AS ENUM ('bozza', 'inviata', 'aperta', 'non_aperta', 'completata', 'errore');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum per tipo comunicazione
DO $$ BEGIN
  CREATE TYPE tipo_comunicazione AS ENUM ('email', 'sms');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Aggiungere colonne alla tabella associazioni_terzo_settore
ALTER TABLE associazioni_terzo_settore 
ADD COLUMN IF NOT EXISTS stato_albo stato_albo DEFAULT 'precaricata',
ADD COLUMN IF NOT EXISTS fonte_dato fonte_dato_associazione DEFAULT 'registrazione_autonoma',
ADD COLUMN IF NOT EXISTS campi_completi boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_iscrizione_albo date,
ADD COLUMN IF NOT EXISTS notifica_assessorato boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_notifica_assessorato timestamp with time zone;

-- Tabella per tracciamento comunicazioni istituzionali
CREATE TABLE IF NOT EXISTS comunicazioni_istituzionali (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id uuid REFERENCES associazioni_terzo_settore(id) ON DELETE CASCADE,
  tipo tipo_comunicazione NOT NULL DEFAULT 'email',
  oggetto text NOT NULL,
  corpo text NOT NULL,
  stato stato_comunicazione NOT NULL DEFAULT 'bozza',
  email_destinatario text,
  telefono_destinatario text,
  data_invio timestamp with time zone,
  data_apertura timestamp with time zone,
  data_completamento timestamp with time zone,
  resend_id text,
  errore_dettaglio text,
  template_tipo text,
  link_azione text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_comunicazioni_associazione ON comunicazioni_istituzionali(associazione_id);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_stato ON comunicazioni_istituzionali(stato);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_tipo ON comunicazioni_istituzionali(tipo);
CREATE INDEX IF NOT EXISTS idx_associazioni_stato_albo ON associazioni_terzo_settore(stato_albo);

-- Enable RLS
ALTER TABLE comunicazioni_istituzionali ENABLE ROW LEVEL SECURITY;

-- Policy per utenti Comune/Assessorato (lettura e scrittura)
DO $$ BEGIN
  CREATE POLICY "Comune e Assessorato possono gestire comunicazioni"
  ON comunicazioni_istituzionali
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'comune') OR 
    public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'comune') OR 
    public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
    public.has_role(auth.uid(), 'admin')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy per associazioni (solo lettura delle proprie comunicazioni)
DO $$ BEGIN
  CREATE POLICY "Associazioni vedono le proprie comunicazioni"
  ON comunicazioni_istituzionali
  FOR SELECT
  TO authenticated
  USING (
    associazione_id IN (
      SELECT id FROM associazioni_terzo_settore WHERE profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger per updated_at
DO $$ BEGIN
  CREATE TRIGGER update_comunicazioni_updated_at
    BEFORE UPDATE ON comunicazioni_istituzionali
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Funzione per verificare completezza campi associazione
CREATE OR REPLACE FUNCTION check_associazione_campi_completi()
RETURNS TRIGGER AS $$
BEGIN
  NEW.campi_completi := (
    NEW.denominazione IS NOT NULL AND NEW.denominazione != '' AND
    NEW.codice_fiscale IS NOT NULL AND NEW.codice_fiscale != '' AND
    NEW.email IS NOT NULL AND NEW.email != '' AND
    NEW.telefono IS NOT NULL AND NEW.telefono != '' AND
    NEW.indirizzo IS NOT NULL AND NEW.indirizzo != ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER check_campi_completi_trigger
  BEFORE INSERT OR UPDATE ON associazioni_terzo_settore
  FOR EACH ROW
  EXECUTE FUNCTION check_associazione_campi_completi();

-- Enable realtime per comunicazioni
ALTER PUBLICATION supabase_realtime ADD TABLE comunicazioni_istituzionali;