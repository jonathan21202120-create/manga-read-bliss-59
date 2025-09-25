-- Add spoiler column to comments table
ALTER TABLE public.comments ADD COLUMN is_spoiler BOOLEAN DEFAULT FALSE;