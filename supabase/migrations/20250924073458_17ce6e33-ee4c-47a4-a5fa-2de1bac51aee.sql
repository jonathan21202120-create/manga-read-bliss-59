-- Configure storage buckets for manga covers and pages
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('manga-covers', 'manga-covers', true),
  ('manga-pages', 'manga-pages', true);

-- Create storage policies for manga covers
CREATE POLICY "Anyone can view manga covers" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'manga-covers');

CREATE POLICY "Admins can upload manga covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'manga-covers' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can update manga covers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'manga-covers' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can delete manga covers" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'manga-covers' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE user_id = auth.uid()
));

-- Create storage policies for manga pages
CREATE POLICY "Anyone can view manga pages" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'manga-pages');

CREATE POLICY "Admins can upload manga pages" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'manga-pages' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can update manga pages" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'manga-pages' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can delete manga pages" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'manga-pages' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE user_id = auth.uid()
));

-- Add admin check function for cleaner policies
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = is_admin.user_id
  );
$$;

-- Update manga table policies to allow admin operations
DROP POLICY IF EXISTS "Anyone can view mangas" ON public.mangas;
CREATE POLICY "Anyone can view mangas" 
ON public.mangas 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert mangas" 
ON public.mangas 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update mangas" 
ON public.mangas 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete mangas" 
ON public.mangas 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update chapters table policies
DROP POLICY IF EXISTS "Anyone can view chapters" ON public.chapters;
CREATE POLICY "Anyone can view chapters" 
ON public.chapters 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert chapters" 
ON public.chapters 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update chapters" 
ON public.chapters 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete chapters" 
ON public.chapters 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add pages column to chapters for manga pages storage
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS pages_urls text[] DEFAULT '{}';

-- Create function to update reading progress
CREATE OR REPLACE FUNCTION public.update_reading_progress(
  p_user_id uuid,
  p_manga_id uuid,
  p_chapter_id uuid,
  p_current_page integer DEFAULT 1,
  p_is_completed boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.reading_progress (
    user_id, 
    manga_id, 
    chapter_id, 
    current_page, 
    is_completed,
    last_read_at
  ) VALUES (
    p_user_id,
    p_manga_id,
    p_chapter_id,
    p_current_page,
    p_is_completed,
    now()
  )
  ON CONFLICT (user_id, manga_id, chapter_id) 
  DO UPDATE SET
    current_page = EXCLUDED.current_page,
    is_completed = EXCLUDED.is_completed,
    last_read_at = EXCLUDED.last_read_at,
    updated_at = now();
END;
$$;

-- Create function to get user reading progress
CREATE OR REPLACE FUNCTION public.get_user_reading_progress(p_user_id uuid)
RETURNS TABLE (
  manga_id uuid,
  manga_title text,
  manga_cover_url text,
  chapter_id uuid,
  chapter_number integer,
  chapter_title text,
  current_page integer,
  total_pages integer,
  is_completed boolean,
  last_read_at timestamptz,
  progress_percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id as manga_id,
    m.title as manga_title,
    m.cover_url as manga_cover_url,
    c.id as chapter_id,
    c.chapter_number,
    c.title as chapter_title,
    rp.current_page,
    c.page_count as total_pages,
    rp.is_completed,
    rp.last_read_at,
    ROUND((rp.current_page::numeric / NULLIF(c.page_count, 0)::numeric) * 100, 1) as progress_percentage
  FROM reading_progress rp
  JOIN mangas m ON rp.manga_id = m.id
  JOIN chapters c ON rp.chapter_id = c.id
  WHERE rp.user_id = p_user_id
  ORDER BY rp.last_read_at DESC;
$$;