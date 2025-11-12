-- Add language and level columns to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS language TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS level TEXT;