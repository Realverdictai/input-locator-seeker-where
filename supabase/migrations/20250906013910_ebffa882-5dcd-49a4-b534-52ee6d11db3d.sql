-- Fix function search path issues for better security
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT user_type::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Update the handle_new_user function to also use proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert with explicit type casting and error handling
  INSERT INTO public.profiles (id, user_type, company_name, bar_number, phone)
  VALUES (
    NEW.id, 
    CAST(NEW.raw_user_meta_data ->> 'user_type' AS public.user_type),
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'bar_number',
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;