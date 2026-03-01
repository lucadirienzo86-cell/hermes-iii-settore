-- Tabella per le subscription push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Tabella per lo storico notifiche inviate
CREATE TABLE public.push_notifications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titolo TEXT NOT NULL,
  corpo TEXT,
  dati JSONB,
  letto BOOLEAN DEFAULT false,
  inviato_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella per tracciare i bandi già notificati all'utente
CREATE TABLE public.bandi_notificati (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bando_id UUID REFERENCES public.bandi(id) ON DELETE CASCADE,
  avviso_id UUID REFERENCES public.avvisi_fondi(id) ON DELETE CASCADE,
  notificato_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bando_id),
  CONSTRAINT check_bando_or_avviso CHECK (bando_id IS NOT NULL OR avviso_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bandi_notificati ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
DO $$ BEGIN
  CREATE POLICY "Users can view their own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS Policies for push_notifications_log
DO $$ BEGIN
  CREATE POLICY "Users can view their own notifications"
  ON public.push_notifications_log FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own notifications"
  ON public.push_notifications_log FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- RLS Policies for bandi_notificati
DO $$ BEGIN
  CREATE POLICY "Users can view their own notified bandi"
  ON public.bandi_notificati FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own notified bandi"
  ON public.bandi_notificati FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger per updated_at
DO $$ BEGIN
  CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Indici per performance
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_notifications_log_user_id ON public.push_notifications_log(user_id);
CREATE INDEX idx_bandi_notificati_user_id ON public.bandi_notificati(user_id);
CREATE INDEX idx_bandi_notificati_bando_id ON public.bandi_notificati(bando_id);
CREATE INDEX idx_bandi_notificati_avviso_id ON public.bandi_notificati(avviso_id);