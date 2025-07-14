-- Configure authentication webhook for custom email templates
-- This will use our custom email function instead of the default Supabase emails

-- First, let's ensure we have proper email redirect handling
-- Update auth configuration to use custom email templates
UPDATE auth.config 
SET raw_config = jsonb_set(
  COALESCE(raw_config, '{}'),
  '{MAILER_TEMPLATES_CONFIRMATION}',
  '"supabase/functions/send-welcome-email"'
) WHERE TRUE;

-- Set up webhook URL for auth events (this will be configured in the dashboard)
-- The webhook should point to: https://[your-project-ref].supabase.co/functions/v1/send-welcome-email

-- Ensure proper site URL is configured for redirects
-- This prevents the "weird" login issues
INSERT INTO auth.config (key, value) VALUES 
  ('SITE_URL', 'https://hueccsiuyxjqupxkfhkl.supabase.co')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add additional allowed redirect URLs
INSERT INTO auth.config (key, value) VALUES 
  ('ADDITIONAL_REDIRECT_URLS', 'http://localhost:3000,https://your-domain.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;