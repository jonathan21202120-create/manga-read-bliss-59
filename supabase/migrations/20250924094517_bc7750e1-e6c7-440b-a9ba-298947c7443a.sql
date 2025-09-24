-- Drop existing profiles table to recreate with new structure
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table with the specified structure
CREATE TABLE public.profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  idade INTEGER NOT NULL CHECK (idade >= 13),
  preferencias TEXT[] DEFAULT '{}',
  conteudo_adulto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger to automatically set conteudo_adulto based on age
CREATE OR REPLACE FUNCTION set_conteudo_adulto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.idade >= 18 THEN
    NEW.conteudo_adulto = COALESCE(NEW.conteudo_adulto, TRUE);
  ELSE
    NEW.conteudo_adulto = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_conteudo_adulto
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_conteudo_adulto();

-- Update handle_new_user function to not create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create profile automatically, let user create it via form
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add adult_content field to mangas table
ALTER TABLE public.mangas ADD COLUMN IF NOT EXISTS adult_content BOOLEAN DEFAULT FALSE;