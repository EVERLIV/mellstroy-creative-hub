-- Add sport_category and district columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS sport_category TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;