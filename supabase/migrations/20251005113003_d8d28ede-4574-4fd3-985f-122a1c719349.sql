-- Drop the insecure public policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policy: users can only view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a public view with only non-sensitive data (nome and avatar)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  nome,
  avatar_url
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Create a helper function to get public profile info
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  nome text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    nome,
    avatar_url
  FROM public.profiles
  WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated, anon;