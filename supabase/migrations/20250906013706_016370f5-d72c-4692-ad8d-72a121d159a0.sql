-- First, create admin role if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('pi_lawyer', 'insurance_defense', 'admin');
    ELSE
        -- Add admin to existing enum if not present
        BEGIN
            ALTER TYPE user_type ADD VALUE 'admin';
        EXCEPTION
            WHEN duplicate_object THEN
                -- admin already exists, do nothing
                NULL;
        END;
    END IF;
END $$;

-- Create a security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT user_type::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view cases" ON public.cases_master;
DROP POLICY IF EXISTS "Authenticated users can insert cases" ON public.cases_master;
DROP POLICY IF EXISTS "Authenticated users can update cases" ON public.cases_master;
DROP POLICY IF EXISTS "Authenticated users can delete cases" ON public.cases_master;

-- Create new restrictive policies for cases_master

-- READ: All authenticated users can view cases (needed for case matching/analysis)
CREATE POLICY "Authenticated users can view cases"
ON public.cases_master
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Only admins can add new cases
CREATE POLICY "Only admins can insert cases"
ON public.cases_master
FOR INSERT
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

-- UPDATE: Only admins can modify cases
CREATE POLICY "Only admins can update cases"
ON public.cases_master
FOR UPDATE
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- DELETE: Only admins can delete cases
CREATE POLICY "Only admins can delete cases"
ON public.cases_master
FOR DELETE
TO authenticated
USING (public.get_current_user_role() = 'admin');