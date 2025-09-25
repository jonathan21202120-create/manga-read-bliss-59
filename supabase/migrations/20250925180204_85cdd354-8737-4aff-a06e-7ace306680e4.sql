-- Add unique constraint for reading progress
ALTER TABLE reading_progress 
ADD CONSTRAINT unique_user_manga_chapter 
UNIQUE (user_id, manga_id, chapter_id);