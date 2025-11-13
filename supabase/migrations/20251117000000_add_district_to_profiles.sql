-- Add district field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS district TEXT;

-- Create index on district for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_district ON profiles(district);

-- Update existing profiles: if location exists, copy it to district
UPDATE public.profiles
SET district = location
WHERE district IS NULL AND location IS NOT NULL;

