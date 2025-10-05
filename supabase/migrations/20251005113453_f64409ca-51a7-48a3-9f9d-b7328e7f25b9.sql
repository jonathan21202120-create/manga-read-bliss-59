-- Drop the old view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view with SECURITY INVOKER to respect RLS policies
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker=on) AS
SELECT 
  user_id,
  nome,
  avatar_url
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;