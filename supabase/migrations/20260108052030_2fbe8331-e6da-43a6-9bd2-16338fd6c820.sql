-- Create badge_categorie table
CREATE TABLE public.badge_categorie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  icona TEXT,
  colore TEXT DEFAULT '#3B82F6',
  ordine INTEGER DEFAULT 0,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badge_categorie ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badge_categorie
DO $$ BEGIN
  CREATE POLICY "Admins can manage badge_categorie" 
  ON public.badge_categorie 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone authenticated can view active badge_categorie" 
  ON public.badge_categorie 
  FOR SELECT 
  USING ((auth.uid() IS NOT NULL) AND (attivo = true));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add categoria_id to badge_tipi
ALTER TABLE public.badge_tipi 
ADD COLUMN categoria_id UUID REFERENCES public.badge_categorie(id) ON DELETE SET NULL;

-- Create trigger for updated_at on badge_categorie
DO $$ BEGIN
  CREATE TRIGGER update_badge_categorie_updated_at
  BEFORE UPDATE ON public.badge_categorie
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Insert seed categories
INSERT INTO public.badge_categorie (nome, descrizione, icona, colore, ordine) VALUES
('Informatica & Digitale', 'Formazione su competenze digitali, tecnologie informatiche e innovazione', 'Monitor', '#3B82F6', 1),
('Gestione Aziendale', 'Competenze per la gestione, organizzazione e amministrazione aziendale', 'Briefcase', '#8B5CF6', 2),
('Marketing & Vendite', 'Strategie commerciali, comunicazione e sviluppo mercati', 'TrendingUp', '#EC4899', 3),
('Sicurezza & Compliance', 'Normative, sicurezza sul lavoro e conformità legale', 'Shield', '#EF4444', 4),
('Soft Skills', 'Competenze trasversali, comunicazione e sviluppo personale', 'Users', '#10B981', 5),
('Sostenibilità & Ambiente', 'Economia circolare, green economy e responsabilità ambientale', 'Leaf', '#22C55E', 6),
('Lingue & Internazionalizzazione', 'Competenze linguistiche e apertura mercati esteri', 'Globe', '#F59E0B', 7),
('Produzione & Qualità', 'Ottimizzazione processi produttivi e sistemi qualità', 'Settings', '#6B7280', 8);

-- Update existing badges with categoria_id and descriptions
-- Informatica & Digitale
UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale'),
  descrizione = 'Utilizzo base di PC, pacchetto Office, navigazione internet e strumenti digitali quotidiani'
WHERE nome = 'Informatica di base';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale'),
  descrizione = 'Protezione dati aziendali, sicurezza informatica, prevenzione attacchi cyber e gestione rischi IT'
WHERE nome = 'Cybersecurity';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale'),
  descrizione = 'Fondamenti di AI, machine learning, automazione processi e applicazioni pratiche in azienda'
WHERE nome = 'Intelligenza Artificiale';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale'),
  descrizione = 'Vendita online, piattaforme e-commerce, marketplace digitali e strategie di vendita web'
WHERE nome = 'E-commerce';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale'),
  descrizione = 'Trasformazione digitale, Industria 4.0, nuove tecnologie e innovazione di processo'
WHERE nome = 'Innovazione digitale';

-- Gestione Aziendale
UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Gestione Aziendale'),
  descrizione = 'Metodologie agile, waterfall, pianificazione progetti, gestione team e raggiungimento obiettivi'
WHERE nome = 'Project Management';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Gestione Aziendale'),
  descrizione = 'Gestione del personale, selezione, valutazione performance, sviluppo talenti e organizzazione'
WHERE nome = 'Risorse Umane';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Gestione Aziendale'),
  descrizione = 'Pianificazione finanziaria, budget, analisi costi, KPI aziendali e reporting direzionale'
WHERE nome = 'Controllo di gestione';

-- Marketing & Vendite
UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Marketing & Vendite'),
  descrizione = 'Strategie marketing, comunicazione aziendale, branding, social media e promozione'
WHERE nome = 'Marketing e comunicazione';

-- Sicurezza & Compliance
UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Sicurezza & Compliance'),
  descrizione = 'Normativa D.Lgs 81/08, prevenzione infortuni, formazione obbligatoria e cultura della sicurezza'
WHERE nome = 'Sicurezza sul lavoro';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Sicurezza & Compliance'),
  descrizione = 'Regolamento GDPR, protezione dati personali, privacy by design e gestione consensi'
WHERE nome = 'Privacy e GDPR';

-- Soft Skills
UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Soft Skills'),
  descrizione = 'Comunicazione efficace, lavoro di squadra, leadership, problem solving e gestione conflitti'
WHERE nome = 'Soft skills';

-- Lingue & Internazionalizzazione
UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Lingue & Internazionalizzazione'),
  descrizione = 'Corsi di lingua straniera (inglese, francese, tedesco, spagnolo) per contesti professionali'
WHERE nome = 'Lingue straniere';

UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Lingue & Internazionalizzazione'),
  descrizione = 'Strategie export, mercati esteri, normative doganali, contrattualistica internazionale'
WHERE nome = 'Internazionalizzazione';

-- Sostenibilità & Ambiente
UPDATE public.badge_tipi SET 
  categoria_id = (SELECT id FROM public.badge_categorie WHERE nome = 'Sostenibilità & Ambiente'),
  descrizione = 'Gestione ambientale, normative green, economia circolare e responsabilità sociale'
WHERE nome = 'Sostenibilità e ambiente';

-- Insert new badges
INSERT INTO public.badge_tipi (nome, descrizione, icona, colore, ordine, categoria_id) VALUES
-- Informatica & Digitale
('Cloud Computing', 'Servizi cloud AWS, Azure, Google Cloud, migrazione e gestione infrastrutture', 'Cloud', '#3B82F6', 6, (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale')),
('Data Analytics', 'Analisi dati, Business Intelligence, dashboard, reportistica avanzata e data visualization', 'BarChart3', '#3B82F6', 7, (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale')),
('Programmazione', 'Sviluppo software, linguaggi di programmazione, web development e applicazioni', 'Code', '#3B82F6', 8, (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale')),
('Social Media Management', 'Gestione canali social, content creation, community management e advertising', 'Share2', '#3B82F6', 9, (SELECT id FROM public.badge_categorie WHERE nome = 'Informatica & Digitale')),

-- Gestione Aziendale
('Lean Manufacturing', 'Ottimizzazione processi produttivi, riduzione sprechi, metodologia lean e Six Sigma', 'Zap', '#8B5CF6', 4, (SELECT id FROM public.badge_categorie WHERE nome = 'Gestione Aziendale')),
('Supply Chain', 'Gestione catena approvvigionamento, logistica, magazzino e ottimizzazione flussi', 'Truck', '#8B5CF6', 5, (SELECT id FROM public.badge_categorie WHERE nome = 'Gestione Aziendale')),
('Change Management', 'Gestione del cambiamento organizzativo, trasformazione aziendale e leadership', 'RefreshCw', '#8B5CF6', 6, (SELECT id FROM public.badge_categorie WHERE nome = 'Gestione Aziendale')),
('Amministrazione e Finanza', 'Contabilità, bilancio, fiscalità, tesoreria e gestione finanziaria aziendale', 'Calculator', '#8B5CF6', 7, (SELECT id FROM public.badge_categorie WHERE nome = 'Gestione Aziendale')),

-- Marketing & Vendite
('Customer Experience', 'Gestione relazione cliente, CRM, fidelizzazione, customer journey e satisfaction', 'Heart', '#EC4899', 2, (SELECT id FROM public.badge_categorie WHERE nome = 'Marketing & Vendite')),
('Sales Management', 'Tecniche di vendita, negoziazione commerciale, gestione rete vendita e obiettivi', 'Target', '#EC4899', 3, (SELECT id FROM public.badge_categorie WHERE nome = 'Marketing & Vendite')),
('Digital Marketing', 'SEO, SEM, email marketing, content marketing, advertising online e analytics', 'MousePointer', '#EC4899', 4, (SELECT id FROM public.badge_categorie WHERE nome = 'Marketing & Vendite')),

-- Sicurezza & Compliance
('Qualità ISO', 'Sistemi di gestione qualità ISO 9001, certificazioni, audit e miglioramento continuo', 'Award', '#EF4444', 3, (SELECT id FROM public.badge_categorie WHERE nome = 'Sicurezza & Compliance')),
('Antiriciclaggio', 'Normativa AML, KYC, compliance finanziaria, segnalazioni sospette e due diligence', 'AlertTriangle', '#EF4444', 4, (SELECT id FROM public.badge_categorie WHERE nome = 'Sicurezza & Compliance')),
('HACCP e Sicurezza Alimentare', 'Igiene alimentare, normative HACCP, tracciabilità e controllo qualità food', 'Utensils', '#EF4444', 5, (SELECT id FROM public.badge_categorie WHERE nome = 'Sicurezza & Compliance')),

-- Soft Skills
('Public Speaking', 'Comunicazione efficace, presentazioni, gestione ansia e tecniche oratorie', 'Mic', '#10B981', 2, (SELECT id FROM public.badge_categorie WHERE nome = 'Soft Skills')),
('Time Management', 'Gestione tempo, produttività personale, prioritizzazione e organizzazione lavoro', 'Clock', '#10B981', 3, (SELECT id FROM public.badge_categorie WHERE nome = 'Soft Skills')),
('Problem Solving', 'Pensiero critico, risoluzione problemi, decision making e creatività', 'Lightbulb', '#10B981', 4, (SELECT id FROM public.badge_categorie WHERE nome = 'Soft Skills')),
('Leadership', 'Stili di leadership, motivazione team, delega efficace e sviluppo collaboratori', 'Crown', '#10B981', 5, (SELECT id FROM public.badge_categorie WHERE nome = 'Soft Skills')),
('Team Building', 'Costruzione team efficaci, collaborazione, dinamiche di gruppo e coesione', 'UserPlus', '#10B981', 6, (SELECT id FROM public.badge_categorie WHERE nome = 'Soft Skills')),

-- Sostenibilità & Ambiente
('Economia Circolare', 'Modelli business sostenibili, riuso, riciclo, design for sustainability', 'Recycle', '#22C55E', 2, (SELECT id FROM public.badge_categorie WHERE nome = 'Sostenibilità & Ambiente')),
('Carbon Footprint', 'Misurazione e riduzione impatto ambientale, bilancio carbonio e compensazione', 'Footprints', '#22C55E', 3, (SELECT id FROM public.badge_categorie WHERE nome = 'Sostenibilità & Ambiente')),
('ESG e Reporting', 'Criteri ESG, bilancio sostenibilità, rendicontazione non finanziaria e stakeholder', 'FileText', '#22C55E', 4, (SELECT id FROM public.badge_categorie WHERE nome = 'Sostenibilità & Ambiente')),

-- Produzione & Qualità
('Manutenzione Industriale', 'Manutenzione preventiva, predittiva, TPM e gestione impianti produttivi', 'Wrench', '#6B7280', 1, (SELECT id FROM public.badge_categorie WHERE nome = 'Produzione & Qualità')),
('Automazione Industriale', 'PLC, robotica, automazione processi produttivi e Industria 4.0', 'Cpu', '#6B7280', 2, (SELECT id FROM public.badge_categorie WHERE nome = 'Produzione & Qualità')),
('Controllo Qualità', 'Tecniche di controllo qualità, ispezioni, testing e gestione non conformità', 'CheckCircle', '#6B7280', 3, (SELECT id FROM public.badge_categorie WHERE nome = 'Produzione & Qualità'));