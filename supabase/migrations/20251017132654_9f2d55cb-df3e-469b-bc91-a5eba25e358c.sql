-- Aggiorna l'enum app_role per includere tutti i ruoli necessari
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestore';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'collaboratore';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'azienda';

-- Nota: 'editore' sarà un alias per 'collaboratore' nell'UI