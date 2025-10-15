-- Drop existing function
DROP FUNCTION IF EXISTS get_user_reading_progress(UUID);

-- Create function to get user reading progress with manga details
CREATE OR REPLACE FUNCTION get_user_reading_progress(p_user_id UUID)
RETURNS TABLE (
  manga_id UUID,
  manga_title TEXT,
  manga_cover_url TEXT,
  manga_genre TEXT[],
  chapter_id UUID,
  chapter_number INTEGER,
  chapter_title TEXT,
  current_page INTEGER,
  total_pages INTEGER,
  is_completed BOOLEAN,
  last_read_at TIMESTAMP WITH TIME ZONE,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as manga_id,
    m.title as manga_title,
    m.cover_url as manga_cover_url,
    m.genre as manga_genre,
    c.id as chapter_id,
    c.chapter_number,
    c.title as chapter_title,
    rp.current_page,
    c.page_count as total_pages,
    rp.is_completed,
    rp.last_read_at,
    ROUND((rp.current_page::NUMERIC / NULLIF(c.page_count, 0)::NUMERIC) * 100, 2) as progress_percentage
  FROM reading_progress rp
  JOIN mangas m ON m.id = rp.manga_id
  JOIN chapters c ON c.id = rp.chapter_id
  WHERE rp.user_id = p_user_id
  ORDER BY rp.last_read_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;