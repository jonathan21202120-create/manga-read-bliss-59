-- Add unique constraint to profile names
ALTER TABLE public.profiles ADD CONSTRAINT profiles_nome_unique UNIQUE (nome);

-- Create index for better performance on name lookups
CREATE INDEX idx_profiles_nome ON public.profiles (nome);