-- Remove the security definer function (security risk)
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

-- The public_profiles view is already created and safe to use
-- It only exposes non-sensitive data (nome and avatar_url)