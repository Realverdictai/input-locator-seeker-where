-- Grant admin access to the current user for CSV import functionality
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE id = '175f951d-8f57-486d-9505-53d6cbf0c3b4';