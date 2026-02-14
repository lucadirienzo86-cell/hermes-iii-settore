-- =============================================
-- SCHEMA CONTABILITÀ ETS - D.Lgs. 117/2017
-- Conforme DM 5 marzo 2020
-- =============================================

-- ENUM: Tipo movimento (entrata/uscita)
CREATE TYPE public.tipo_movimento AS ENUM ('entrata', 'uscita');

-- ENUM: Tipo modello ministeriale
CREATE TYPE public.modello_ministeriale AS ENUM ('mod_a', 'mod_b', 'mod_c', 'mod_d');

-- ENUM: Stato esercizio
CREATE TYPE public.stato_esercizio AS ENUM ('aperto', 'chiuso', 'in_elaborazione');

-- ENUM: Stato progetto contabile
CREATE TYPE public.stato_progetto_contabile AS ENUM ('attivo', 'completato', 'rendicontato', 'archiviato');

-- =============================================
-- TABELLA: Esercizi contabili
-- =============================================
CREATE TABLE public.esercizi_contabili (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id UUID NOT NULL REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  anno INTEGER NOT NULL,
  data_inizio DATE NOT NULL,
  data_fine DATE NOT NULL,
  stato public.stato_esercizio DEFAULT 'aperto',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(associazione_id, anno)
);

-- =============================================
-- TABELLA: Categorie ministeriali (voci bloccate)
-- Mappatura Mod. A, B, D secondo DM 5 marzo 2020
-- =============================================
CREATE TABLE public.categorie_contabili (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  modello public.modello_ministeriale NOT NULL,
  sezione VARCHAR(100), -- es: "ATTIVO", "PASSIVO", "ENTRATE", "USCITE"
  voce_principale VARCHAR(255), -- Voce in grassetto (non modificabile)
  sottovoce VARCHAR(255), -- Sottovoce (aggregabile)
  ordine INTEGER DEFAULT 0,
  modificabile BOOLEAN DEFAULT false, -- false = voce ministeriale bloccata
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELLA: Progetti (CIG/CUP per bandi)
-- =============================================
CREATE TABLE public.progetti_contabili (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id UUID NOT NULL REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  esercizio_id UUID REFERENCES public.esercizi_contabili(id) ON DELETE SET NULL,
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT,
  cig VARCHAR(20), -- Codice Identificativo Gara
  cup VARCHAR(20), -- Codice Unico di Progetto
  ente_finanziatore VARCHAR(255),
  importo_finanziato DECIMAL(12, 2),
  importo_rendicontato DECIMAL(12, 2) DEFAULT 0,
  data_inizio DATE,
  data_fine DATE,
  stato public.stato_progetto_contabile DEFAULT 'attivo',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELLA: Movimenti contabili (entrate/uscite)
-- =============================================
CREATE TABLE public.movimenti_contabili (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id UUID NOT NULL REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  esercizio_id UUID NOT NULL REFERENCES public.esercizi_contabili(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES public.categorie_contabili(id) ON DELETE RESTRICT,
  progetto_id UUID REFERENCES public.progetti_contabili(id) ON DELETE SET NULL,
  tipo public.tipo_movimento NOT NULL,
  data_movimento DATE NOT NULL,
  importo DECIMAL(12, 2) NOT NULL CHECK (importo > 0),
  descrizione TEXT NOT NULL,
  beneficiario_pagatore VARCHAR(255), -- Chi paga o riceve
  metodo_pagamento VARCHAR(50), -- contanti, bonifico, carta, etc.
  riferimento_documento VARCHAR(100), -- numero fattura, ricevuta, etc.
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELLA: Documenti contabili (allegati)
-- =============================================
CREATE TABLE public.documenti_contabili (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movimento_id UUID NOT NULL REFERENCES public.movimenti_contabili(id) ON DELETE CASCADE,
  nome_file VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  tipo_documento VARCHAR(50), -- fattura, ricevuta, bonifico, etc.
  mime_type VARCHAR(100),
  dimensione INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELLA: Relazioni di Missione (Mod. C)
-- =============================================
CREATE TABLE public.relazioni_missione (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id UUID NOT NULL REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  esercizio_id UUID NOT NULL REFERENCES public.esercizi_contabili(id) ON DELETE CASCADE,
  -- Sezioni obbligatorie
  missione_statutaria TEXT,
  attivita_interesse_generale TEXT,
  attivita_diverse TEXT,
  raccolta_fondi TEXT,
  numero_volontari INTEGER DEFAULT 0,
  numero_dipendenti INTEGER DEFAULT 0,
  numero_soci INTEGER DEFAULT 0,
  -- Altre sezioni
  situazione_economica TEXT,
  obiettivi_raggiunti TEXT,
  obiettivi_futuri TEXT,
  informazioni_aggiuntive TEXT,
  -- Stato
  bozza BOOLEAN DEFAULT true,
  data_approvazione DATE,
  approvato_da UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(associazione_id, esercizio_id)
);

-- =============================================
-- TABELLA: Rendiconti generati
-- =============================================
CREATE TABLE public.rendiconti_ets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id UUID NOT NULL REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  esercizio_id UUID NOT NULL REFERENCES public.esercizi_contabili(id) ON DELETE CASCADE,
  modello public.modello_ministeriale NOT NULL,
  dati_json JSONB NOT NULL, -- Snapshot dei dati al momento della generazione
  stato VARCHAR(50) DEFAULT 'bozza', -- bozza, in_elaborazione, definitivo
  file_pdf_path TEXT,
  file_excel_path TEXT,
  generato_da UUID REFERENCES public.profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELLA: Abbonamenti contabilità
-- =============================================
CREATE TABLE public.abbonamenti_contabilita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associazione_id UUID NOT NULL REFERENCES public.associazioni_terzo_settore(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'base', 'progetto'
  progetto_id UUID REFERENCES public.progetti_contabili(id) ON DELETE SET NULL,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stato VARCHAR(50) DEFAULT 'attivo', -- attivo, scaduto, cancellato
  data_inizio DATE NOT NULL,
  data_fine DATE,
  importo DECIMAL(10, 2),
  metodo_pagamento VARCHAR(50), -- stripe, manu_pay
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDICI
-- =============================================
CREATE INDEX idx_movimenti_associazione ON public.movimenti_contabili(associazione_id);
CREATE INDEX idx_movimenti_esercizio ON public.movimenti_contabili(esercizio_id);
CREATE INDEX idx_movimenti_data ON public.movimenti_contabili(data_movimento);
CREATE INDEX idx_movimenti_tipo ON public.movimenti_contabili(tipo);
CREATE INDEX idx_progetti_associazione ON public.progetti_contabili(associazione_id);
CREATE INDEX idx_progetti_cig ON public.progetti_contabili(cig);
CREATE INDEX idx_progetti_cup ON public.progetti_contabili(cup);
CREATE INDEX idx_documenti_movimento ON public.documenti_contabili(movimento_id);

-- =============================================
-- TRIGGER: updated_at automatico
-- =============================================
CREATE TRIGGER update_esercizi_contabili_updated_at
  BEFORE UPDATE ON public.esercizi_contabili
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movimenti_contabili_updated_at
  BEFORE UPDATE ON public.movimenti_contabili
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progetti_contabili_updated_at
  BEFORE UPDATE ON public.progetti_contabili
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_relazioni_missione_updated_at
  BEFORE UPDATE ON public.relazioni_missione
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rendiconti_ets_updated_at
  BEFORE UPDATE ON public.rendiconti_ets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_abbonamenti_contabilita_updated_at
  BEFORE UPDATE ON public.abbonamenti_contabilita
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.esercizi_contabili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorie_contabili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progetti_contabili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimenti_contabili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documenti_contabili ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relazioni_missione ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendiconti_ets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abbonamenti_contabilita ENABLE ROW LEVEL SECURITY;

-- Categorie: leggibili da tutti (sono voci ministeriali standard)
CREATE POLICY "Categorie contabili leggibili da tutti"
  ON public.categorie_contabili FOR SELECT
  USING (true);

-- Policy helper function per associazione
CREATE OR REPLACE FUNCTION public.get_user_associazione_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.associazioni_terzo_settore WHERE profile_id = auth.uid() LIMIT 1
$$;

-- Esercizi: solo la propria associazione
CREATE POLICY "Esercizi della propria associazione"
  ON public.esercizi_contabili FOR ALL
  USING (associazione_id = public.get_user_associazione_id());

-- Progetti: solo la propria associazione
CREATE POLICY "Progetti della propria associazione"
  ON public.progetti_contabili FOR ALL
  USING (associazione_id = public.get_user_associazione_id());

-- Movimenti: solo la propria associazione
CREATE POLICY "Movimenti della propria associazione"
  ON public.movimenti_contabili FOR ALL
  USING (associazione_id = public.get_user_associazione_id());

-- Documenti: accesso tramite movimento
CREATE POLICY "Documenti della propria associazione"
  ON public.documenti_contabili FOR ALL
  USING (
    movimento_id IN (
      SELECT id FROM public.movimenti_contabili 
      WHERE associazione_id = public.get_user_associazione_id()
    )
  );

-- Relazioni missione: solo la propria associazione
CREATE POLICY "Relazioni missione della propria associazione"
  ON public.relazioni_missione FOR ALL
  USING (associazione_id = public.get_user_associazione_id());

-- Rendiconti: solo la propria associazione
CREATE POLICY "Rendiconti della propria associazione"
  ON public.rendiconti_ets FOR ALL
  USING (associazione_id = public.get_user_associazione_id());

-- Abbonamenti: solo la propria associazione
CREATE POLICY "Abbonamenti della propria associazione"
  ON public.abbonamenti_contabilita FOR ALL
  USING (associazione_id = public.get_user_associazione_id());

-- Policy per admin/assessorato: accesso completo
CREATE POLICY "Admin accesso completo esercizi"
  ON public.esercizi_contabili FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assessorato_terzo_settore'));

CREATE POLICY "Admin accesso completo progetti"
  ON public.progetti_contabili FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assessorato_terzo_settore'));

CREATE POLICY "Admin accesso completo movimenti"
  ON public.movimenti_contabili FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assessorato_terzo_settore'));

CREATE POLICY "Admin accesso completo relazioni"
  ON public.relazioni_missione FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assessorato_terzo_settore'));

CREATE POLICY "Admin accesso completo rendiconti"
  ON public.rendiconti_ets FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'assessorato_terzo_settore'));

-- =============================================
-- DATI INIZIALI: Categorie Mod. D (Rendiconto per Cassa)
-- Secondo DM 5 marzo 2020
-- =============================================
INSERT INTO public.categorie_contabili (codice, nome, modello, sezione, voce_principale, ordine, modificabile) VALUES
-- ENTRATE
('D.A', 'Avanzo/Disavanzo esercizio precedente', 'mod_d', 'ENTRATE', 'A) Avanzo/Disavanzo esercizio precedente', 1, false),
('D.B', 'Entrate da attività di interesse generale', 'mod_d', 'ENTRATE', 'B) Entrate da attività di interesse generale', 10, false),
('D.B.1', 'Entrate da quote associative e apporti dei fondatori', 'mod_d', 'ENTRATE', NULL, 11, true),
('D.B.2', 'Entrate dagli associati per attività mutuali', 'mod_d', 'ENTRATE', NULL, 12, true),
('D.B.3', 'Entrate per prestazioni e cessioni ad associati e fondatori', 'mod_d', 'ENTRATE', NULL, 13, true),
('D.B.4', 'Erogazioni liberali', 'mod_d', 'ENTRATE', NULL, 14, true),
('D.B.5', 'Entrate del 5 per mille', 'mod_d', 'ENTRATE', NULL, 15, true),
('D.B.6', 'Contributi da soggetti privati', 'mod_d', 'ENTRATE', NULL, 16, true),
('D.B.7', 'Entrate per prestazioni e cessioni a terzi', 'mod_d', 'ENTRATE', NULL, 17, true),
('D.B.8', 'Contributi da enti pubblici', 'mod_d', 'ENTRATE', NULL, 18, true),
('D.B.9', 'Entrate da contratti con enti pubblici', 'mod_d', 'ENTRATE', NULL, 19, true),
('D.B.10', 'Altre entrate', 'mod_d', 'ENTRATE', NULL, 20, true),
('D.C', 'Entrate da attività diverse', 'mod_d', 'ENTRATE', 'C) Entrate da attività diverse', 30, false),
('D.C.1', 'Entrate da attività diverse', 'mod_d', 'ENTRATE', NULL, 31, true),
('D.D', 'Entrate da attività di raccolta fondi', 'mod_d', 'ENTRATE', 'D) Entrate da attività di raccolta fondi', 40, false),
('D.D.1', 'Entrate da raccolta fondi abituali', 'mod_d', 'ENTRATE', NULL, 41, true),
('D.D.2', 'Entrate da raccolta fondi occasionali', 'mod_d', 'ENTRATE', NULL, 42, true),
('D.E', 'Entrate da attività finanziarie e patrimoniali', 'mod_d', 'ENTRATE', 'E) Entrate da attività finanziarie e patrimoniali', 50, false),
('D.E.1', 'Entrate da rapporti bancari', 'mod_d', 'ENTRATE', NULL, 51, true),
('D.E.2', 'Altre entrate finanziarie', 'mod_d', 'ENTRATE', NULL, 52, true),
('D.F', 'Entrate di supporto generale', 'mod_d', 'ENTRATE', 'F) Entrate di supporto generale', 60, false),
('D.F.1', 'Entrate di supporto generale', 'mod_d', 'ENTRATE', NULL, 61, true),
-- USCITE
('D.G', 'Uscite da attività di interesse generale', 'mod_d', 'USCITE', 'G) Uscite da attività di interesse generale', 100, false),
('D.G.1', 'Materie prime, sussidiarie, di consumo e di merci', 'mod_d', 'USCITE', NULL, 101, true),
('D.G.2', 'Servizi', 'mod_d', 'USCITE', NULL, 102, true),
('D.G.3', 'Godimento beni di terzi', 'mod_d', 'USCITE', NULL, 103, true),
('D.G.4', 'Personale', 'mod_d', 'USCITE', NULL, 104, true),
('D.G.5', 'Uscite diverse di gestione', 'mod_d', 'USCITE', NULL, 105, true),
('D.H', 'Uscite da attività diverse', 'mod_d', 'USCITE', 'H) Uscite da attività diverse', 110, false),
('D.H.1', 'Uscite da attività diverse', 'mod_d', 'USCITE', NULL, 111, true),
('D.I', 'Uscite da attività di raccolta fondi', 'mod_d', 'USCITE', 'I) Uscite da attività di raccolta fondi', 120, false),
('D.I.1', 'Uscite per raccolta fondi abituali', 'mod_d', 'USCITE', NULL, 121, true),
('D.I.2', 'Uscite per raccolta fondi occasionali', 'mod_d', 'USCITE', NULL, 122, true),
('D.L', 'Uscite da attività finanziarie e patrimoniali', 'mod_d', 'USCITE', 'L) Uscite da attività finanziarie e patrimoniali', 130, false),
('D.L.1', 'Interessi passivi e oneri finanziari', 'mod_d', 'USCITE', NULL, 131, true),
('D.L.2', 'Altre uscite finanziarie', 'mod_d', 'USCITE', NULL, 132, true),
('D.M', 'Uscite di supporto generale', 'mod_d', 'USCITE', 'M) Uscite di supporto generale', 140, false),
('D.M.1', 'Materie prime, sussidiarie, di consumo e di merci', 'mod_d', 'USCITE', NULL, 141, true),
('D.M.2', 'Servizi', 'mod_d', 'USCITE', NULL, 142, true),
('D.M.3', 'Godimento beni di terzi', 'mod_d', 'USCITE', NULL, 143, true),
('D.M.4', 'Personale', 'mod_d', 'USCITE', NULL, 144, true),
('D.M.5', 'Altre uscite di supporto generale', 'mod_d', 'USCITE', NULL, 145, true);

-- Storage bucket per documenti contabili
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documenti-contabili', 'documenti-contabili', false)
ON CONFLICT (id) DO NOTHING;

-- Policy storage documenti contabili
CREATE POLICY "Documenti contabili accessibili alla propria associazione"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documenti-contabili' AND
  (storage.foldername(name))[1]::uuid = public.get_user_associazione_id()
)
WITH CHECK (
  bucket_id = 'documenti-contabili' AND
  (storage.foldername(name))[1]::uuid = public.get_user_associazione_id()
);