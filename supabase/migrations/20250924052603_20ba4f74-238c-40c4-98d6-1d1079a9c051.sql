-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_streak INTEGER NOT NULL DEFAULT 0,
  total_mangas_read INTEGER NOT NULL DEFAULT 0,
  favorites INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_chapters INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mangas table
CREATE TABLE public.mangas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ongoing',
  genre TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  author TEXT NOT NULL,
  artist TEXT,
  year INTEGER NOT NULL,
  total_reads INTEGER NOT NULL DEFAULT 0,
  followers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manga_id UUID NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  release_date DATE NOT NULL DEFAULT CURRENT_DATE,
  page_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(manga_id, chapter_number)
);

-- Create reading_progress table
CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  current_page INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.mangas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mangas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for mangas (public read)
CREATE POLICY "Anyone can view mangas" ON public.mangas FOR SELECT USING (true);

-- Create RLS Policies for chapters (public read)
CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);

-- Create RLS Policies for reading_progress
CREATE POLICY "Users can view their own reading progress" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reading progress" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reading progress" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reading progress" ON public.reading_progress FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for comments
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mangas_updated_at BEFORE UPDATE ON public.mangas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample manga data
INSERT INTO public.mangas (id, title, cover_url, rating, status, genre, description, author, artist, year, total_reads, followers) VALUES
('11111111-1111-1111-1111-111111111111', 'One Piece', '/src/assets/manga-cover-1.jpg', 4.8, 'ongoing', ARRAY['Adventure', 'Comedy', 'Drama'], 'Gol D. Roger foi conhecido como o "Rei dos Piratas", o ser mais forte e mais infame a navegar na Grand Line. A captura e morte de Roger pelo Governo Mundial trouxe uma mudança em todo o mundo. Suas últimas palavras antes de sua execução revelaram a existência do maior tesouro do mundo, One Piece. Foi essa revelação que trouxe a Grande Era da Pirataria, homens que sonhavam em encontrar One Piece—que promete uma quantidade ilimitada de riquezas e fama—e muito provavelmente o pináculo da glória e o título de Rei dos Piratas.', 'Eiichiro Oda', 'Eiichiro Oda', 1997, 150000, 45000),
('22222222-2222-2222-2222-222222222222', 'Naruto', '/src/assets/manga-cover-2.jpg', 4.7, 'completed', ARRAY['Action', 'Adventure', 'Martial Arts'], 'Naruto Uzumaki quer ser o melhor ninja do país. Ele está fazendo um progresso admirável, mas Naruto sabe que deve treinar mais e melhor para atingir seu objetivo. Momentos antes da formatura da Academia Ninja, Naruto falha em uma técnica importante. Agora ele deve enfrentar a possibilidade de nunca se tornar um ninja.', 'Masashi Kishimoto', 'Masashi Kishimoto', 1999, 120000, 38000),
('33333333-3333-3333-3333-333333333333', 'Attack on Titan', '/src/assets/manga-cover-3.jpg', 4.9, 'completed', ARRAY['Action', 'Drama', 'Horror'], 'Há mais de 100 anos, gigantes humanoides chamados Titãs apareceram e quase extinguiram a humanidade. Os humanos foram forçados a se esconder atrás de muralhas gigantes. Agora, um garoto chamado Eren Yeager jura exterminar todos os Titãs depois que eles destroem sua cidade natal e matam sua mãe.', 'Hajime Isayama', 'Hajime Isayama', 2009, 95000, 42000);

-- Insert sample chapters for each manga
INSERT INTO public.chapters (manga_id, chapter_number, title, page_count) VALUES
('11111111-1111-1111-1111-111111111111', 1, 'Romance Dawn', 20),
('11111111-1111-1111-1111-111111111111', 2, 'Versus Buggy the Clown', 18),
('11111111-1111-1111-1111-111111111111', 3, 'Tell No Lies', 19),
('22222222-2222-2222-2222-222222222222', 1, 'Uzumaki Naruto!', 22),
('22222222-2222-2222-2222-222222222222', 2, 'Konohamaru!!', 20),
('22222222-2222-2222-2222-222222222222', 3, 'Sasuke Uchiha!!', 21),
('33333333-3333-3333-3333-333333333333', 1, 'To You, in 2000 Years', 45),
('33333333-3333-3333-3333-333333333333', 2, 'That Day', 40),
('33333333-3333-3333-3333-333333333333', 3, 'A Dim Light Amid Despair', 42);