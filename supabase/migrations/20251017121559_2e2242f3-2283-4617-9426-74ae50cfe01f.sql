-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('impresa', 'professionista');

-- Create user_roles table (CRITICAL: roles must be in separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create profiles table (without role field - roles are in user_roles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create imprese table
CREATE TABLE public.imprese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ragione_sociale TEXT NOT NULL,
  partita_iva TEXT NOT NULL UNIQUE,
  codice_ateco TEXT,
  regione TEXT,
  settore TEXT,
  fabbisogni TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professionisti table
CREATE TABLE public.professionisti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  settore_consulenza TEXT,
  numero_clienti INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert role from metadata into user_roles
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imprese ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionisti ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for imprese
CREATE POLICY "Imprese can view their own data"
  ON public.imprese FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Imprese can update their own data"
  ON public.imprese FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Imprese can insert their own data"
  ON public.imprese FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for professionisti
CREATE POLICY "Professionisti can view their own data"
  ON public.professionisti FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Professionisti can update their own data"
  ON public.professionisti FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Professionisti can insert their own data"
  ON public.professionisti FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_imprese_profile_id ON public.imprese(profile_id);
CREATE INDEX idx_professionisti_profile_id ON public.professionisti(profile_id);