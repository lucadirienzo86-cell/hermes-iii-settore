
-- 1. Pulisci le assegnazioni badge esistenti
DELETE FROM public.badge_assegnazioni;

-- 2. Pulisci i badge esistenti
DELETE FROM public.badge_tipi;

-- 3. Rimuovi la colonna categoria (non più necessaria)
ALTER TABLE public.badge_tipi DROP COLUMN IF EXISTS categoria;

-- 4. Inserisci i nuovi Badge Formativi
INSERT INTO public.badge_tipi (nome, descrizione, icona, colore, attivo) VALUES
('Cybersecurity', 'Sicurezza informatica, protezione reti e sistemi', '🔐', '#EF4444', true),
('Privacy e GDPR', 'Normativa privacy, protezione dati personali, compliance GDPR', '🛡️', '#8B5CF6', true),
('Lingue straniere', 'Inglese, francese, tedesco, spagnolo e altre lingue', '🌍', '#3B82F6', true),
('Informatica di base', 'Utilizzo PC, Office, strumenti digitali di produttività', '💻', '#06B6D4', true),
('Intelligenza Artificiale', 'AI, machine learning, automazione, prompt engineering', '🤖', '#EC4899', true),
('Marketing e comunicazione', 'Digital marketing, social media, brand management', '📢', '#F59E0B', true),
('Controllo di gestione', 'Contabilità, bilancio, finanza aziendale, budget', '📊', '#10B981', true),
('Sicurezza sul lavoro', 'D.Lgs 81/08, formazione obbligatoria, prevenzione rischi', '⚠️', '#F97316', true),
('Sostenibilità e ambiente', 'ESG, green economy, economia circolare, certificazioni ambientali', '🌱', '#22C55E', true),
('Soft skills', 'Leadership, teamwork, comunicazione efficace, problem solving', '🎯', '#A855F7', true),
('E-commerce', 'Vendita online, marketplace, logistica digitale', '🛒', '#6366F1', true),
('Internazionalizzazione', 'Export, mercati esteri, dogane, contrattualistica internazionale', '✈️', '#0EA5E9', true),
('Project Management', 'Gestione progetti, metodologie agile, pianificazione', '📋', '#84CC16', true),
('Risorse Umane', 'Gestione personale, selezione, formazione, sviluppo talenti', '👥', '#D946EF', true),
('Innovazione digitale', 'Trasformazione digitale, Industry 4.0, IoT', '🚀', '#14B8A6', true);

-- 5. Aggiungi colonna badge_formativi alla tabella avvisi_fondi
ALTER TABLE public.avvisi_fondi 
ADD COLUMN IF NOT EXISTS badge_formativi TEXT[] DEFAULT NULL;

-- 6. Aggiungi colonna badge_formativi alla tabella aziende
ALTER TABLE public.aziende 
ADD COLUMN IF NOT EXISTS badge_formativi TEXT[] DEFAULT NULL;

-- 7. Aggiungi colonna badge_formativi alla tabella docenti
ALTER TABLE public.docenti 
ADD COLUMN IF NOT EXISTS badge_formativi TEXT[] DEFAULT NULL;
