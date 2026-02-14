-- Tabella per Investimenti Finanziabili
CREATE TABLE IF NOT EXISTS public.investimenti_finanziabili_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  attivo boolean NOT NULL DEFAULT true,
  ordine integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella per Spese Ammissibili
CREATE TABLE IF NOT EXISTS public.spese_ammissibili_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  attivo boolean NOT NULL DEFAULT true,
  ordine integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger per updated_at
CREATE TRIGGER handle_updated_at_investimenti_finanziabili 
  BEFORE UPDATE ON public.investimenti_finanziabili_options 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_spese_ammissibili 
  BEFORE UPDATE ON public.spese_ammissibili_options 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Inserire i valori esistenti per Investimenti Finanziabili
INSERT INTO public.investimenti_finanziabili_options (nome, ordine) VALUES
  ('Beni strumentali ordinari', 1),
  ('Beni strumentali tecnologici-4.0', 2),
  ('Riduzione consumi e efficientamento energetico', 3),
  ('Ristrutturazione, recupero patrimonio edilizio, manutenzione straordinaria', 4),
  ('Certificazioni (prodotto, processo, ambiente, etc.)', 5),
  ('Acquisto immobili strumentali', 6),
  ('Investimenti ambientali', 7),
  ('Formazione personale interno', 8),
  ('Assunzione di nuovo personale', 9),
  ('Servizi di consulenza e supporto all''innovazione', 10),
  ('Investimenti innovativi (software, e-commerce, digitalizzazione)', 11),
  ('Sviluppo e potenziamento settore e-commerce', 12),
  ('Progetti ambientali', 13),
  ('Marketing e comunicazione', 14),
  ('Servizi esterni di consulenza strategia', 15),
  ('Marchi e brevetti', 16),
  ('R&S - Ricerca e sviluppo', 17),
  ('Investimenti in nuove imprese, start-up e spin-off', 18),
  ('Progetti di rigenerazione urbana', 19),
  ('Investimenti energia rinnovabile', 20),
  ('Veicoli per trasporto merci e persone', 21),
  ('Impianti di videosorveglianza', 22),
  ('Sistemi di pagamento mobile e/o internet', 23);

-- Inserire i valori esistenti per Spese Ammissibili
INSERT INTO public.spese_ammissibili_options (nome, ordine) VALUES
  ('Macchinari e impianti di produzione', 1),
  ('Mezzi di sollevamento', 2),
  ('Automezzi per trasporto merci e persone', 3),
  ('Hardware (PC, Server, Stampanti, Scanner, etc.)', 4),
  ('Software e licenze software', 5),
  ('Progettazione', 6),
  ('Certificazioni (prodotto, processo, ambiente, etc.)', 7),
  ('Corsi di formazione per personale dipendente', 8),
  ('Consulenze', 9),
  ('Ristrutturazione locali', 10),
  ('Opere murarie per installazione impianti', 11),
  ('Impianti produttivi', 12),
  ('Spese generali', 13),
  ('Acquisto immobili (terreni e fabbricati)', 14),
  ('Spese per il personale', 15),
  ('Partecipazione a fiere ed eventi', 16),
  ('Servizi digitali', 17),
  ('Spese per campagne pubblicitarie', 18),
  ('Redazione business plan', 19),
  ('Brevetti e Marchi', 20),
  ('Canoni di locazione', 21),
  ('Allestimento area espositiva', 22);

-- RLS Policies per investimenti_finanziabili_options
ALTER TABLE public.investimenti_finanziabili_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono vedere opzioni investimenti attive"
  ON public.investimenti_finanziabili_options
  FOR SELECT
  USING (attivo = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Admin ed editore possono inserire opzioni investimenti"
  ON public.investimenti_finanziabili_options
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Admin ed editore possono aggiornare opzioni investimenti"
  ON public.investimenti_finanziabili_options
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Admin possono eliminare opzioni investimenti"
  ON public.investimenti_finanziabili_options
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies per spese_ammissibili_options
ALTER TABLE public.spese_ammissibili_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono vedere opzioni spese attive"
  ON public.spese_ammissibili_options
  FOR SELECT
  USING (attivo = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Admin ed editore possono inserire opzioni spese"
  ON public.spese_ammissibili_options
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Admin ed editore possono aggiornare opzioni spese"
  ON public.spese_ammissibili_options
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Admin possono eliminare opzioni spese"
  ON public.spese_ammissibili_options
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));