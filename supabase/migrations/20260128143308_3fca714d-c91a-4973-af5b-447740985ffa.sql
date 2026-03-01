-- 1. Add new enum value to app_role
ALTER TYPE app_role ADD VALUE 'gestore_pratiche';

-- 2. Create gestori_pratiche table
CREATE TABLE public.gestori_pratiche (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cognome text NOT NULL,
  telefono text,
  categoria text NOT NULL CHECK (categoria IN ('avvisi', 'bandi')),
  attivo boolean DEFAULT true,
  note_admin text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create gestori_pratiche_assegnazioni table (relationship table)
CREATE TABLE public.gestori_pratiche_assegnazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gestore_pratiche_id uuid NOT NULL REFERENCES public.gestori_pratiche(id) ON DELETE CASCADE,
  gestore_id uuid REFERENCES public.gestori(id) ON DELETE CASCADE,
  docente_id uuid REFERENCES public.docenti(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT check_assignment CHECK (gestore_id IS NOT NULL OR docente_id IS NOT NULL),
  CONSTRAINT unique_gestore_assignment UNIQUE (gestore_pratiche_id, gestore_id),
  CONSTRAINT unique_docente_assignment UNIQUE (gestore_pratiche_id, docente_id)
);

-- 4. Enable RLS on new tables
ALTER TABLE public.gestori_pratiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestori_pratiche_assegnazioni ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for gestori_pratiche
DO $$ BEGIN
  CREATE POLICY "Admins can manage gestori_pratiche"
  ON public.gestori_pratiche FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Gestori pratiche can view their own record"
  ON public.gestori_pratiche FOR SELECT
  USING (profile_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Gestori pratiche can update their own record"
  ON public.gestori_pratiche FOR UPDATE
  USING (profile_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. RLS policies for gestori_pratiche_assegnazioni
DO $$ BEGIN
  CREATE POLICY "Admins can manage gestori_pratiche_assegnazioni"
  ON public.gestori_pratiche_assegnazioni FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Gestori pratiche can view their own assignments"
  ON public.gestori_pratiche_assegnazioni FOR SELECT
  USING (
    gestore_pratiche_id IN (
      SELECT id FROM public.gestori_pratiche WHERE profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 7. RLS policy for pratiche - allow gestore_pratiche to see assigned practices
DO $$ BEGIN
  CREATE POLICY "Gestori pratiche can view assigned pratiche"
  ON public.pratiche FOR SELECT
  USING (
    azienda_id IN (
      SELECT az.id FROM public.aziende az
      JOIN public.gestori_pratiche_assegnazioni gpa ON (
        gpa.gestore_id = az.inserita_da_gestore_id OR
        gpa.docente_id = az.inserita_da_docente_id
      )
      JOIN public.gestori_pratiche gp ON gp.id = gpa.gestore_pratiche_id
      WHERE gp.profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. RLS policy for aziende - allow gestore_pratiche to see assigned companies
DO $$ BEGIN
  CREATE POLICY "Gestori pratiche can view assigned aziende"
  ON public.aziende FOR SELECT
  USING (
    id IN (
      SELECT az.id FROM public.aziende az
      JOIN public.gestori_pratiche_assegnazioni gpa ON (
        gpa.gestore_id = az.inserita_da_gestore_id OR
        gpa.docente_id = az.inserita_da_docente_id
      )
      JOIN public.gestori_pratiche gp ON gp.id = gpa.gestore_pratiche_id
      WHERE gp.profile_id = auth.uid()
    )
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 9. Add trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_gestori_pratiche_updated_at
  BEFORE UPDATE ON public.gestori_pratiche
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN OTHERS THEN NULL; END $$;