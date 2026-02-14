-- Correggo la policy audit_log per essere più restrittiva
-- Solo i ruoli PA possono inserire nell'audit log (non tutti gli autenticati)
DROP POLICY IF EXISTS "Audit log insert per autenticati" ON public.audit_log_terzo_settore;

CREATE POLICY "Audit log insert per ruoli PA"
ON public.audit_log_terzo_settore FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'comune') OR
  public.has_role(auth.uid(), 'assessorato_terzo_settore') OR
  public.has_role(auth.uid(), 'associazione')
);