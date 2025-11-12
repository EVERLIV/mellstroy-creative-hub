-- Check if language and level columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name IN ('language', 'level');

-- If columns don't exist, add them:
-- ALTER TABLE public.classes 
-- ADD COLUMN IF NOT EXISTS language TEXT[] DEFAULT ARRAY[]::TEXT[],
-- ADD COLUMN IF NOT EXISTS level TEXT;

-- Verify current data in classes table
SELECT id, name, language, level 
FROM public.classes 
LIMIT 10;

