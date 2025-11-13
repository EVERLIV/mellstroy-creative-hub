-- Fix: Add language and level columns to classes table if they don't exist
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS language TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS level TEXT;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name IN ('language', 'level');

