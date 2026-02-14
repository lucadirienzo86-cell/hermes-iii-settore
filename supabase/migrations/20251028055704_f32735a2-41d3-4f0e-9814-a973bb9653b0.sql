-- Create enum types for KPI system
CREATE TYPE operatore_kpi AS ENUM ('maggiore', 'minore', 'maggiore_uguale', 'minore_uguale', 'range', 'uguale');
CREATE TYPE tipo_dato_kpi AS ENUM ('importo', 'percentuale', 'rapporto');

-- Table: banche
CREATE TABLE public.banche (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_banca TEXT NOT NULL,
  descrizione TEXT,
  attivo BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: kpi_parametri_options
CREATE TABLE public.kpi_parametri_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codice TEXT NOT NULL UNIQUE,
  tipo_dato tipo_dato_kpi NOT NULL,
  unita_misura TEXT,
  descrizione TEXT,
  attivo BOOLEAN NOT NULL DEFAULT true,
  ordine INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: banche_kpi_requisiti
CREATE TABLE public.banche_kpi_requisiti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banca_id UUID NOT NULL REFERENCES public.banche(id) ON DELETE CASCADE,
  kpi_parametro_id UUID NOT NULL REFERENCES public.kpi_parametri_options(id) ON DELETE CASCADE,
  operatore operatore_kpi NOT NULL,
  valore_minimo NUMERIC NOT NULL,
  valore_massimo NUMERIC,
  obbligatorio BOOLEAN NOT NULL DEFAULT false,
  ordine_visualizzazione INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: aziende_kpi_valori
CREATE TABLE public.aziende_kpi_valori (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES public.aziende(id) ON DELETE CASCADE,
  kpi_parametro_id UUID NOT NULL REFERENCES public.kpi_parametri_options(id) ON DELETE CASCADE,
  valore NUMERIC NOT NULL,
  anno_riferimento INTEGER NOT NULL,
  fonte TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(azienda_id, kpi_parametro_id, anno_riferimento)
);

-- Table: banche_assegnazioni
CREATE TABLE public.banche_assegnazioni (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banca_id UUID NOT NULL REFERENCES public.banche(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assegnato_da UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(banca_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.banche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_parametri_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banche_kpi_requisiti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aziende_kpi_valori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banche_assegnazioni ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banche
CREATE POLICY "Admin/editore can manage banche"
  ON public.banche FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Gestori/collaboratori can view assigned banche"
  ON public.banche FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.banche_assegnazioni
      WHERE banca_id = id AND profile_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editore'::app_role)
  );

CREATE POLICY "Aziende can view active banche"
  ON public.banche FOR SELECT
  USING (
    attivo = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'azienda'::app_role
      )
    )
  );

-- RLS Policies for kpi_parametri_options
CREATE POLICY "Admin/editore can manage kpi_parametri_options"
  ON public.kpi_parametri_options FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Authenticated users can view active kpi_parametri_options"
  ON public.kpi_parametri_options FOR SELECT
  USING (attivo = true AND auth.uid() IS NOT NULL);

-- RLS Policies for banche_kpi_requisiti
CREATE POLICY "Admin/editore can manage banche_kpi_requisiti"
  ON public.banche_kpi_requisiti FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Users can view requisiti for visible banche"
  ON public.banche_kpi_requisiti FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.banche
      WHERE banche.id = banca_id
      AND (
        banche.attivo = true
        OR EXISTS (
          SELECT 1 FROM public.banche_assegnazioni
          WHERE banche_assegnazioni.banca_id = banche.id
          AND banche_assegnazioni.profile_id = auth.uid()
        )
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'editore'::app_role)
      )
    )
  );

-- RLS Policies for aziende_kpi_valori
CREATE POLICY "Admin can manage all aziende_kpi_valori"
  ON public.aziende_kpi_valori FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gestori/collaboratori can manage their aziende kpi"
  ON public.aziende_kpi_valori FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.aziende
      WHERE aziende.id = azienda_id
      AND (
        aziende.inserita_da_gestore_id IN (
          SELECT id FROM public.gestori WHERE profile_id = auth.uid()
        )
        OR aziende.inserita_da_collaboratore_id IN (
          SELECT id FROM public.collaboratori WHERE profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Aziende can manage their own kpi"
  ON public.aziende_kpi_valori FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.aziende
      WHERE aziende.id = azienda_id
      AND aziende.profile_id = auth.uid()
    )
  );

-- RLS Policies for banche_assegnazioni
CREATE POLICY "Admin/editore can manage banche_assegnazioni"
  ON public.banche_assegnazioni FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editore'::app_role));

CREATE POLICY "Users can view their own assegnazioni"
  ON public.banche_assegnazioni FOR SELECT
  USING (profile_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_banche_kpi_requisiti_banca_id ON public.banche_kpi_requisiti(banca_id);
CREATE INDEX idx_aziende_kpi_valori_azienda_anno ON public.aziende_kpi_valori(azienda_id, anno_riferimento);
CREATE INDEX idx_banche_assegnazioni_profile_id ON public.banche_assegnazioni(profile_id);

-- Triggers for updated_at
CREATE TRIGGER update_banche_updated_at
  BEFORE UPDATE ON public.banche
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_kpi_parametri_options_updated_at
  BEFORE UPDATE ON public.kpi_parametri_options
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_banche_kpi_requisiti_updated_at
  BEFORE UPDATE ON public.banche_kpi_requisiti
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_aziende_kpi_valori_updated_at
  BEFORE UPDATE ON public.aziende_kpi_valori
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Populate default KPI parameters
INSERT INTO public.kpi_parametri_options (nome, codice, tipo_dato, unita_misura, descrizione, ordine) VALUES
('Ricavi operativi', 'ricavi_operativi', 'importo', '€', 'Totale ricavi derivanti dall''attività operativa dell''azienda', 1),
('Margine operativo lordo (EBITDA)', 'ebitda', 'importo', '€', 'Earnings Before Interest, Taxes, Depreciation and Amortization', 2),
('Totale attivo', 'totale_attivo', 'importo', '€', 'Somma di tutte le attività patrimoniali', 3),
('Totale passivo', 'totale_passivo', 'importo', '€', 'Somma di tutte le passività', 4),
('Patrimonio netto', 'patrimonio_netto', 'importo', '€', 'Differenza tra attività e passività', 5),
('Totale debiti', 'totale_debiti', 'importo', '€', 'Somma di tutti i debiti verso terzi', 6),
('Oneri finanziari', 'oneri_finanziari', 'importo', '€', 'Interessi e altri costi relativi ai finanziamenti', 7),
('Immobilizzazioni immateriali', 'immobilizzazioni_immateriali', 'importo', '€', 'Brevetti, marchi, software e altre attività immateriali', 8),
('Totale immobilizzazioni', 'totale_immobilizzazioni', 'importo', '€', 'Somma di immobilizzazioni materiali, immateriali e finanziarie', 9),
('Capitale sociale', 'capitale_sociale', 'importo', '€', 'Conferimenti dei soci', 10),
('Risultato operativo (EBIT)', 'ebit', 'importo', '€', 'Earnings Before Interest and Taxes', 11),
('ROE', 'roe', 'percentuale', '%', 'Return On Equity - Redditività del capitale proprio', 12),
('ROI', 'roi', 'percentuale', '%', 'Return On Investment - Redditività degli investimenti', 13),
('ROA', 'roa', 'percentuale', '%', 'Return On Assets - Redditività delle attività', 14),
('ROS', 'ros', 'percentuale', '%', 'Return On Sales - Margine di profitto sulle vendite', 15),
('Rapporto debito/patrimonio netto', 'debt_equity_ratio', 'rapporto', '', 'Leverage finanziario', 16),
('Indice di liquidità', 'indice_liquidita', 'rapporto', '', 'Capacità di far fronte agli impegni a breve termine', 17),
('Posizione Finanziaria Netta (PFN)', 'pfn', 'importo', '€', 'Differenza tra debiti finanziari e disponibilità liquide', 18),
('Cash flow operativo', 'cash_flow_operativo', 'importo', '€', 'Flusso di cassa generato dall''attività operativa', 19),
('Utile netto', 'utile_netto', 'importo', '€', 'Risultato finale dopo tasse e oneri', 20);