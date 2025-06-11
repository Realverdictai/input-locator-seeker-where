
-- Create user types enum
CREATE TYPE public.user_type AS ENUM ('pi_lawyer', 'insurance_defense');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_type user_type NOT NULL,
  company_name TEXT,
  bar_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case evaluations table to store form submissions
CREATE TABLE public.case_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  case_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mediation sessions table
CREATE TABLE public.mediation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT UNIQUE NOT NULL,
  pi_lawyer_id UUID REFERENCES auth.users(id),
  insurance_id UUID REFERENCES auth.users(id),
  pi_evaluation_id UUID REFERENCES public.case_evaluations(id),
  insurance_evaluation_id UUID REFERENCES public.case_evaluations(id),
  mediation_proposal JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediation_sessions ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for case evaluations
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

-- Create RLS policies for mediation sessions
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
  INSERT INTO public.profiles (id, user_type, company_name)
  VALUES (
    NEW.id, 
    (NEW.raw_user_meta_data ->> 'user_type')::user_type,
    NEW.raw_user_meta_data ->> 'company_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
