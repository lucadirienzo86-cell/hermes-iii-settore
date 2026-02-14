-- Rimuovo la vecchia policy con WITH CHECK (true) che è rimasta per errore
DROP POLICY IF EXISTS "Audit log insert per autenticati" ON public.audit_log_terzo_settore;