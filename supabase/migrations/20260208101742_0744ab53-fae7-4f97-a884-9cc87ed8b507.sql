-- =============================================
-- ENUM per ruoli PA (Funzionario, Assessore, Amministratore)
-- =============================================
DO $$ BEGIN
  CREATE TYPE public.ruolo_pa AS ENUM ('funzionario', 'assessore', 'amministratore');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================
-- Tabella utenti istituzionali (dipendenti Comune)
-- =============================================
CREATE TABLE public.utenti_istituzionali (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  ruolo_pa ruolo_pa NOT NULL DEFAULT 'funzionario',
  ufficio TEXT,
  email_istituzionale TEXT,
  telefono TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.utenti_istituzionali ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$ BEGIN
  CREATE POLICY "Utenti istituzionali visibili ai ruoli PA"
  ON public.utenti_istituzionali FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'comune') OR
    public.has_role(auth.uid(), 'assessorato_terzo_settore')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin può gestire utenti istituzionali"
  ON public.utenti_istituzionali FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================
-- Tabella Audit Log per tracciamento eventi
-- =============================================
CREATE TABLE public.audit_log_terzo_settore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'associazione', 'comunicazione', 'utente'
  entity_id UUID NOT NULL,
  azione TEXT NOT NULL, -- 'creazione', 'modifica', 'invio_invito', 'approvazione', etc.
  dettagli JSONB,
  eseguito_da UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_log_terzo_settore ENABLE ROW LEVEL SECURITY;

-- Policy: solo ruoli PA possono vedere l'audit log
DO $$ BEGIN
  CREATE POLICY "Audit log visibile ai ruoli PA"
  ON public.audit_log_terzo_settore FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'comune') OR
    public.has_role(auth.uid(), 'assessorato_terzo_settore')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policy: insert per utenti autenticati (sistema registra le azioni)
DO $$ BEGIN
  CREATE POLICY "Audit log insert per autenticati"
  ON public.audit_log_terzo_settore FOR INSERT
  TO authenticated
  WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================
-- Tabella Template Comunicazioni (fissi, non modificabili)
-- =============================================
CREATE TABLE public.template_comunicazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice TEXT UNIQUE NOT NULL, -- 'INVITO_REGISTRAZIONE', 'SOLLECITO_DATI', etc.
  nome TEXT NOT NULL,
  oggetto TEXT NOT NULL,
  corpo TEXT NOT NULL,
  tipo tipo_comunicazione DEFAULT 'email',
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_comunicazioni ENABLE ROW LEVEL SECURITY;

-- Policy: lettura per ruoli PA
DO $$ BEGIN
  CREATE POLICY "Template visibili ai ruoli PA"
  ON public.template_comunicazioni FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'comune') OR
    public.has_role(auth.uid(), 'assessorato_terzo_settore')
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================
-- Inserimento template comunicazioni predefiniti
-- =============================================
INSERT INTO public.template_comunicazioni (codice, nome, oggetto, corpo, tipo) VALUES
  ('INVITO_REGISTRAZIONE', 'Invito Registrazione', 
   'Invito a completare la registrazione - Comune di Cassino',
   'Gentile Associazione,

il Comune di Cassino La invita a completare la registrazione sulla piattaforma istituzionale del Terzo Settore.

Acceda al link seguente per inserire i dati della Sua associazione:
{{LINK_REGISTRAZIONE}}

Cordiali saluti,
Assessorato al Terzo Settore
Comune di Cassino',
   'email'),
  
  ('SOLLECITO_DATI', 'Sollecito Completamento Dati',
   'Sollecito completamento dati anagrafici - Comune di Cassino',
   'Gentile Associazione,

La informiamo che la Sua anagrafica risulta incompleta.

La preghiamo di accedere alla piattaforma e completare i dati mancanti:
{{LINK_PROFILO}}

Per qualsiasi chiarimento, contatti l''Assessorato al Terzo Settore.

Cordiali saluti,
Comune di Cassino',
   'email'),

  ('CONFERMA_ISCRIZIONE_ALBO', 'Conferma Iscrizione Albo',
   'Conferma iscrizione Albo Comunale - Comune di Cassino',
   'Gentile Associazione,

con la presente La informiamo che la Sua associazione è stata iscritta all''Albo Comunale delle Associazioni.

Potrà accedere a tutti i servizi dedicati tramite la piattaforma.

Cordiali saluti,
Assessorato al Terzo Settore
Comune di Cassino',
   'email'),

  ('RICHIESTA_ISCRIZIONE_ALBO', 'Istruzioni Iscrizione Albo',
   'Procedura iscrizione Albo Comunale - Comune di Cassino',
   'Gentile Associazione,

la Sua associazione risulta attiva sulla piattaforma ma non ancora iscritta all''Albo Comunale.

Per procedere con l''iscrizione, segua le istruzioni al seguente link:
{{LINK_PROCEDURA_ALBO}}

Documentazione richiesta:
- Statuto dell''associazione
- Atto costitutivo
- Codice fiscale
- Elenco soci fondatori

Per informazioni: terzo.settore@comune.cassino.fr.it

Cordiali saluti,
Comune di Cassino',
   'email');

-- =============================================
-- Funzione per registrare audit log
-- =============================================
CREATE OR REPLACE FUNCTION public.registra_audit_log(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_azione TEXT,
  p_dettagli JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_log_terzo_settore (entity_type, entity_id, azione, dettagli, eseguito_da)
  VALUES (p_entity_type, p_entity_id, p_azione, p_dettagli, auth.uid())
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- =============================================
-- Trigger per audit automatico su associazioni
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_associazione_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.registra_audit_log(
      'associazione',
      NEW.id,
      'creazione',
      jsonb_build_object('denominazione', NEW.denominazione, 'fonte_dato', NEW.fonte_dato)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log cambio stato albo
    IF OLD.stato_albo IS DISTINCT FROM NEW.stato_albo THEN
      PERFORM public.registra_audit_log(
        'associazione',
        NEW.id,
        'cambio_stato_albo',
        jsonb_build_object('stato_precedente', OLD.stato_albo, 'stato_nuovo', NEW.stato_albo)
      );
    END IF;
    -- Log validazione dati
    IF OLD.campi_completi IS DISTINCT FROM NEW.campi_completi AND NEW.campi_completi = true THEN
      PERFORM public.registra_audit_log(
        'associazione',
        NEW.id,
        'anagrafica_completata',
        NULL
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trigger_audit_associazioni
  AFTER INSERT OR UPDATE ON public.associazioni_terzo_settore
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_associazione_changes();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================
-- Trigger per audit automatico su comunicazioni
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_comunicazione_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.registra_audit_log(
      'comunicazione',
      NEW.id,
      'invio_comunicazione',
      jsonb_build_object('tipo', NEW.tipo, 'oggetto', NEW.oggetto, 'destinatario', NEW.email_destinatario)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stato IS DISTINCT FROM NEW.stato THEN
      PERFORM public.registra_audit_log(
        'comunicazione',
        NEW.id,
        'cambio_stato_comunicazione',
        jsonb_build_object('stato_precedente', OLD.stato, 'stato_nuovo', NEW.stato)
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trigger_audit_comunicazioni
  AFTER INSERT OR UPDATE ON public.comunicazioni_istituzionali
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_comunicazione_changes();
EXCEPTION WHEN OTHERS THEN NULL; END $$;