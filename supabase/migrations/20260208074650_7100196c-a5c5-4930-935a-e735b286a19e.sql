-- STEP 1: Aggiungi nuovi ruoli per Terzo Settore
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comune';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assessorato_terzo_settore';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'associazione';