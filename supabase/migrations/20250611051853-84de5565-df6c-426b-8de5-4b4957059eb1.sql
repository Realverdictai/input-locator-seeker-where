
-- First, create the user_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.user_type AS ENUM ('pi_lawyer', 'insurance_defense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table with proper structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_type user_type NOT NULL,
  company_name TEXT,
  bar_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Ensure case_evaluations table has proper RLS policies
ALTER TABLE public.case_evaluations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate case_evaluations policies
DROP POLICY IF EXISTS "Users can view their own evaluations" ON public.case_evaluations;
DROP POLICY IF EXISTS "Users can create their own evaluations" ON public.case_evaluations;
DROP POLICY IF EXISTS "Users can update their own evaluations" ON public.case_evaluations;

CREATE POLICY "Users can view their own evaluations" 
  ON public.case_evaluations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evaluations" 
  ON public.case_evaluations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations" 
  ON public.case_evaluations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Ensure mediation_sessions table has proper RLS policies
ALTER TABLE public.mediation_sessions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate mediation_sessions policies
DROP POLICY IF EXISTS "Users can view mediation sessions they're part of" ON public.mediation_sessions;
DROP POLICY IF EXISTS "Users can create mediation sessions" ON public.mediation_sessions;
DROP POLICY IF EXISTS "Users can update mediation sessions they're part of" ON public.mediation_sessions;

CREATE POLICY "Users can view mediation sessions they're part of" 
  ON public.mediation_sessions 
  FOR SELECT 
  USING (auth.uid() = pi_lawyer_id OR auth.uid() = insurance_id);

CREATE POLICY "Users can create mediation sessions" 
  ON public.mediation_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = pi_lawyer_id OR auth.uid() = insurance_id);

CREATE POLICY "Users can update mediation sessions they're part of" 
  ON public.mediation_sessions 
  FOR UPDATE 
  USING (auth.uid() = pi_lawyer_id OR auth.uid() = insurance_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, company_name, bar_number, phone)
  VALUES (
    NEW.id, 
    (NEW.raw_user_meta_data ->> 'user_type')::user_type,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'bar_number',
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
